import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "#/components/ui/button";
import { DateTimePicker } from "#/components/ui/datetime-picker";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import { ApiError, getUserFacingErrorMessage } from "#/lib/api/errors";
import { createEvent } from "#/lib/api/ticket-api";
import { eventsKeys } from "#/lib/query-keys";

const schema = z.object({
	title: z.string().min(2, "El título es obligatorio"),
	slug: z.string().optional(),
	description: z.string().optional(),
	startsAt: z.string().min(1, "La fecha de inicio es obligatoria"),
	endsAt: z.string().min(1, "La fecha de fin es obligatoria"),
	venue: z.string().optional(),
});

export const Route = createFileRoute("/dashboard/events/create")({
	component: CreateEventPage,
});

function CreateEventPage() {
	const qc = useQueryClient();
	const navigate = useNavigate();

	const mu = useMutation({
		mutationFn: (body: z.infer<typeof schema>) => createEvent(body),
		onSuccess: async (ev) => {
			await qc.invalidateQueries({ queryKey: eventsKeys.all });
			toast.success("Evento creado");
			void navigate({
				to: "/dashboard/events/$eventId/edit",
				params: { eventId: ev.id },
			});
		},
		onError: (e) =>
			toast.error(
				e instanceof ApiError ? e.message : getUserFacingErrorMessage(e),
			),
	});

	const form = useForm({
		defaultValues: {
			title: "",
			slug: "",
			description: "",
			startsAt: "",
			endsAt: "",
			venue: "",
		},
		onSubmit: async ({ value }) => {
			const parsed = schema.safeParse(value);
			if (!parsed.success) {
				toast.error("Revisa el formulario");
				return;
			}
			const body = {
				title: parsed.data.title,
				startsAt: parsed.data.startsAt,
				endsAt: parsed.data.endsAt,
				...(parsed.data.slug?.trim() ? { slug: parsed.data.slug.trim() } : {}),
				...(parsed.data.description?.trim()
					? { description: parsed.data.description.trim() }
					: {}),
				...(parsed.data.venue?.trim()
					? { venue: parsed.data.venue.trim() }
					: {}),
			};
			mu.mutate(body);
		},
	});

	return (
		<div className="mx-auto max-w-xl space-y-8">
			<div className="flex items-center justify-between gap-4">
				<h1 className="display-title text-2xl font-semibold">Crear evento</h1>
				<Button variant="ghost" asChild>
					<Link to="/dashboard/events">Cancelar</Link>
				</Button>
			</div>
			<form
				className="island-shell space-y-5 rounded-xl p-8"
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
			>
				<form.Field name="title">
					{(field) => (
						<div className="space-y-2">
							<Label required>Título</Label>
							<Input
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
							/>
						</div>
					)}
				</form.Field>
				<form.Field name="slug">
					{(field) => (
						<div className="space-y-2">
							<Label>Enlace personalizado (opcional)</Label>
							<Input
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="mi-evento-especial"
							/>
							<p className="text-xs text-muted-foreground">
								Se verá en /events/tu-enlace. Si lo dejas vacío, se genera
								automáticamente a partir del título.
							</p>
						</div>
					)}
				</form.Field>
				<form.Field name="description">
					{(field) => (
						<div className="space-y-2">
							<Label>Descripción</Label>
							<Textarea
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								rows={4}
							/>
						</div>
					)}
				</form.Field>
				<div className="grid gap-4 sm:grid-cols-2">
					<form.Field name="startsAt">
						{(field) => (
							<div className="space-y-2">
								<Label required>Inicio</Label>
								<DateTimePicker
									id="startsAt"
									value={field.state.value}
									onChange={field.handleChange}
									placeholder="Fecha y hora de inicio"
								/>
							</div>
						)}
					</form.Field>
					<form.Field name="endsAt">
						{(field) => (
							<div className="space-y-2">
								<Label required>Fin</Label>
								<DateTimePicker
									id="endsAt"
									value={field.state.value}
									onChange={field.handleChange}
									placeholder="Fecha y hora de fin"
								/>
							</div>
						)}
					</form.Field>
				</div>
				<form.Field name="venue">
					{(field) => (
						<div className="space-y-2">
							<Label>Lugar</Label>
							<Input
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
							/>
						</div>
					)}
				</form.Field>
				<Button type="submit" disabled={mu.isPending}>
					{mu.isPending ? "Guardando…" : "Crear evento"}
				</Button>
			</form>
		</div>
	);
}
