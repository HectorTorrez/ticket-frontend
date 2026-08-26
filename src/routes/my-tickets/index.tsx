import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Ticket } from "lucide-react";
import { useMemo } from "react";
import { z } from "zod";

import { EmptyState } from "#/components/empty-state";
import { PublicLayout } from "#/components/layouts/public-layout";
import { ListPagination } from "#/components/list-pagination";
import { MyTicketEventGroup } from "#/components/my-ticket-event-group";
import { PageHeader } from "#/components/page-header";
import { StatusPanel } from "#/components/status-panel";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { useErrorToast } from "#/hooks/use-error-toast";
import { fetchMyTickets } from "#/lib/api/ticket-api";
import { requireCustomer } from "#/lib/auth/guards";
import { eventsListDefaultSearch } from "#/lib/default-search";
import { groupTicketsByEvent } from "#/lib/my-ticket-event-state";
import { ticketsKeys } from "#/lib/query-keys";

const searchSchema = z.object({
	when: z.enum(["upcoming", "past", "all"]).optional(),
	page: z.coerce.number().catch(1),
	limit: z.coerce.number().catch(20),
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
	const eventGroups = useMemo(() => groupTicketsByEvent(tickets), [tickets]);
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
		q.isSuccess &&
		hasAnyTickets &&
		filteredCountForWhen === 0 &&
		when !== "all";

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
						<TabsList
							aria-label="Filtrar pases por fecha"
							className="h-12 w-full"
						>
							<TabsTrigger value="upcoming">Próximos</TabsTrigger>
							<TabsTrigger value="past">Pasados</TabsTrigger>
							<TabsTrigger value="all">Todos</TabsTrigger>
						</TabsList>
					</Tabs>
				) : null}

				{q.isPending ? (
					<div className="grid gap-6">
						<Skeleton className="h-72 rounded-xl" />
						<Skeleton className="h-72 rounded-xl" />
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
								<Link to="/events" search={eventsListDefaultSearch}>
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

				{eventGroups.length > 0 ? (
					<ul className="grid gap-6">
						{eventGroups.map((group) => (
							<li key={group.event.id}>
								<MyTicketEventGroup
									event={group.event}
									tickets={group.tickets}
								/>
							</li>
						))}
					</ul>
				) : null}

				{q.isSuccess && filteredTotal > 0 ? (
					<ListPagination
						page={page}
						total={filteredTotal}
						limit={limit}
						label={`Página ${page} de ${Math.max(1, Math.ceil(filteredTotal / limit))}`}
						onPrev={() =>
							navigate({ search: { ...search, when, page: page - 1 } })
						}
						onNext={() =>
							navigate({ search: { ...search, when, page: page + 1 } })
						}
					/>
				) : null}
			</div>
		</PublicLayout>
	);
}
