import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { PublicLayout } from "#/components/layouts/public-layout";
import { QueryErrorAlert } from "#/components/query-error-alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import { fetchEventDetail } from "#/lib/api/ticket-api";
import { getSession, isCustomer } from "#/lib/auth/session";
import { eventsKeys } from "#/lib/query-keys";
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
			<div className="page-wrap space-y-10 py-10">
				<div className="overflow-hidden rounded-2xl border border-border/80 bg-card">
					{ev.bannerUrl ? (
						<img
							src={ev.bannerUrl}
							alt=""
							className="aspect-[21/9] w-full object-cover"
						/>
					) : (
						<div className="flex aspect-[21/9] w-full items-center justify-center bg-muted text-muted-foreground">
							No banner
						</div>
					)}
					<div className="space-y-3 p-6 md:p-10">
						<div className="flex flex-wrap items-center gap-2">
							{ev.published ? (
								<Badge>On sale</Badge>
							) : (
								<Badge variant="secondary">Unpublished</Badge>
							)}
						</div>
						<h1 className="display-title text-3xl font-semibold md:text-4xl">
							{ev.title}
						</h1>
						<p className="text-muted-foreground">
							{ev.venue ?? "Venue announced soon"}
						</p>
						<p className="text-sm text-muted-foreground">
							{new Intl.DateTimeFormat(undefined, {
								dateStyle: "full",
								timeStyle: "short",
							}).format(new Date(ev.startsAt))}{" "}
							—{" "}
							{new Intl.DateTimeFormat(undefined, {
								dateStyle: "medium",
								timeStyle: "short",
							}).format(new Date(ev.endsAt))}
						</p>
					</div>
				</div>

				{ev.description ? (
					<div className="prose prose-neutral dark:prose-invert max-w-none">
						<p className="whitespace-pre-wrap">{ev.description}</p>
					</div>
				) : null}

				<section className="space-y-4">
					<h2 className="text-xl font-semibold">Ticket types</h2>
					<ul className="grid gap-4 md:grid-cols-2">
						{ev.ticketTypes.map((t) => (
							<li
								key={t.id}
								className="island-shell flex flex-col gap-4 rounded-xl border border-border/80 p-5"
							>
								<div className="flex items-start justify-between gap-2">
									<div>
										<p className="font-medium">{t.name}</p>
										<p className="text-sm text-muted-foreground">{t.tier}</p>
									</div>
									<Badge variant="outline">{t.quantityRemaining} left</Badge>
								</div>
								<p className="text-lg font-semibold">
									{new Intl.NumberFormat(undefined, {
										style: "currency",
										currency: "USD",
									}).format(Number(t.price))}
								</p>
								<div className="flex items-center gap-3">
									<label className="sr-only" htmlFor={`qty-${t.id}`}>
										Quantity for {t.name}
									</label>
									<Input
										id={`qty-${t.id}`}
										type="number"
										min={0}
										max={t.quantityRemaining}
										value={qty[t.id] ?? 0}
										className="w-24"
										onChange={(e) => setQuantity(t.id, Number(e.target.value))}
									/>
								</div>
							</li>
						))}
					</ul>
				</section>

				<div className="flex flex-wrap items-center gap-3">
					<Button
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
					<Button variant="outline" asChild>
						<Link to="/events">Back to events</Link>
					</Button>
				</div>
			</div>
		</PublicLayout>
	);
}
