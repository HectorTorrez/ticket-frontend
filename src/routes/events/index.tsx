import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { z } from "zod";

import { PublicLayout } from "#/components/layouts/public-layout";
import { QueryErrorAlert } from "#/components/query-error-alert";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Skeleton } from "#/components/ui/skeleton";
import { fetchEventsList } from "#/lib/api/ticket-api";
import { eventsKeys } from "#/lib/query-keys";
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
	component: EventsListPage,
});

function EventsListPage() {
	const search = Route.useSearch();
	const { page, limit, q, from, to } = search;
	const navigate = Route.useNavigate();

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

	return (
		<PublicLayout>
			<div className="page-wrap space-y-10 py-12 md:py-16">
				<header className="rise-in space-y-3">
					<p className="island-kicker">Descubre</p>
					<h1 className="display-title text-3xl font-semibold md:text-4xl">
						Explorar eventos
					</h1>
					<p className="max-w-xl text-muted-foreground">
						Experiencias en vivo con disponibilidad en tiempo real. Consigue
						entradas antes de que se agoten.
					</p>
				</header>

				<form
					className="island-shell rise-in stagger-1 flex flex-col gap-4 rounded-xl p-6 md:flex-row md:flex-wrap md:items-end"
					onSubmit={(e) => {
						e.preventDefault();
						const fd = new FormData(e.currentTarget);
						const nq = String(fd.get("q") ?? "").trim();
						const nf = String(fd.get("from") ?? "").trim();
						const nt = String(fd.get("to") ?? "").trim();
						navigate({
							search: {
								page: 1,
								limit,
								q: nq || undefined,
								from: nf || undefined,
								to: nt || undefined,
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
					<div className="w-full space-y-2 md:w-44">
						<Label htmlFor="from">Desde</Label>
						<Input
							id="from"
							name="from"
							type="datetime-local"
							defaultValue={from ?? ""}
						/>
					</div>
					<div className="w-full space-y-2 md:w-44">
						<Label htmlFor="to">Hasta</Label>
						<Input
							id="to"
							name="to"
							type="datetime-local"
							defaultValue={to ?? ""}
						/>
					</div>
					<Button type="submit">Aplicar filtros</Button>
				</form>

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
					<QueryErrorAlert
						title="No pudimos cargar los eventos"
						error={query.error}
					/>
				) : null}

				{query.data && query.data.items.length === 0 ? (
					<div className="island-shell rounded-xl p-12 text-center">
						<p className="text-muted-foreground">
							Ningún evento coincide con tus filtros.
						</p>
						<Button
							variant="outline"
							className="mt-4"
							onClick={() =>
								navigate({
									search: { page: 1, limit },
								})
							}
						>
							Limpiar filtros
						</Button>
					</div>
				) : null}

				{query.data && query.data.items.length > 0 ? (
					<>
						<p className="text-sm text-muted-foreground">
							{query.data.total} evento{query.data.total === 1 ? "" : "s"}{" "}
							encontrado{query.data.total === 1 ? "" : "s"}
						</p>
						<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{query.data.items.map((ev) => (
								<EventCard key={ev.id} event={ev} />
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
