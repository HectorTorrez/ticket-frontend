import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Ticket } from "lucide-react";

import { EmptyState } from "#/components/empty-state";
import { JsonLd } from "#/components/json-ld";
import { PublicLayout } from "#/components/layouts/public-layout";
import { PageHeader } from "#/components/page-header";
import { ScrollReveal } from "#/components/scroll-reveal";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { useTransitionClick } from "#/hooks/use-transition-navigate";
import { fetchEventsList } from "#/lib/api/ticket-api";
import { getSession } from "#/lib/auth/session";
import { eventsKeys } from "#/lib/query-keys";
import { buildSiteMeta } from "#/lib/seo";
import { EventCard } from "#/routes/events/-components/event-card";

export const Route = createFileRoute("/")({
	head: () =>
		buildSiteMeta({
			title: "Tide Tickets — cartelera y entradas para eventos en vivo",
			description:
				"Explora eventos en vivo, reserva entradas con cupo real y entra con pases QR. Reserva, paga y valida en la puerta sin imprimir.",
			path: "/",
		}),
	component: HomePage,
});

function formatHeroDate(iso: string) {
	try {
		return new Intl.DateTimeFormat("es", {
			weekday: "short",
			day: "numeric",
			month: "short",
			hour: "numeric",
			minute: "2-digit",
		}).format(new Date(iso));
	} catch {
		return iso;
	}
}

