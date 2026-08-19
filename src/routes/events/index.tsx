import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { z } from "zod";
import { EmptyState } from "#/components/empty-state";
import { PublicLayout } from "#/components/layouts/public-layout";
import { PageHeader } from "#/components/page-header";
import { PosterSurface } from "#/components/poster-surface";
import { Button } from "#/components/ui/button";
import { DateRangePicker } from "#/components/ui/date-range-picker";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Skeleton } from "#/components/ui/skeleton";
import { useErrorToast } from "#/hooks/use-error-toast";
import { fetchEventsList } from "#/lib/api/ticket-api";
import { parseSearchDate, toFilterFromDate, toFilterToDate } from "#/lib/dates";
import { eventsKeys } from "#/lib/query-keys";
import { buildSiteMeta } from "#/lib/seo";
import { EventCard } from "#/routes/events/-components/event-card";

const searchSchema = z.object({
	page: z.coerce.number().catch(1),
	limit: z.coerce.number().catch(10),
	q: z.string().optional(),
	from: z.string().optional(),
	to: z.string().optional(),
});

export const Route = createFileRoute("/events/")({
	validateSearch: (search) => searchSchema.parse(search),
	head: () =>
		buildSiteMeta({
			title: "Explorar eventos en vivo — Tide Tickets",
			description:
				"Busca experiencias en vivo por fecha o nombre. Compra entradas con disponibilidad en tiempo real y pases QR al pagar.",
			path: "/events",
		}),
	component: EventsListPage,
});

function searchParamsToDateRange(
	from?: string,
	to?: string,
): DateRange | undefined {
	const fromDate = parseSearchDate(from);
	const toDate = parseSearchDate(to);
	if (!fromDate && !toDate) return undefined;
	return { from: fromDate, to: toDate };
}

function EventsListPage() {
	const search = Route.useSearch();
	const { page, limit, q, from, to } = search;
	const navigate = Route.useNavigate();
	const [dateRange, setDateRange] = useState<DateRange | undefined>(() =>
		searchParamsToDateRange(from, to),
	);

	useEffect(() => {
		setDateRange(searchParamsToDateRange(from, to));
	}, [from, to]);

	const query = useQuery({
		queryKey: eventsKeys.list({
			page,
			limit,
			publishedOnly: true,
			q,
			from,
			to,
		}),
		queryFn: () =>
			fetchEventsList({
				page,
				limit,
				publishedOnly: true,
				q,
				from,
				to,
			}),
	});

	useErrorToast(
		query.isError ? query.error : null,
		"No pudimos cargar los eventos",
	);

	return (
		<PublicLayout>
			<div className="page-wrap space-y-10 py-12 md:py-16">
				<PageHeader
					eyebrow="Cartelera"
					title="Explorar eventos"
					description={
						<p>
							Busca por nombre o fecha. El cupo se actualiza mientras otros
							compran.
						</p>
					}
				/>

				<PosterSurface variant="flow" padding="none">
					<form
						className="flex flex-col gap-4 p-6 md:flex-row md:flex-wrap md:items-end"
						onSubmit={(e) => {
							e.preventDefault();
							const fd = new FormData(e.currentTarget);
							const nq = String(fd.get("q") ?? "").trim();
							navigate({
								search: {
									page: 1,
									limit,
									q: nq || undefined,
									from: dateRange?.from
										? toFilterFromDate(dateRange.from)
										: undefined,
									to: dateRange?.to ? toFilterToDate(dateRange.to) : undefined,
								},
							});
						}}
					>
						<div className="min-w-[200px] flex-1 space-y-2">
							<Label htmlFor="q">Buscar</Label>
							<div className="relative">
								<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									id="q"
									name="q"
									placeholder="Título o lugar"
									defaultValue={q ?? ""}
									className="pl-9"
								/>
							</div>
						</div>
						<div className="w-full space-y-2 md:w-auto">
							<Label htmlFor="date-range">Fechas</Label>
							<DateRangePicker
								id="date-range"
								value={dateRange}
								onChange={setDateRange}
								onClear={() => {
									if (from || to) {
										navigate({
											search: {
												page: 1,
												limit,
												q: q || undefined,
											},
										});
									}
								}}
								placeholder="Cualquier fecha"
							/>
						</div>
						<Button type="submit">Aplicar filtros</Button>
					</form>
				</PosterSurface>

				{query.isPending ? (
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{[
							"ev-sk-1",
							"ev-sk-2",
							"ev-sk-3",
							"ev-sk-4",
							"ev-sk-5",
							"ev-sk-6",
						].map((id) => (
							<Skeleton key={id} className="h-80 rounded-xl" />
						))}
					</div>
				) : null}

				{query.isError ? (
					<EmptyState
						icon={Search}
						title="No pudimos abrir la cartelera"
						description="Inténtalo de nuevo en unos instantes."
					/>
				) : null}

				{query.data && query.data.items.length === 0 ? (
					<EmptyState
						icon={Search}
						title="No encontramos esa fecha"
						description="Ningún evento coincide con los filtros aplicados."
						action={
							<Button
								variant="outline"
								onClick={() =>
									navigate({
										search: { page: 1, limit },
									})
								}
							>
								Limpiar filtros
							</Button>
						}
					/>
				) : null}

				{query.data && query.data.items.length > 0 ? (
					<>
						<p className="text-sm text-muted-foreground">
							{query.data.total} evento{query.data.total === 1 ? "" : "s"}{" "}
							encontrado{query.data.total === 1 ? "" : "s"}
						</p>
						<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{query.data.items.map((ev, index) => (
								<EventCard
									key={ev.id}
									event={ev}
									revealDelayMs={Math.min(index * 50, 200)}
								/>
							))}
						</div>
						<div className="flex items-center justify-between gap-4 border-t border-border/60 pt-6">
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
							<span className="text-sm text-muted-foreground">
								Página {page} de{" "}
								{Math.max(1, Math.ceil(query.data.total / limit))}
							</span>
							<Button
								type="button"
								variant="outline"
								disabled={page * limit >= query.data.total}
								onClick={() =>
									navigate({ search: { ...search, page: page + 1 } })
								}
							>
								Siguiente
							</Button>
						</div>
					</>
				) : null}
			</div>
		</PublicLayout>
	);
}
