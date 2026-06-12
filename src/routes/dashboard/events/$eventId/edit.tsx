import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { DateTimePicker } from "#/components/ui/datetime-picker";
import { Skeleton } from "#/components/ui/skeleton";
import { Switch } from "#/components/ui/switch";
import { Textarea } from "#/components/ui/textarea";
import { useErrorToast } from "#/hooks/use-error-toast";
import { ApiError } from "#/lib/api/errors";
import type { TicketTier } from "#/lib/api/schemas";
import {
	createTicketType,
	deleteEvent,
	deleteTicketType,
	fetchOrganizerEventDetail,
	patchEvent,
	publishEvent,
	unpublishEvent,
	uploadEventBanner,
} from "#/lib/api/ticket-api";
import { eventsKeys } from "#/lib/query-keys";
import { toLocalDateTimeInput } from "#/lib/dates";

import { AddTicketTypeCollapsible } from "#/routes/dashboard/events/-components/add-ticket-type-collapsible";
import { TicketTypeEditor } from "#/routes/dashboard/events/-components/ticket-type-editor";

export const Route = createFileRoute("/dashboard/events/$eventId/edit")({
	component: EditEventPage,
});

function EditEventPage() {
	const { eventId } = Route.useParams();
	const qc = useQueryClient();

	const q = useQuery({
		queryKey: eventsKeys.adminDetail(eventId),
		queryFn: () => fetchOrganizerEventDetail(eventId),
	});

	useErrorToast(
		q.isError ? q.error : null,
		"No pudimos cargar el evento",
	);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [startsAt, setStartsAt] = useState("");
	const [endsAt, setEndsAt] = useState("");
	const [venue, setVenue] = useState("");
	const [deleteOpen, setDeleteOpen] = useState(false);

	useEffect(() => {
		if (!q.data) return;
		setTitle(q.data.title);
		setDescription(q.data.description ?? "");
		setStartsAt(toLocalDateTimeInput(new Date(q.data.startsAt)));
		setEndsAt(toLocalDateTimeInput(new Date(q.data.endsAt)));
		setVenue(q.data.venue ?? "");
	}, [q.data]);

	const save = useMutation({
		mutationFn: () =>
			patchEvent(eventId, {
				title,
				description: description || undefined,
				startsAt: new Date(startsAt).toISOString(),
				endsAt: new Date(endsAt).toISOString(),
				venue: venue || undefined,
			}),
		onSuccess: async () => {
			await qc.invalidateQueries({ queryKey: eventsKeys.all });
			toast.success("Guardado");
		},
		onError: (e) =>
			toast.error(e instanceof ApiError ? e.message : "Error al guardar"),
	});

	const togglePublished = useMutation({
		mutationFn: (nextPublished: boolean) =>
			nextPublished ? publishEvent(eventId) : unpublishEvent(eventId),
		onSuccess: async (_data, nextPublished) => {
			await qc.invalidateQueries({ queryKey: eventsKeys.all });
			toast.success(
				nextPublished
					? "Evento visible en el catálogo"
					: "Evento oculto del catálogo",
			);
			void q.refetch();
		},
		onError: (e) =>
			toast.error(
				e instanceof ApiError ? e.message : "No se pudo actualizar la visibilidad",
			),
	});

	const remove = useMutation({
		mutationFn: () => deleteEvent(eventId),
		onSuccess: async () => {
			await qc.invalidateQueries({ queryKey: eventsKeys.all });
			toast.success("Evento eliminado");
			window.location.href = "/dashboard/events";
		},
		onError: (e) =>
			toast.error(e instanceof ApiError ? e.message : "Error al eliminar"),
	});

	const banner = useMutation({
		mutationFn: (file: File) => uploadEventBanner(eventId, file),
		onSuccess: async () => {
			void q.refetch();
			toast.success("Banner actualizado");
		},
		onError: (e) =>
			toast.error(e instanceof ApiError ? e.message : "Error al subir"),
	});

	const [tier, setTier] = useState<TicketTier>("GENERAL");
	const [ttName, setTtName] = useState("");
	const [ttPrice, setTtPrice] = useState("0");
	const [ttQty, setTtQty] = useState("100");

	const addTier = useMutation({
		mutationFn: () =>
			createTicketType(eventId, {
				tier,
				name: ttName.trim(),
				price: Number(ttPrice),
				quantity: Number(ttQty),
			}),
		onSuccess: async () => {
			void q.refetch();
			setTtName("");
			setTier("GENERAL");
			setTtPrice("0");
			setTtQty("100");
			toast.success("Categoría añadida");
		},
		onError: (e) =>
			toast.error(
				e instanceof ApiError ? e.message : "No se pudo añadir la categoría",
			),
	});

	const delTier = useMutation({
		mutationFn: (id: string) => deleteTicketType(id),
		onSuccess: async () => {
			void q.refetch();
			toast.success("Categoría eliminada");
		},
		onError: (e) =>
			toast.error(e instanceof ApiError ? e.message : "No se pudo eliminar"),
	});

	const refetchTicketTypes = () => {
		void q.refetch();
	};

	if (q.isPending) return <Skeleton className="h-96 rounded-xl" />;
	if (q.isError || !q.data)
		return (
			<p className="text-muted-foreground">
				No pudimos cargar el evento.
			</p>
		);

	const ev = q.data;
	const canAddTier =
		ttName.trim().length > 0 &&
		!Number.isNaN(Number(ttPrice)) &&
		Number(ttPrice) >= 0 &&
		!Number.isNaN(Number(ttQty)) &&
		Number(ttQty) >= 1;

	return (
		<div className="mx-auto max-w-2xl space-y-10 pb-16">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div className="space-y-3">
					<h1 className="display-title text-2xl font-semibold">Editar evento</h1>
					<div className="flex flex-wrap items-center gap-3">
						<div className="flex items-center gap-2">
							<Switch
								id={`published-${ev.id}`}
								checked={ev.published}
								disabled={togglePublished.isPending}
								onCheckedChange={(checked) => {
									if (checked !== ev.published) {
										togglePublished.mutate(checked);
									}
								}}
							/>
							<Label
								htmlFor={`published-${ev.id}`}
								className="cursor-pointer text-sm leading-none font-normal"
							>
								{ev.published
									? "Visible en el catálogo"
									: "Oculto del catálogo"}
							</Label>
						</div>
						<Badge variant={ev.published ? "default" : "secondary"}>
							{ev.published ? "En catálogo" : "Oculto"}
						</Badge>
					</div>
					<p className="text-xs text-muted-foreground">
						Página pública:{" "}
						<span className="font-mono">/events/{ev.slug}</span>
					</p>
				</div>
				<Button variant="ghost" asChild>
					<Link to="/dashboard/events">← Todos los eventos</Link>
				</Button>
			</header>

			<section className="space-y-4">
				<h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
					Detalles del evento
				</h2>
				<form
					className="island-shell space-y-5 rounded-xl p-8"
					onSubmit={(e) => {
						e.preventDefault();
						save.mutate();
					}}
				>
					<div className="space-y-2">
						<Label htmlFor="title" required>
							Título
						</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">Descripción</Label>
						<Textarea
							id="description"
							rows={4}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="startsAt" required>
								Inicio
							</Label>
							<DateTimePicker
								id="startsAt"
								value={startsAt}
								onChange={setStartsAt}
								placeholder="Fecha y hora de inicio"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="endsAt" required>
								Fin
							</Label>
							<DateTimePicker
								id="endsAt"
								value={endsAt}
								onChange={setEndsAt}
								placeholder="Fecha y hora de fin"
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="venue">Lugar</Label>
						<Input
							id="venue"
							value={venue}
							onChange={(e) => setVenue(e.target.value)}
						/>
					</div>
					<Button type="submit" disabled={save.isPending}>
						{save.isPending ? "Guardando…" : "Guardar cambios"}
					</Button>
				</form>
			</section>

			<section className="space-y-4">
				<h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
					Banner
				</h2>
				<div className="island-shell space-y-4 rounded-xl p-8">
					{ev.bannerUrl ? (
						<img
							src={ev.bannerUrl}
							alt=""
							className="max-h-48 w-full rounded-lg border object-cover"
						/>
					) : (
						<p className="text-sm text-muted-foreground">
							Sin imagen. Sube un JPG, PNG o WebP para el catálogo.
						</p>
					)}
					<div className="space-y-2">
						<Label htmlFor="banner">Imagen del evento</Label>
						<Input
							id="banner"
							type="file"
							accept="image/jpeg,image/png,image/webp"
							disabled={banner.isPending}
							onChange={(e) => {
								const f = e.target.files?.[0];
								if (f) banner.mutate(f);
							}}
						/>
					</div>
				</div>
			</section>

			<section className="space-y-4">
				<div className="space-y-1">
					<h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
						Categorías de entrada
					</h2>
					<p className="text-sm text-muted-foreground">
						Define precio, stock y tipo para cada categoría. Puedes cambiar la
						categoría después de crearla.
					</p>
				</div>

				{ev.ticketTypes.length === 0 ? (
					<div className="island-shell rounded-xl p-8 text-center text-sm text-muted-foreground">
						Aún no hay categorías. Añade al menos una para vender entradas.
					</div>
				) : (
					<ul className="space-y-3">
						{ev.ticketTypes.map((t, index) => (
							<li key={t.id}>
								<TicketTypeEditor
									ticketType={t}
									defaultOpen={index === 0 && ev.ticketTypes.length === 1}
									onUpdated={refetchTicketTypes}
									onDelete={() => delTier.mutate(t.id)}
									isDeleting={delTier.isPending}
								/>
							</li>
						))}
					</ul>
				)}

				<AddTicketTypeCollapsible
					defaultOpen={ev.ticketTypes.length === 0}
					tier={tier}
					name={ttName}
					price={ttPrice}
					quantity={ttQty}
					onTierChange={setTier}
					onNameChange={setTtName}
					onPriceChange={setTtPrice}
					onQuantityChange={setTtQty}
					canSubmit={canAddTier}
					isPending={addTier.isPending}
					onSubmit={() => addTier.mutate()}
				/>
			</section>

			<section className="space-y-4 border-t pt-10">
				<h2 className="text-sm font-medium tracking-wide text-destructive uppercase">
					Zona peligrosa
				</h2>
				<div className="island-shell rounded-xl p-8">
					<p className="text-sm text-muted-foreground">
						Eliminar el evento borra también todas sus categorías de entrada. No
						se puede deshacer.
					</p>
					<Button
						type="button"
						variant="destructive"
						className="mt-4"
						onClick={() => setDeleteOpen(true)}
					>
						Eliminar evento
					</Button>
				</div>
				<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
					<DialogContent showCloseButton={false}>
						<DialogHeader>
							<DialogTitle>¿Eliminar este evento?</DialogTitle>
							<DialogDescription>
								Esta acción no se puede deshacer. Se eliminarán también las
								categorías de entrada asociadas.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setDeleteOpen(false)}
							>
								Cancelar
							</Button>
							<Button
								type="button"
								variant="destructive"
								disabled={remove.isPending}
								onClick={() => {
									setDeleteOpen(false);
									remove.mutate();
								}}
							>
								Eliminar evento
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</section>
		</div>
	);
}
