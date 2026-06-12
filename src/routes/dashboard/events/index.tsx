import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import type { z } from "zod";

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
import { ApiError } from "#/lib/api/errors";
import { eventListItemSchema } from "#/lib/api/schemas";
import {
	fetchAdminEventsList,
	publishEvent,
	unpublishEvent,
} from "#/lib/api/ticket-api";
import { eventsKeys } from "#/lib/query-keys";

type EventListItem = z.infer<typeof eventListItemSchema>;

export const Route = createFileRoute("/dashboard/events/")({
	component: DashboardEventsList,
});

const ADMIN_EVENTS_PAGE_SIZE = 10;

function EventVisibilityControl({ event }: { event: EventListItem }) {
	const qc = useQueryClient();
	const toggle = useMutation({
		mutationFn: (nextPublished: boolean) =>
			nextPublished ? publishEvent(event.id) : unpublishEvent(event.id),
		onSuccess: async (_data, nextPublished) => {
			await qc.invalidateQueries({ queryKey: eventsKeys.all });
			toast.success(
				nextPublished
					? "El evento ya es público"
					: "El evento ahora es borrador",
			);
		},
		onError: (e) =>
			toast.error(
				e instanceof ApiError ? e.message : "No se pudo actualizar la visibilidad",
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
						? "El evento es público — desactiva para ocultarlo del catálogo"
						: "El evento es borrador — activa para publicarlo"
				}
				onCheckedChange={(checked) => {
					if (checked !== event.published) toggle.mutate(checked);
				}}
			/>
			<Badge variant={event.published ? "default" : "secondary"}>
				{event.published ? "Público" : "Borrador"}
			</Badge>
		</div>
	);
}

function DashboardEventsList() {
	const q = useQuery({
		queryKey: eventsKeys.adminList({
			page: 1,
			limit: ADMIN_EVENTS_PAGE_SIZE,
		}),
		queryFn: () =>
			fetchAdminEventsList({
				page: 1,
				limit: ADMIN_EVENTS_PAGE_SIZE,
			}),
	});

	return (
		<div className="space-y-8">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="display-title text-2xl font-semibold">Eventos</h1>
					<p className="text-muted-foreground">
						Todos los eventos (borrador y públicos). Usa el interruptor para
						publicar u ocultar del catálogo.
					</p>
				</div>
				<Button asChild>
					<Link to="/dashboard/events/create">Crear evento</Link>
				</Button>
			</div>

			{q.isPending ? <Skeleton className="h-64 w-full rounded-xl" /> : null}
			{q.isError ? (
				<p className="text-destructive">{(q.error as Error).message}</p>
			) : null}

			{q.data && q.data.items.length === 0 ? (
				<p className="text-muted-foreground">Aún no hay eventos.</p>
			) : null}

			{q.data && q.data.items.length > 0 ? (
				<div className="overflow-x-auto rounded-xl border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Título</TableHead>
								<TableHead>Slug</TableHead>
								<TableHead>Inicio</TableHead>
								<TableHead>Visibilidad</TableHead>
								<TableHead className="text-right">Acciones</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{q.data.items.map((ev) => (
								<TableRow key={ev.id}>
									<TableCell className="font-medium">{ev.title}</TableCell>
									<TableCell className="font-mono text-xs">{ev.slug}</TableCell>
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
			) : null}
		</div>
	);
}
