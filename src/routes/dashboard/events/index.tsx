import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { z as zod } from "zod";
import { z } from "zod";

import { SortableTableHead } from "#/components/admin/sortable-table-head";
import { TableExportMenu } from "#/components/admin/table-export-menu";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { Switch } from "#/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { useErrorToast } from "#/hooks/use-error-toast";
import { adminEventsSortDefaults } from "#/lib/admin/default-search";
import { fetchAllPages } from "#/lib/admin/fetch-all-pages";
import { cycleSort, resolveTableSort } from "#/lib/admin/sort";
import { ApiError } from "#/lib/api/errors";
import type { eventListItemSchema } from "#/lib/api/schemas";
import {
	fetchAdminEventsList,
	publishEvent,
	unpublishEvent,
} from "#/lib/api/ticket-api";
import type { ExportColumn } from "#/lib/export/table-export";
import { eventsKeys } from "#/lib/query-keys";
import { toastMutation } from "#/lib/toast-mutation";
import { cn } from "#/lib/utils.ts";

type EventListItem = zod.infer<typeof eventListItemSchema>;

const searchSchema = z.object({
	page: z.coerce.number().catch(1),
	limit: z.coerce.number().catch(10),
	sortBy: z
		.enum(["title", "slug", "startsAt", "published", "createdAt"])
		.catch(adminEventsSortDefaults.sortBy),
	sortDirection: z.enum(["asc", "desc", "default"]).catch("default"),
});

const eventExportColumns: ExportColumn<EventListItem>[] = [
	{ header: "Título", value: (row) => row.title },
	{ header: "Enlace", value: (row) => `/events/${row.slug}` },
	{
		header: "Inicio",
		value: (row) =>
			new Intl.DateTimeFormat("es", { dateStyle: "short" }).format(
				new Date(row.startsAt),
			),
	},
	{
		header: "Visibilidad",
		value: (row) => (row.published ? "En catálogo" : "Oculto"),
	},
];

export const Route = createFileRoute("/dashboard/events/")({
	validateSearch: (s) => searchSchema.parse(s),
	component: DashboardEventsList,
});

function EventVisibilityControl({ event }: { event: EventListItem }) {
	const qc = useQueryClient();
	const toggle = useMutation({
		mutationFn: (nextPublished: boolean) =>
			toastMutation(
				(nextPublished
					? publishEvent(event.id)
					: unpublishEvent(event.id)
				).then(async () => {
					await qc.invalidateQueries({ queryKey: eventsKeys.all });
					return nextPublished;
				}),
				{
					loading: "Actualizando visibilidad…",
					success: (nextPublished) =>
						nextPublished
							? "Evento visible en el catálogo"
							: "Evento oculto del catálogo",
					error: (e) =>
						e instanceof ApiError
							? e.message
							: "No se pudo actualizar la visibilidad",
				},
			),
	});

	return (
		<div className="flex flex-wrap items-center gap-2">
			<Switch
				checked={event.published}
				disabled={toggle.isPending}
				size="sm"
				aria-label={
					event.published
						? "Visible en el catálogo — desactiva para ocultarlo"
						: "Oculto del catálogo — activa para publicarlo"
				}
				onCheckedChange={(checked) => {
					if (checked !== event.published) toggle.mutate(checked);
				}}
			/>
			<Badge variant={event.published ? "default" : "secondary"}>
				{event.published ? "En catálogo" : "Oculto"}
			</Badge>
		</div>
	);
}

