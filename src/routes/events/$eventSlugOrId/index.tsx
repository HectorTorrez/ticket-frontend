import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	AlertTriangle,
	Calendar,
	Eye,
	EyeOff,
	MapPin,
	Minus,
	Plus,
} from "lucide-react";
import { useMemo, useState } from "react";

import { JsonLd } from "#/components/json-ld";
import { PublicLayout } from "#/components/layouts/public-layout";
import { PageHeader } from "#/components/page-header";
import { PosterSurface } from "#/components/poster-surface";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { useErrorToast } from "#/hooks/use-error-toast";
import { useTransitionClick } from "#/hooks/use-transition-navigate";
import { fetchEventDetail } from "#/lib/api/ticket-api";
import { getSession, isCustomer } from "#/lib/auth/session";
import { labelFor, ticketTierLabel } from "#/lib/labels";
import { eventsKeys } from "#/lib/query-keys";
import { buildEventMeta, buildSiteMeta, eventJsonLd } from "#/lib/seo";
import {
	formatSaleWindowLabel,
	getTicketSalePhase,
	isTicketSaleOpen,
} from "#/lib/ticket-sale-window";
import { cn } from "#/lib/utils";
import { eventBannerTransitionName } from "#/lib/view-transition";
import { useInventorySocket } from "#/routes/events/$eventSlugOrId/-hooks/use-inventory-socket";

export const Route = createFileRoute("/events/$eventSlugOrId/")({
	loader: ({ context, params }) =>
		context.queryClient.ensureQueryData({
			queryKey: eventsKeys.detail(params.eventSlugOrId),
			queryFn: () => fetchEventDetail(params.eventSlugOrId),
		}),
	head: ({ loaderData }) =>
		loaderData
			? buildEventMeta(loaderData)
			: buildSiteMeta({
					title: "Evento — Tide Tickets",
					path: "/events",
				}),
	component: EventDetailPage,
});

function EventDetailPage() {
	const { eventSlugOrId } = Route.useParams();
	const navigate = useNavigate();
	const backToEvents = useTransitionClick({ to: "/events" }, "back");

	const q = useQuery({
		queryKey: eventsKeys.detail(eventSlugOrId),
		queryFn: () => fetchEventDetail(eventSlugOrId),
	});

	useErrorToast(q.isError ? q.error : null, "No pudimos cargar este evento");

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
				<div className="page-wrap py-16 text-center">
					<p className="text-muted-foreground">
						No pudimos cargar este evento.
					</p>
					<Button className="mt-6" variant="outline" asChild>
						<Link to="/events" onClick={backToEvents}>
							Volver a eventos
						</Link>
					</Button>
				</div>
			</PublicLayout>
		);
	}

	if (!q.data) {
		return (
			<PublicLayout>
				<div className="page-wrap py-16 text-muted-foreground">
					Evento no encontrado.
				</div>
			</PublicLayout>
		);
	}

	const ev = q.data;

	return (
		<PublicLayout>
			<JsonLd data={eventJsonLd(ev)} />
			<div className="page-wrap py-10 md:py-12">
				<div className="poster-frame poster-reveal overflow-hidden rounded-lg">
					{ev.bannerUrl ? (
						<img
							src={ev.bannerUrl}
							alt={`Cartel de ${ev.title}`}
							className="aspect-[21/9] w-full object-cover"
							style={{
								viewTransitionName: eventBannerTransitionName(ev.id),
							}}
						/>
					) : (
						<div className="flex aspect-[21/9] w-full items-center justify-center bg-secondary">
							<span className="display-title text-6xl font-bold text-primary/30">
								{ev.title.charAt(0)}
							</span>
						</div>
					)}
				</div>

				<div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px] lg:items-start">
					{/* Main content */}
					<div className="space-y-8">
						<div className="space-y-4">
							<div className="flex flex-wrap items-center gap-2">
								{ev.published ? (
									<Badge variant="success" className="gap-1">
										<Eye className="size-3 shrink-0" aria-hidden />
										En venta
									</Badge>
								) : (
									<Badge variant="outline" className="gap-1">
										<EyeOff className="size-3 shrink-0" aria-hidden />
										No publicado
									</Badge>
								)}
							</div>
							<PageHeader eyebrow="En cartelera" title={ev.title} />
							<div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
								<span className="flex items-center gap-1.5">
									<MapPin className="size-4 shrink-0 text-primary" />
									{ev.venue ?? "Lugar por anunciar pronto"}
								</span>
								<span className="flex items-center gap-1.5">
									<Calendar className="size-4 shrink-0 text-primary" />
									{new Intl.DateTimeFormat("es", {
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
					<aside className="lg:sticky lg:top-24">
						<PosterSurface variant="receipt" padding="default">
							<h2 className="display-title text-lg font-semibold">
								Seleccionar entradas
							</h2>
							<p className="mt-1 text-sm text-muted-foreground">
								Los cupos se actualizan en vivo mientras otros compran.
							</p>

							<ul className="mt-5 space-y-3">
								{ev.ticketTypes.map((t) => {
									const selected = (qty[t.id] ?? 0) > 0;
									const salePhase = getTicketSalePhase(t);
									const saleOpen = isTicketSaleOpen(t);
									const saleLabel = formatSaleWindowLabel(t, salePhase);
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
														{labelFor(ticketTierLabel, t.tier)}
													</p>
												</div>
												<Badge
													variant={
														t.quantityRemaining <= 5 ? "live" : "outline"
													}
													className={cn("gap-1")}
												>
													{t.quantityRemaining <= 5 ? (
														<>
															<AlertTriangle
																className="size-3 shrink-0"
																aria-hidden
															/>
															Últimas {t.quantityRemaining}
															<span className="hidden sm:inline">
																{" "}
																entradas
															</span>
														</>
													) : (
														`${t.quantityRemaining} disponibles`
													)}
												</Badge>
											</div>
											<p className="display-title mt-2 text-xl font-semibold">
												{new Intl.NumberFormat("es", {
													style: "currency",
													currency: "USD",
												}).format(Number(t.price))}
											</p>
											{saleLabel ? (
												<p className="mt-2 text-xs text-muted-foreground">
													{saleLabel}
												</p>
											) : null}
											<div className="mt-3 flex items-center gap-2">
												<Button
													type="button"
													variant="outline"
													size="icon-sm"
													disabled={(qty[t.id] ?? 0) <= 0 || !saleOpen}
													onClick={() =>
														setQuantity(t.id, (qty[t.id] ?? 0) - 1)
													}
													aria-label={`Disminuir cantidad de ${t.name}`}
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
													disabled={
														!saleOpen || (qty[t.id] ?? 0) >= t.quantityRemaining
													}
													onClick={() =>
														setQuantity(t.id, (qty[t.id] ?? 0) + 1)
													}
													aria-label={`Aumentar cantidad de ${t.name}`}
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
									<span className="display-title text-2xl font-semibold">
										{new Intl.NumberFormat("es", {
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
									Continuar al pago
								</Button>
								<Button variant="ghost" className="mt-2 w-full" asChild>
									<Link to="/events" onClick={backToEvents}>
										Volver a eventos
									</Link>
								</Button>
							</div>
						</PosterSurface>
					</aside>
				</div>
			</div>
		</PublicLayout>
	);
}
