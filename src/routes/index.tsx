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

const flow = [
	{
		step: "01",
		title: "Elige tu noche",
		body: "Explora eventos en vivo con disponibilidad en tiempo real: los cupos se actualizan mientras otros compran.",
	},
	{
		step: "02",
		title: "Reserva tus entradas",
		body: "Apartamos el inventario con una reserva temporizada. Paga cuando quieras, sin prisas.",
	},
	{
		step: "03",
		title: "Entra con QR",
		body: "Tus pases digitales quedan en tu cuenta. Muestra el código en la puerta — sin imprimir, sin complicaciones.",
	},
];

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

	return (
		<PublicLayout>
			<section className="page-wrap py-14 md:py-20">
				<div className="hero-poster poster-reveal p-8 md:p-12 lg:p-16">
					<div className="relative z-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
						<div className="space-y-6">
							<p className="island-kicker">Cartelera abierta</p>
							<h1 className="display-title max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl lg:text-[3.25rem]">
								La ciudad se vive mejor desde la primera fila.
							</h1>
							<p className="max-w-lg text-lg text-muted-foreground md:text-xl">
								Una cartelera de experiencias en vivo, entradas con cupo real y
								pases listos para la puerta.
							</p>
							<div className="flex flex-wrap gap-3 pt-1">
								<Button size="lg" className="gap-2" asChild>
									<Link
										to="/events"
										search={{ page: 1, limit: 10 }}
										onClick={eventsClick}
									>
										Explorar eventos
										<ArrowRight className="size-4" aria-hidden />
									</Link>
								</Button>
								{!session ? (
									<Button size="lg" variant="outline" asChild>
										<Link to="/register">Crear cuenta</Link>
									</Button>
								) : null}
							</div>
						</div>
						<div className="ticket-edge island-shell rounded-lg p-6 md:p-8">
							<p className="font-ticket-code text-xs uppercase tracking-[0.16em] text-primary">
								La ruta de tu entrada
							</p>
							<ul className="mt-5 space-y-4">
								{flow.map((f) => (
									<li key={f.step} className="flex gap-4">
										<span className="flow-step-num shrink-0">{f.step}</span>
										<div>
											<p className="font-semibold">{f.title}</p>
											<p className="mt-0.5 text-sm text-muted-foreground">
												{f.body}
											</p>
										</div>
									</li>
								))}
							</ul>
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
							<EventCard
								key={ev.id}
								event={ev}
								revealDelayMs={index * 60}
							/>
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
					<div className="mb-8 border-t border-border pt-10">
						<p className="island-kicker">Para ambos lados</p>
						<h2 className="display-title mt-2 text-2xl font-semibold md:text-3xl">
							De la cartelera a la puerta
						</h2>
					</div>
				</ScrollReveal>
				<div className="grid border-y border-border md:grid-cols-3 md:divide-x md:divide-border">
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
						<ScrollReveal key={c.title} as="div" delayMs={i * 70}>
							<div className="px-0 py-7 md:px-6">
								<p className="font-ticket-code text-xs text-primary">0{i + 1}</p>
								<h3 className="font-semibold">{c.title}</h3>
								<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
									{c.body}
								</p>
							</div>
						</ScrollReveal>
					))}
				</div>
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
