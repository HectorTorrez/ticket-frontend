import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Calendar, MapPin, Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { PublicLayout } from "#/components/layouts/public-layout";
import { QueryErrorAlert } from "#/components/query-error-alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { fetchEventDetail } from "#/lib/api/ticket-api";
import { getSession, isCustomer } from "#/lib/auth/session";
import { eventsKeys } from "#/lib/query-keys";
import { cn } from "#/lib/utils";
import { useInventorySocket } from "#/routes/events/$eventSlugOrId/-hooks/use-inventory-socket";

export const Route = createFileRoute("/events/$eventSlugOrId/")({
	component: EventDetailPage,
});

function EventDetailPage() {
	const { eventSlugOrId } = Route.useParams();
	const navigate = useNavigate();

	const q = useQuery({
		queryKey: eventsKeys.detail(eventSlugOrId),
		queryFn: () => fetchEventDetail(eventSlugOrId),
	});

	useInventorySocket(eventSlugOrId, q.data?.id);

	const [qty, setQty] = useState<Record<string, number>>({});

	const lines = useMemo(() => {
		if (!q.data) return [];
		return q.data.ticketTypes
			.map((t) => ({
				ticketTypeId: t.id,
				quantity: qty[t.id] ?? 0,
			}))
			.filter((l) => l.quantity > 0);
	}, [q.data, qty]);

	const total = useMemo(() => {
		if (!q.data) return 0;
		return q.data.ticketTypes.reduce((sum, t) => {
			const n = qty[t.id] ?? 0;
			return sum + Number(t.price) * n;
		}, 0);
	}, [q.data, qty]);

	const setQuantity = (id: string, value: number) => {
		setQty((prev) => ({ ...prev, [id]: Math.max(0, value) }));
	};

	if (q.isPending) {
		return (
			<PublicLayout>
				<div className="page-wrap space-y-6 py-10">
					<Skeleton className="h-10 w-2/3 max-w-lg" />
					<Skeleton className="aspect-[21/9] w-full max-w-4xl rounded-xl" />
					<Skeleton className="h-40 w-full max-w-4xl rounded-xl" />
				</div>
			</PublicLayout>
		);
	}

	if (q.isError) {
		return (
			<PublicLayout>
				<div className="page-wrap py-16">
					<QueryErrorAlert
						title="We couldn't load this event"
						error={q.error}
					/>
				</div>
			</PublicLayout>
		);
	}

	if (!q.data) {
		return (
			<PublicLayout>
				<div className="page-wrap py-16 text-muted-foreground">
					Event not found.
				</div>
			</PublicLayout>
		);
	}

	const ev = q.data;

	return (
		<PublicLayout>
			<div className="page-wrap py-10 md:py-12">
				{/* Banner */}
				<div className="rise-in overflow-hidden rounded-2xl border border-border/80 bg-card shadow-lg">
					{ev.bannerUrl ? (
						<img
							src={ev.bannerUrl}
							alt=""
							className="aspect-[21/9] w-full object-cover"
						/>
					) : (
						<div className="flex aspect-[21/9] w-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5">
							<span className="display-title text-6xl font-bold text-primary/20">
								{ev.title.charAt(0)}
							</span>
						</div>
					)}
				</div>

				<div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px] lg:items-start">
					{/* Main content */}
					<div className="rise-in stagger-1 space-y-8">
						<div className="space-y-4">
							<div className="flex flex-wrap items-center gap-2">
								{ev.published ? (
									<Badge className="bg-primary/10 text-primary hover:bg-primary/10">
										On sale
									</Badge>
								) : (
									<Badge variant="secondary">Unpublished</Badge>
								)}
							</div>
							<h1 className="display-title text-3xl font-semibold md:text-4xl">
								{ev.title}
							</h1>
							<div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
								<span className="flex items-center gap-1.5">
									<MapPin className="size-4 shrink-0 text-primary" />
									{ev.venue ?? "Venue announced soon"}
								</span>
								<span className="flex items-center gap-1.5">
									<Calendar className="size-4 shrink-0 text-primary" />
									{new Intl.DateTimeFormat(undefined, {
										dateStyle: "full",
										timeStyle: "short",
									}).format(new Date(ev.startsAt))}
								</span>
							</div>
						</div>

						{ev.description ? (
							<div className="prose prose-neutral dark:prose-invert max-w-none border-t border-border/60 pt-8">
								<p className="whitespace-pre-wrap text-base leading-relaxed">
									{ev.description}
								</p>
							</div>
						) : null}
					</div>

					{/* Sticky ticket panel */}
					<aside className="rise-in stagger-2 lg:sticky lg:top-24">
						<div className="ticket-edge island-shell rounded-xl p-6">
							<h2 className="display-title text-lg font-semibold">
								Select tickets
							</h2>
							<p className="mt-1 text-sm text-muted-foreground">
								Counts update live as others shop.
							</p>

							<ul className="mt-5 space-y-3">
								{ev.ticketTypes.map((t) => {
									const selected = (qty[t.id] ?? 0) > 0;
									return (
										<li
											key={t.id}
											className={cn(
												"tier-card rounded-lg p-4",
												selected && "tier-card-selected",
											)}
										>
											<div className="flex items-start justify-between gap-2">
												<div>
													<p className="font-medium">{t.name}</p>
													<p className="text-xs uppercase tracking-wide text-muted-foreground">
														{t.tier}
													</p>
												</div>
												<Badge
													variant="outline"
													className={
														t.quantityRemaining <= 5
															? "border-phosphor/50 text-phosphor"
															: ""
													}
												>
													{t.quantityRemaining} left
												</Badge>
											</div>
											<p className="mt-2 text-lg font-semibold">
												{new Intl.NumberFormat(undefined, {
													style: "currency",
													currency: "USD",
												}).format(Number(t.price))}
											</p>
											<div className="mt-3 flex items-center gap-2">
												<Button
													type="button"
													variant="outline"
													size="icon-sm"
													disabled={(qty[t.id] ?? 0) <= 0}
													onClick={() =>
														setQuantity(t.id, (qty[t.id] ?? 0) - 1)
													}
													aria-label={`Decrease ${t.name} quantity`}
												>
													<Minus className="size-4" />
												</Button>
												<span className="w-8 text-center font-medium tabular-nums">
													{qty[t.id] ?? 0}
												</span>
												<Button
													type="button"
													variant="outline"
													size="icon-sm"
													disabled={(qty[t.id] ?? 0) >= t.quantityRemaining}
													onClick={() =>
														setQuantity(t.id, (qty[t.id] ?? 0) + 1)
													}
													aria-label={`Increase ${t.name} quantity`}
												>
													<Plus className="size-4" />
												</Button>
											</div>
										</li>
									);
								})}
							</ul>

							<div className="mt-6 border-t border-border/60 pt-4">
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">Subtotal</span>
									<span className="text-lg font-semibold">
										{new Intl.NumberFormat(undefined, {
											style: "currency",
											currency: "USD",
										}).format(total)}
									</span>
								</div>
								<Button
									className="mt-4 w-full"
									size="lg"
									disabled={lines.length === 0}
									onClick={() => {
										const s = getSession();
										if (!s || !isCustomer(s)) {
											void navigate({
												to: "/login",
												search: { redirect: window.location.pathname },
											});
											return;
										}
										void navigate({
											to: "/events/$eventSlugOrId/checkout",
											params: { eventSlugOrId },
											state: { lines } as { lines: typeof lines },
										});
									}}
								>
									Continue to checkout
								</Button>
								<Button
									variant="ghost"
									className="mt-2 w-full"
									asChild
								>
									<Link to="/events">Back to events</Link>
								</Button>
							</div>
						</div>
					</aside>
				</div>
			</div>
		</PublicLayout>
	);
}
