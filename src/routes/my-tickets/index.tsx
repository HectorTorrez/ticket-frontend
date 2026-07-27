import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, MapPin, Ticket } from "lucide-react";
import type { z } from "zod";

import { EmptyState } from "#/components/empty-state";
import { PublicLayout } from "#/components/layouts/public-layout";
import { PageHeader } from "#/components/page-header";
import {
	StatusIndicator,
	ticketStatusTone,
} from "#/components/status-indicator";
import { StatusPanel } from "#/components/status-panel";
import { TicketDateStub } from "#/components/ticket-date-stub";
import { TicketQrCode } from "#/components/ticket-qr-code";
import { TicketStub } from "#/components/ticket-stub";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { useErrorToast } from "#/hooks/use-error-toast";
import type { myTicketSchema } from "#/lib/api/schemas";
import { fetchMyTickets } from "#/lib/api/ticket-api";
import { requireCustomer } from "#/lib/auth/guards";
import { formatTicketCode, labelFor, ticketStatusLabel } from "#/lib/labels";
import { ticketsKeys } from "#/lib/query-keys";

export const Route = createFileRoute("/my-tickets/")({
	ssr: false,
	beforeLoad: () => {
		requireCustomer();
	},
	component: MyTicketsPage,
});

type MyTicket = z.infer<typeof myTicketSchema>;

function MyTicketsPage() {
	const q = useQuery({
		queryKey: ticketsKeys.mine(),
		queryFn: fetchMyTickets,
	});

	useErrorToast(q.isError ? q.error : null, "No pudimos cargar tus entradas");

	return (
		<PublicLayout>
			<div className="page-wrap space-y-8 py-12 md:py-16">
				<PageHeader
					eyebrow="Tu cartera"
					title="Mis pases"
					description={
						<p>
							Muestra estos pases en la entrada. Cada código es único para tu
							compra.
						</p>
					}
				/>

				{q.isPending ? (
					<div className="grid gap-6 md:grid-cols-2">
						<Skeleton className="h-56 rounded-xl" />
						<Skeleton className="h-56 rounded-xl" />
					</div>
				) : null}

				{q.isError ? (
					<StatusPanel
						tone="error"
						title="No pudimos cargar tus pases"
						description="Revisa tu conexión e inténtalo de nuevo."
					/>
				) : null}

				{q.data && q.data.length === 0 ? (
					<EmptyState
						icon={Ticket}
						title="Aún no tienes pases"
						description="Cuando compres entradas, aparecerán aquí listas para escanear."
						action={
							<Button asChild>
								<Link to="/events" search={{ page: 1, limit: 10 }}>
									Explorar eventos
								</Link>
							</Button>
						}
					/>
				) : null}

				{q.data && q.data.length > 0 ? (
					<ul className="grid gap-6">
						{q.data.map((t: MyTicket) => (
							<li key={t.id}>
								<TicketStub
									rail={
										<TicketDateStub
											startsAt={t.event.startsAt}
											tier={t.ticketType.tier}
										/>
									}
									aside={
										<div className="flex shrink-0 flex-col items-center gap-2">
											<div className="rounded-md border border-border bg-white p-2">
												<TicketQrCode
													publicCode={t.publicCode}
													alt={`Código QR para ${t.event.title}`}
													className="rounded"
												/>
											</div>
											<span className="font-ticket-code text-[0.65rem] uppercase tracking-wider text-muted-foreground">
												{formatTicketCode(t.publicCode)}
											</span>
											<Button
												variant="link"
												size="sm"
												className="text-xs"
												asChild
											>
												<Link
													to="/check/$publicCode"
													params={{ publicCode: t.publicCode }}
												>
													Ver pase completo
												</Link>
											</Button>
										</div>
									}
								>
									<div className="flex min-w-0 flex-1 flex-col gap-4">
										<div className="min-w-0 flex-1 space-y-2">
											<div className="flex flex-wrap items-start justify-between gap-2">
												<h2 className="display-title font-semibold leading-snug">
													{t.event.title}
												</h2>
												<StatusIndicator
													label={labelFor(ticketStatusLabel, t.status)}
													tone={ticketStatusTone(t.status)}
													className="text-xs shrink-0"
													iconClassName="size-3"
												/>
											</div>
											<p className="text-sm text-muted-foreground">
												{t.ticketType.name}
											</p>
											<div className="space-y-1 text-sm text-muted-foreground">
												<p className="flex items-center gap-1.5">
													<Calendar className="size-3.5 shrink-0" />
													{new Intl.DateTimeFormat("es", {
														dateStyle: "medium",
														timeStyle: "short",
													}).format(new Date(t.event.startsAt))}
												</p>
												{t.event.venue ? (
													<p className="flex items-center gap-1.5">
														<MapPin className="size-3.5 shrink-0" />
														{t.event.venue}
													</p>
												) : null}
											</div>
										</div>
									</div>
								</TicketStub>
							</li>
						))}
					</ul>
				) : null}
			</div>
		</PublicLayout>
	);
}
