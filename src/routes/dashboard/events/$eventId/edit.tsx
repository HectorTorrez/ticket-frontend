import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Separator } from "#/components/ui/separator";
import { Skeleton } from "#/components/ui/skeleton";
import { Switch } from "#/components/ui/switch";
import { Textarea } from "#/components/ui/textarea";
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
import { labelFor, ticketTierLabel } from "#/lib/labels";
import { eventsKeys } from "#/lib/query-keys";

export const Route = createFileRoute("/dashboard/events/$eventId/edit")({
	component: EditEventPage,
});

function toLocalInput(iso: string) {
	try {
		const d = new Date(iso);
		const pad = (n: number) => String(n).padStart(2, "0");
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	} catch {
		return "";
	}
}

function EditEventPage() {
	const { eventId } = Route.useParams();
	const qc = useQueryClient();

	const q = useQuery({
		queryKey: eventsKeys.adminDetail(eventId),
		queryFn: () => fetchOrganizerEventDetail(eventId),
	});

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [startsAt, setStartsAt] = useState("");
	const [endsAt, setEndsAt] = useState("");
	const [venue, setVenue] = useState("");

	useEffect(() => {
		if (!q.data) return;
		setTitle(q.data.title);
		setDescription(q.data.description ?? "");
		setStartsAt(toLocalInput(q.data.startsAt));
		setEndsAt(toLocalInput(q.data.endsAt));
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
					? "El evento ya es público"
					: "El evento ahora es borrador",
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
				name: ttName,
				price: Number(ttPrice),
				quantity: Number(ttQty),
			}),
		onSuccess: async () => {
			void q.refetch();
			setTtName("");
			toast.success("Tipo de entrada añadido");
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
			toast.success("Eliminado");
		},
		onError: (e) =>
			toast.error(e instanceof ApiError ? e.message : "No se pudo eliminar"),
	});

	if (q.isPending) return <Skeleton className="h-96 rounded-xl" />;
	if (q.isError || !q.data)
		return (
			<p className="text-destructive">
				{(q.error as Error)?.message ?? "No encontrado"}
			</p>
		);

	const ev = q.data;

	return (
		<div className="mx-auto max-w-3xl space-y-10">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="display-title text-2xl font-semibold">Editar evento</h1>
					<div className="mt-2 flex flex-wrap items-center gap-3">
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
									? "Público (visible en el catálogo)"
									: "Borrador (oculto del catálogo)"}
							</Label>
						</div>
						<Badge variant={ev.published ? "default" : "secondary"}>
							{ev.published ? "Público" : "Borrador"}
						</Badge>
						<span className="font-mono text-xs text-muted-foreground">
							{ev.slug}
						</span>
					</div>
				</div>
				<Button variant="ghost" asChild>
					<Link to="/dashboard/events">← Todos los eventos</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Detalles</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label>Título</Label>
						<Input value={title} onChange={(e) => setTitle(e.target.value)} />
					</div>
					<div className="space-y-2">
						<Label>Descripción</Label>
						<Textarea
							rows={4}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label>Inicio</Label>
							<Input
								type="datetime-local"
								value={startsAt}
								onChange={(e) => setStartsAt(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Fin</Label>
							<Input
								type="datetime-local"
								value={endsAt}
								onChange={(e) => setEndsAt(e.target.value)}
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label>Lugar</Label>
						<Input value={venue} onChange={(e) => setVenue(e.target.value)} />
					</div>
					<Button
						type="button"
						onClick={() => save.mutate()}
						disabled={save.isPending}
					>
						Guardar cambios
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Banner</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{ev.bannerUrl ? (
						<img
							src={ev.bannerUrl}
							alt=""
							className="max-h-48 rounded-lg border object-cover"
						/>
					) : null}
					<Input
						type="file"
						accept="image/jpeg,image/png,image/webp"
						onChange={(e) => {
							const f = e.target.files?.[0];
							if (f) banner.mutate(f);
						}}
					/>
				</CardContent>
			</Card>

			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					variant="destructive"
					onClick={() => {
						if (confirm("¿Eliminar este evento de forma suave?")) remove.mutate();
					}}
				>
					Eliminar
				</Button>
			</div>

			<Separator />

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Tipos de entrada</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<ul className="space-y-2 text-sm">
						{ev.ticketTypes.map((t) => (
							<li
								key={t.id}
								className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
							>
								<span>
									{t.name} ({labelFor(ticketTierLabel, t.tier)}) —{" "}
									{t.quantityRemaining}/{t.quantityTotal ?? "?"} disponibles
								</span>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="text-destructive"
									onClick={() => delTier.mutate(t.id)}
								>
									Eliminar
								</Button>
							</li>
						))}
					</ul>
					<div className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
						<div className="space-y-2 sm:col-span-2">
							<Label>Categoría</Label>
							<Select
								value={tier}
								onValueChange={(v) => setTier(v as TicketTier)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="GENERAL">
										{ticketTierLabel.GENERAL}
									</SelectItem>
									<SelectItem value="VIP">{ticketTierLabel.VIP}</SelectItem>
									<SelectItem value="EARLY_BIRD">
										{ticketTierLabel.EARLY_BIRD}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Nombre</Label>
							<Input
								value={ttName}
								onChange={(e) => setTtName(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Precio (USD)</Label>
							<Input
								type="number"
								min={0}
								step="0.01"
								value={ttPrice}
								onChange={(e) => setTtPrice(e.target.value)}
							/>
						</div>
						<div className="space-y-2 sm:col-span-2">
							<Label>Cantidad</Label>
							<Input
								type="number"
								min={1}
								value={ttQty}
								onChange={(e) => setTtQty(e.target.value)}
							/>
						</div>
						<Button
							type="button"
							className="sm:col-span-2"
							onClick={() => addTier.mutate()}
							disabled={!ttName.trim() || addTier.isPending}
						>
							Añadir tipo de entrada
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