function HomePage() {
	const session = typeof window !== "undefined" ? getSession() : null;
	const eventsClick = useTransitionClick(
		{ to: "/events", search: { page: 1, limit: 10 } },
		"forward",
	);
	const featured = useQuery({
		queryKey: eventsKeys.list({ page: 1, limit: 3, publishedOnly: true }),
		queryFn: () => fetchEventsList({ page: 1, limit: 3, publishedOnly: true }),
	});

	const spotlight = featured.data?.items[0];
	const carteleraLabel = featured.isPending
		? "Cartelera"
		: featured.data && featured.data.total > 0
			? `${featured.data.total} evento${featured.data.total === 1 ? "" : "s"} publicados`
			: "Cartelera por abrir";

	return (
		<PublicLayout>
			<section className="page-wrap py-10 md:py-16">
				<div className="hero-masthead poster-reveal">
					<div className="hero-masthead__rule">
						<span className="font-ticket-code text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
							{carteleraLabel}
						</span>
						{spotlight ? (
							<span className="font-ticket-code text-[0.68rem] uppercase tracking-[0.12em] text-primary">
								Próximo · {formatHeroDate(spotlight.startsAt)}
							</span>
						) : null}
					</div>

					<div className="hero-masthead__grid">
						<div className="hero-masthead__visual">
							{featured.isPending ? (
								<Skeleton className="aspect-[3/4] w-full max-w-md" />
							) : null}

							{spotlight ? (
								<>
									<Link
										to="/events/$eventSlugOrId"
										params={{ eventSlugOrId: spotlight.slug }}
										className="hero-masthead__poster group"
										aria-label={`Ver ${spotlight.title}`}
									>
										<span className="hero-masthead__pin" aria-hidden />
										{spotlight.bannerUrl ? (
											<img
												src={spotlight.bannerUrl}
												alt=""
												loading="eager"
												fetchPriority="high"
											/>
										) : (
											<div className="hero-masthead__poster-fallback">
												<p className="font-ticket-code text-[0.68rem] uppercase tracking-[0.14em] opacity-80">
													En cartelera
												</p>
												<p className="display-title mt-3 text-3xl font-semibold leading-tight">
													{spotlight.title}
												</p>
											</div>
										)}
									</Link>
									<p className="hero-masthead__caption">
										<span className="font-semibold text-foreground">
											{spotlight.title}
										</span>
										{" · "}
										{spotlight.venue ?? "Lugar por confirmar"}
									</p>
								</>
							) : null}

							{!featured.isPending && !spotlight ? (
								<div
									className="hero-masthead__poster hero-masthead__poster-fallback"
									aria-hidden
								>
									<span className="hero-masthead__pin" />
									<p className="font-ticket-code text-[0.68rem] uppercase tracking-[0.14em] opacity-80">
										Sin fecha fijada
									</p>
									<p className="display-title mt-3 text-3xl font-semibold leading-tight">
										La cartelera abre pronto
									</p>
								</div>
							) : null}
						</div>

						<div className="hero-masthead__copy">
							<div className="space-y-4">
								<h1 className="display-title hero-masthead__headline font-semibold">
									Entradas reales. Puerta sin fila.
								</h1>
								<p className="hero-masthead__lede">
									Reserva con cupo en vivo, paga a tu ritmo y entra con el QR en
									tu cuenta — como un pase de mano, pero digital.
								</p>
							</div>

							<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
								<Button size="lg" className="w-full gap-2 sm:w-auto" asChild>
									<Link
										to="/events"
										search={{ page: 1, limit: 10 }}
										onClick={eventsClick}
									>
										Ver cartelera
										<ArrowRight className="size-4" aria-hidden />
									</Link>
								</Button>
								{spotlight ? (
									<Button
										size="lg"
										variant="outline"
										className="w-full sm:w-auto"
										asChild
									>
										<Link
											to="/events/$eventSlugOrId"
											params={{ eventSlugOrId: spotlight.slug }}
										>
											Próximo evento
										</Link>
									</Button>
								) : null}
								{!session ? (
									<Button
										size="lg"
										variant="ghost"
										className="w-full sm:w-auto"
										asChild
									>
										<Link to="/register">Crear cuenta</Link>
									</Button>
								) : null}
							</div>

							<aside
								className="hero-admit-stub"
								aria-label="Cómo funciona tu entrada"
							>
								<p className="hero-admit-stub__label">Admit one</p>
								<p className="hero-admit-stub__route">
									Reserva · Paga · QR en puerta
								</p>
								<p className="hero-admit-stub__fine">Sin reimpresión</p>
							</aside>
						</div>
					</div>
				</div>
			</section>

			<section className="page-wrap space-y-8 py-14 md:py-16">
				<ScrollReveal>
					<PageHeader
						eyebrow="Próximamente"
						title="Eventos a la venta"
						headingLevel={2}
						action={
							<Button variant="outline" className="gap-2" asChild>
								<Link
									to="/events"
									search={{ page: 1, limit: 10 }}
									onClick={eventsClick}
								>
									Ver todos
									<ArrowRight className="size-4" aria-hidden />
								</Link>
							</Button>
						}
					/>
				</ScrollReveal>

				{featured.isPending ? (
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{["f-sk-1", "f-sk-2", "f-sk-3"].map((id) => (
							<Skeleton key={id} className="h-80 rounded-xl" />
						))}
					</div>
				) : null}

				{featured.data && featured.data.items.length > 0 ? (
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{featured.data.items.map((ev, index) => (
							<EventCard key={ev.id} event={ev} revealDelayMs={index * 60} />
						))}
					</div>
				) : null}

				{featured.data && featured.data.items.length === 0 ? (
					<EmptyState
						icon={Ticket}
						title="La cartelera está por abrir"
						description="Aún no hay eventos publicados. Vuelve pronto para descubrir la próxima fecha."
						action={
							<Button variant="outline" asChild>
								<Link
									to="/events"
									search={{ page: 1, limit: 10 }}
									onClick={eventsClick}
								>
									Explorar eventos
								</Link>
							</Button>
						}
					/>
				) : null}
			</section>

			<section className="page-wrap pb-16 md:pb-24">
				<ScrollReveal>
					<div className="mb-8">
						<p className="island-kicker">Para ambos lados</p>
						<h2 className="display-title mt-2 text-2xl font-semibold md:text-3xl">
							De la cartelera a la puerta
						</h2>
					</div>
				</ScrollReveal>
				<ScrollReveal>
					<ol className="process-stub" aria-label="Cómo funciona Tide Tickets">
						{[
							{
								title: "Inventario en vivo",
								body: "Los cupos se actualizan al instante mientras otros compran — sin sorpresas de agotado en el último momento.",
							},
							{
								title: "Pago con tiempo límite",
								body: "Las reservas apartan tus entradas con una cuenta regresiva. Paga cuando quieras o libera la reserva.",
							},
							{
								title: "QR en la entrada",
								body: "Los pases viven en tu cuenta. El personal valida los códigos desde el escáner del panel en segundos.",
							},
						].map((c, i) => (
							<li key={c.title} className="process-stub__step">
								<p className="process-stub__index">0{i + 1}</p>
								<h3 className="font-semibold">{c.title}</h3>
								<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
									{c.body}
								</p>
							</li>
						))}
					</ol>
				</ScrollReveal>
			</section>
			<JsonLd
				data={{
					"@context": "https://schema.org",
					"@type": "FAQPage",
					mainEntity: [
						{
							"@type": "Question",
							name: "¿Cómo compro entradas en Tide Tickets?",
							acceptedAnswer: {
								"@type": "Answer",
								text: "Explora la cartelera, elige un evento, reserva tus entradas con cupo en vivo y completa el pago antes de que expire la reserva.",
							},
						},
						{
							"@type": "Question",
							name: "¿Necesito imprimir mis entradas?",
							acceptedAnswer: {
								"@type": "Answer",
								text: "No. Tus pases digitales quedan en tu cuenta con código QR para validar en la puerta.",
							},
						},
					],
				}}
			/>
		</PublicLayout>
	);
}
