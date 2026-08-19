import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { DateTimePicker } from "#/components/ui/datetime-picker";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { FieldError } from "#/components/ui/field-message";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Skeleton } from "#/components/ui/skeleton";
import { Switch } from "#/components/ui/switch";
import { Textarea } from "#/components/ui/textarea";
import { useErrorToast } from "#/hooks/use-error-toast";
import { adminEventsDefaultSearch } from "#/lib/admin/default-search";
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
import { toLocalDateTimeInput } from "#/lib/dates";
import { eventsKeys } from "#/lib/query-keys";
import { apiErrorMessage, toastMutation } from "#/lib/toast-mutation";

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

	useErrorToast(q.isError ? q.error : null, "No pudimos cargar el evento");

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [startsAt, setStartsAt] = useState("");
	const [endsAt, setEndsAt] = useState("");
	const [venue, setVenue] = useState("");
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	const validateDetails = () => {
		const errors: Record<string, string> = {};
		if (title.trim().length < 2) {
			errors.title = "El título es obligatorio";
		}
		if (!startsAt.trim()) {
			errors.startsAt = "La fecha de inicio es obligatoria";
		}
		if (!endsAt.trim()) {
			errors.endsAt = "La fecha de fin es obligatoria";
		}
		setFieldErrors(errors);
		return Object.keys(errors).length === 0;
	};

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
			toastMutation(
				patchEvent(eventId, {
					title,
					description: description || undefined,
					startsAt: new Date(startsAt).toISOString(),
					endsAt: new Date(endsAt).toISOString(),
					venue: venue || undefined,
				}).then(async (data) => {
					await qc.invalidateQueries({ queryKey: eventsKeys.all });
					return data;
				}),
				{
					loading: "Guardando…",
					success: "Guardado",
					error: (e) => apiErrorMessage(e, "Error al guardar"),
				},
			),
	});

	const togglePublished = useMutation({
		mutationFn: (nextPublished: boolean) =>
			toastMutation(
				(nextPublished ? publishEvent(eventId) : unpublishEvent(eventId)).then(
					async () => {
						await qc.invalidateQueries({ queryKey: eventsKeys.all });
						void q.refetch();
						return nextPublished;
					},
				),
				{
					loading: "Actualizando visibilidad…",
					success: (nextPublished) =>
						nextPublished
							? "Evento visible en el catálogo"
							: "Evento oculto del catálogo",
					error: (e) =>
						apiErrorMessage(e, "No se pudo actualizar la visibilidad"),
				},
			),
	});

	const remove = useMutation({
		mutationFn: () =>
			toastMutation(
				deleteEvent(eventId).then(async (data) => {
					await qc.invalidateQueries({ queryKey: eventsKeys.all });
					return data;
				}),
				{
					loading: "Eliminando evento…",
					success: () => {
						window.location.href = "/dashboard/events";
						return "Evento eliminado";
					},
					error: (e) => apiErrorMessage(e, "Error al eliminar"),
				},
			),
	});

	const banner = useMutation({
		mutationFn: (file: File) =>
			toastMutation(
				uploadEventBanner(eventId, file).then((data) => {
					void q.refetch();
					return data;
				}),
				{
					loading: "Subiendo banner…",
					success: "Banner actualizado",
					error: (e) => apiErrorMessage(e, "Error al subir"),
				},
			),
	});

	const [tier, setTier] = useState<TicketTier>("GENERAL");
	const [ttName, setTtName] = useState("");
	const [ttPrice, setTtPrice] = useState("0");
	const [ttQty, setTtQty] = useState("100");

	const addTier = useMutation({
		mutationFn: () =>
			toastMutation(
				createTicketType(eventId, {
					tier,
					name: ttName.trim(),
					price: Number(ttPrice),
					quantity: Number(ttQty),
				}).then((data) => {
					void q.refetch();
					setTtName("");
					setTier("GENERAL");
					setTtPrice("0");
					setTtQty("100");
					return data;
				}),
				{
					loading: "Añadiendo categoría…",
					success: "Categoría añadida",
					error: (e) => apiErrorMessage(e, "No se pudo añadir la categoría"),
				},
			),
	});

	const delTier = useMutation({
		mutationFn: (id: string) =>
			toastMutation(
				deleteTicketType(id).then((data) => {
					void q.refetch();
					return data;
				}),
				{
					loading: "Eliminando categoría…",
					success: "Categoría eliminada",
					error: (e) => apiErrorMessage(e, "No se pudo eliminar"),
				},
			),
	});

	const refetchTicketTypes = () => {
		void q.refetch();
	};

	if (q.isPending) return <Skeleton className="h-96 rounded-xl" />;
	if (q.isError || !q.data)
		return (
			<p className="text-muted-foreground">No pudimos cargar el evento.</p>
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
					<h1 className="display-title text-2xl font-semibold">
						Editar evento
					</h1>
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
						Página pública: <span className="font-mono">/events/{ev.slug}</span>
					</p>
				</div>
				<Button variant="ghost" asChild>
					<Link to="/dashboard/events" search={adminEventsDefaultSearch}>
						← Todos los eventos
					</Link>
				</Button>
			</header>

			<section className="space-y-4">
				<h2 className="text-sm font-semibold text-foreground">
					Detalles del evento
				</h2>
				<form
					className="island-shell space-y-5 rounded-xl p-8"
					onSubmit={(e) => {
						e.preventDefault();
						if (!validateDetails()) return;
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
							onChange={(e) => {
								setTitle(e.target.value);
								if (fieldErrors.title) {
									setFieldErrors((prev) => {
										const next = { ...prev };
										delete next.title;
										return next;
									});
								}
							}}
							aria-invalid={fieldErrors.title ? true : undefined}
						/>
						<FieldError>{fieldErrors.title}</FieldError>
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
								onChange={(value) => {
									setStartsAt(value);
									if (fieldErrors.startsAt) {
										setFieldErrors((prev) => {
											const next = { ...prev };
											delete next.startsAt;
											return next;
										});
									}
								}}
								placeholder="Fecha y hora de inicio"
							/>
							<FieldError>{fieldErrors.startsAt}</FieldError>
						</div>
						<div className="space-y-2">
							<Label htmlFor="endsAt" required>
								Fin
							</Label>
							<DateTimePicker
								id="endsAt"
								value={endsAt}
								onChange={(value) => {
									setEndsAt(value);
									if (fieldErrors.endsAt) {
										setFieldErrors((prev) => {
											const next = { ...prev };
											delete next.endsAt;
											return next;
										});
									}
								}}
								placeholder="Fecha y hora de fin"
							/>
							<FieldError>{fieldErrors.endsAt}</FieldError>
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
				<h2 className="text-sm font-semibold text-foreground">Banner</h2>
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
					<h2 className="text-sm font-semibold text-foreground">
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
				<h2 className="text-sm font-semibold text-destructive">
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