function DashboardEventsList() {
	const search = Route.useSearch();
	const { page, limit, sortBy, sortDirection } = search;
	const navigate = Route.useNavigate();
	const effectiveSort = resolveTableSort(
		sortBy,
		sortDirection,
		adminEventsSortDefaults,
	);

	const q = useQuery({
		queryKey: eventsKeys.adminList({
			page,
			limit,
			sortBy,
			sortDirection,
		}),
		queryFn: () =>
			fetchAdminEventsList({
				page,
				limit,
				sortBy: effectiveSort.sortBy,
				sortOrder: effectiveSort.sortOrder,
			}),
		placeholderData: keepPreviousData,
	});

	useErrorToast(q.isError ? q.error : null, "No pudimos cargar los eventos");

	function handleSort(
		column: "title" | "slug" | "startsAt" | "published" | "createdAt",
	) {
		const next = cycleSort(
			{ sortBy, sortDirection },
			column,
			adminEventsSortDefaults,
		);
		navigate({
			search: { ...search, ...next, page: 1 },
		});
	}

	async function fetchAllEvents(): Promise<EventListItem[]> {
		return fetchAllPages((p, l) =>
			fetchAdminEventsList({
				page: p,
				limit: l,
				sortBy: effectiveSort.sortBy,
				sortOrder: effectiveSort.sortOrder,
			}),
		);
	}

	return (
		<div className="space-y-8">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="display-title text-2xl font-semibold">Eventos</h1>
					<p className="text-muted-foreground">
						Gestiona la visibilidad de cada evento en el catálogo público.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{q.data ? (
						<TableExportMenu
							title="Eventos"
							filenameBase="eventos"
							columns={eventExportColumns}
							pageRows={q.data.items}
							pageCount={q.data.items.length}
							totalCount={q.data.total}
							fetchAllRows={fetchAllEvents}
							disabled={q.isFetching}
						/>
					) : null}
					<Button asChild>
						<Link to="/dashboard/events/create">Crear evento</Link>
					</Button>
				</div>
			</div>

			{q.isLoading ? <Skeleton className="h-64 w-full rounded-xl" /> : null}
			{q.isError ? (
				<p className="text-muted-foreground">No pudimos cargar los eventos.</p>
			) : null}

			{q.data && q.data.items.length === 0 ? (
				<p className="text-muted-foreground">Aún no hay eventos.</p>
			) : null}

			{q.data && q.data.items.length > 0 ? (
				<>
					<div
						className={cn(
							"table-fetching overflow-x-auto rounded-xl border",
							q.isFetching && "opacity-60",
						)}
					>
						<Table className="table-fixed">
							<TableHeader>
								<TableRow>
									<SortableTableHead
										label="Título"
										column="title"
										sortBy={sortBy}
										sortDirection={sortDirection}
										onSort={handleSort}
										className="w-[30%]"
									/>
									<SortableTableHead
										label="Enlace"
										column="slug"
										sortBy={sortBy}
										sortDirection={sortDirection}
										onSort={handleSort}
										className="w-[22%]"
									/>
									<SortableTableHead
										label="Inicio"
										column="startsAt"
										sortBy={sortBy}
										sortDirection={sortDirection}
										onSort={handleSort}
										className="w-[14%]"
									/>
									<SortableTableHead
										label="Visibilidad"
										column="published"
										sortBy={sortBy}
										sortDirection={sortDirection}
										onSort={handleSort}
										className="w-[16%]"
									/>
									<TableHead className="w-30 text-right">Acciones</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{q.data.items.map((ev) => (
									<TableRow key={ev.id}>
										<TableCell className="max-w-0 truncate font-medium">
											{ev.title}
										</TableCell>
										<TableCell className="max-w-0 truncate font-mono text-xs text-muted-foreground">
											/events/{ev.slug}
										</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{new Intl.DateTimeFormat("es", {
												dateStyle: "short",
											}).format(new Date(ev.startsAt))}
										</TableCell>
										<TableCell>
											<EventVisibilityControl event={ev} />
										</TableCell>
										<TableCell className="text-right">
											<Button variant="outline" size="sm" asChild>
												<Link
													to="/dashboard/events/$eventId/edit"
													params={{ eventId: ev.id }}
												>
													Editar
												</Link>
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
					<div className="flex items-center justify-between gap-4">
						<p className="text-sm text-muted-foreground">
							Página {page} · {q.data.total} eventos en total
						</p>
						<div className="flex gap-2">
							<Button
								type="button"
								variant="outline"
								disabled={page <= 1}
								onClick={() =>
									navigate({ search: { ...search, page: page - 1 } })
								}
							>
								Anterior
							</Button>
							<Button
								type="button"
								variant="outline"
								disabled={page * limit >= q.data.total}
								onClick={() =>
									navigate({ search: { ...search, page: page + 1 } })
								}
							>
								Siguiente
							</Button>
						</div>
					</div>
				</>
			) : null}
		</div>
	);
}
