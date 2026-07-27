import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, MapPin, Ticket } from "lucide-react";
import { z } from "zod";

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
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { useErrorToast } from "#/hooks/use-error-toast";
import type { myTicketSchema } from "#/lib/api/schemas";
import { fetchMyTickets } from "#/lib/api/ticket-api";
import { requireCustomer } from "#/lib/auth/guards";
import { formatTicketCode, labelFor, ticketStatusLabel } from "#/lib/labels";
import { ticketsKeys } from "#/lib/query-keys";

const searchSchema = z.object({
	when: z.enum(["upcoming", "past", "all"]).optional(),
	page: z.coerce.number().catch(1),
	limit: z.coerce.number().catch(5),
});

export const Route = createFileRoute("/my-tickets/")({
	ssr: false,
	validateSearch: (search) => searchSchema.parse(search),
	beforeLoad: () => {
		requireCustomer();
	},
	component: MyTicketsPage,
});

type WhenFilter = NonNullable<z.infer<typeof searchSchema>["when"]>;
type MyTicket = z.infer<typeof myTicketSchema>;

const emptyFilterCopy: Record<
	Exclude<WhenFilter, "all">,
	{ title: string; description: string }
> = {
	upcoming: {
		title: "No tienes pases próximos",
		description:
			"Cuando compres entradas para eventos futuros, aparecerán aquí.",
	},
	past: {
		title: "Aún no tienes pases pasados",
		description:
			"Los pases de eventos que ya ocurrieron se mostrarán en esta sección.",
	},
};

function MyTicketsPage() {
	const search = Route.useSearch();
	const { when: whenParam, page, limit } = search;
	const when = whenParam ?? "upcoming";
	const navigate = Route.useNavigate();
	const q = useQuery({
		queryKey: ticketsKeys.mine({ when, page, limit }),
		queryFn: () => fetchMyTickets({ when, page, limit }),
	});

	useErrorToast(q.isError ? q.error : null, "No pudimos cargar tus entradas");

	const tickets = q.data?.items ?? [];
	const totalTickets = q.data?.counts.total ?? 0;
	const filteredTotal = q.data?.total ?? 0;
	const hasAnyTickets = totalTickets > 0;
	const showGlobalEmpty = q.isSuccess && !hasAnyTickets;
	const filteredCountForWhen =
		when === "upcoming"
			? (q.data?.counts.upcoming ?? 0)
			: when === "past"
				? (q.data?.counts.past ?? 0)
				: totalTickets;
	const showFilteredEmpty =
		q.isSuccess && hasAnyTickets && filteredCountForWhen === 0 && when !== "all";

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

				{hasAnyTickets ? (
					<Tabs
						value={when}
						onValueChange={(value) => {
							navigate({
								search: {
									when: value as WhenFilter,
									page: 1,
									limit,
								},
							});
						}}
					>
						<TabsList aria-label="Filtrar pases por fecha">
							<TabsTrigger value="upcoming">Próximos</TabsTrigger>
							<TabsTrigger value="past">Pasados</TabsTrigger>
							<TabsTrigger value="all">Todos</TabsTrigger>
						</TabsList>
					</Tabs>
				) : null}

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

				{showGlobalEmpty ? (
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

				{showFilteredEmpty ? (
					<EmptyState
						icon={Ticket}
						title={emptyFilterCopy[when].title}
						description={emptyFilterCopy[when].description}
						action={
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									navigate({
										search: {
											when: when === "upcoming" ? "past" : "upcoming",
											page: 1,
											limit,
										},
									});
								}}
							>
								{when === "upcoming" ? "Ver pasados" : "Ver próximos"}
							</Button>
						}
					/>
				) : null}

				{tickets.length > 0 ? (
					<ul className="grid gap-6">
						{tickets.map((t: MyTicket) => (
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
												<h2 className="display-title min-w-0 wrap-break-word font-semibold leading-snug">
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

				{q.isSuccess && filteredTotal > 0 ? (
					<div className="flex items-center justify-between gap-4">
						<Button
							type="button"
							variant="outline"
							disabled={page <= 1}
							onClick={() =>
								navigate({ search: { ...search, when, page: page - 1 } })
							}
						>
							Anterior
						</Button>
						<p className="text-sm text-muted-foreground">
							Página {page} de {Math.max(1, Math.ceil(filteredTotal / limit))}
						</p>
						<Button
							type="button"
							variant="outline"
							disabled={page * limit >= filteredTotal}
							onClick={() =>
								navigate({ search: { ...search, when, page: page + 1 } })
							}
						>
							Siguiente
						</Button>
					</div>
				) : null}
			</div>
		</PublicLayout>
	);
}
