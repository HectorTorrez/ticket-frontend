import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	QrCode,
	Radio,
	ShieldCheck,
	Ticket,
	Waves,
} from "lucide-react";

import { PublicLayout } from "#/components/layouts/public-layout";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { fetchEventsList } from "#/lib/api/ticket-api";
import { getSession } from "#/lib/auth/session";
import { eventsKeys } from "#/lib/query-keys";
import { EventCard } from "#/routes/events/-components/event-card";

export const Route = createFileRoute("/")({
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
	const featured = useQuery({
		queryKey: eventsKeys.list({ page: 1, limit: 3, publishedOnly: true }),
		queryFn: () =>
			fetchEventsList({ page: 1, limit: 3, publishedOnly: true }),
	});

	return (
		<PublicLayout>
			{/* Hero */}
			<section className="page-wrap py-14 md:py-20">
				<div className="hero-poster rise-in p-8 md:p-12 lg:p-16">
					<div className="relative z-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
						<div className="space-y-6">
							<p className="island-kicker">Tide Tickets</p>
							<h1 className="display-title max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl lg:text-[3.25rem]">
								Tu pase al{" "}
								<em className="not-italic text-primary">próximo</em> evento
								empieza aquí
							</h1>
							<p className="max-w-lg text-lg text-muted-foreground md:text-xl">
								Descubre eventos, reserva entradas en tiempo real y lleva todos
								tus pases en el móvil. Los organizadores publican, escanean y
								venden desde un solo panel.
							</p>
							<div className="flex flex-wrap gap-3 pt-1">
								<Button size="lg" className="gap-2" asChild>
									<Link to="/events">
										Explorar eventos
										<ArrowRight className="size-4" />
									</Link>
								</Button>
								{!session ? (
									<Button size="lg" variant="outline" asChild>
										<Link to="/register">Crear cuenta</Link>
									</Button>
								) : null}
							</div>
						</div>
						<div className="ticket-edge island-shell rounded-xl p-6 md:p-8">
							<div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
								<Waves className="size-4 text-primary" />
								<span>Cómo funciona</span>
							</div>
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

			<div className="page-wrap">
				<div className="wave-rule" />
			</div>

			{/* Featured events */}
			<section className="page-wrap space-y-8 py-14 md:py-16">
				<div className="rise-in stagger-1 flex flex-wrap items-end justify-between gap-4">
					<div>
						<p className="island-kicker">Próximamente</p>
						<h2 className="display-title mt-2 text-2xl font-semibold md:text-3xl">
							Eventos a la venta
						</h2>
					</div>
					<Button variant="outline" className="gap-2" asChild>
						<Link to="/events">
							Ver todos
							<ArrowRight className="size-4" />
						</Link>
					</Button>
				</div>

				{featured.isPending ? (
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{["f-sk-1", "f-sk-2", "f-sk-3"].map((id) => (
							<Skeleton key={id} className="h-80 rounded-xl" />
						))}
					</div>
				) : null}

				{featured.data && featured.data.items.length > 0 ? (
					<div className="rise-in stagger-2 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{featured.data.items.map((ev) => (
							<EventCard key={ev.id} event={ev} />
						))}
					</div>
				) : null}

				{featured.data && featured.data.items.length === 0 ? (
					<div className="island-shell rise-in rounded-xl p-10 text-center">
						<Ticket className="mx-auto size-10 text-muted-foreground/60" />
						<p className="mt-4 text-muted-foreground">
							Aún no hay eventos publicados. Vuelve pronto.
						</p>
						<Button className="mt-6" variant="outline" asChild>
							<Link to="/events">Explorar eventos</Link>
						</Button>
					</div>
				) : null}
			</section>

			{/* Capabilities */}
			<section className="page-wrap pb-16 md:pb-24">
				<div className="rise-in stagger-3 mb-8">
					<p className="island-kicker">Para ambos lados</p>
					<h2 className="display-title mt-2 text-2xl font-semibold md:text-3xl">
						Todo entre el listado y el escaneo
					</h2>
				</div>
				<div className="grid gap-4 md:grid-cols-3">
					{[
						{
							icon: Radio,
							title: "Inventario en vivo",
							body: "Las actualizaciones por socket mantienen los cupos al día mientras los clientes navegan — sin sorpresas de agotado.",
						},
						{
							icon: ShieldCheck,
							title: "Pago con tiempo límite",
							body: "Las reservas apartan tus entradas con una cuenta regresiva. Paga cuando quieras o libera la reserva.",
						},
						{
							icon: QrCode,
							title: "QR en la entrada",
							body: "Los pases viven en tu cuenta. El personal valida los códigos desde el escáner del panel en segundos.",
						},
					].map((c, i) => (
						<div
							key={c.title}
							className={`feature-card rise-in rounded-xl border border-border/80 p-6 stagger-${i + 1}`}
						>
							<div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2.5 text-primary">
								<c.icon className="size-5" />
							</div>
							<h3 className="font-semibold">{c.title}</h3>
							<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
								{c.body}
							</p>
						</div>
					))}
				</div>
			</section>
		</PublicLayout>
	);
}
