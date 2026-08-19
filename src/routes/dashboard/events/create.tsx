import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "#/components/ui/button";
import { DateTimePicker } from "#/components/ui/datetime-picker";
import { FieldError, FieldHint } from "#/components/ui/field-message";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import { adminEventsDefaultSearch } from "#/lib/admin/default-search";
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

const titleValidator = (value: string) =>
	value.trim().length >= 2 ? undefined : "El título es obligatorio";

const startsAtValidator = (value: string) =>
	value.trim().length > 0 ? undefined : "La fecha de inicio es obligatoria";

const endsAtValidator = (value: string) =>
	value.trim().length > 0 ? undefined : "La fecha de fin es obligatoria";

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

	const submissionAttempts = form.state.submissionAttempts;

	return (
		<div className="mx-auto max-w-xl space-y-8">
			<div className="flex items-center justify-between gap-4">
				<h1 className="display-title text-2xl font-semibold">Crear evento</h1>
				<Button variant="ghost" asChild>
					<Link to="/dashboard/events" search={adminEventsDefaultSearch}>
						Cancelar
					</Link>
				</Button>
			</div>
			<form
				className="island-shell space-y-5 rounded-xl p-8"
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
			>
				<form.Field
					name="title"
					validators={{
						onChange: ({ value }) => titleValidator(value),
						onSubmit: ({ value }) => titleValidator(value),
					}}
				>
					{(field) => {
						const showError =
							field.state.meta.errors.length > 0 &&
							(field.state.meta.isTouched || submissionAttempts > 0);
						const errorText = showError
							? String(field.state.meta.errors[0] ?? "")
							: undefined;

						return (
							<div className="space-y-2">
								<Label required>Título</Label>
								<Input
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									aria-invalid={showError ? true : undefined}
								/>
								<FieldError>{errorText}</FieldError>
							</div>
						);
					}}
				</form.Field>
				<form.Field name="slug">
					{(field) => (
						<div className="space-y-2">
							<Label>Enlace personalizado (opcional)</Label>
							<FieldHint>
								Se verá en /events/tu-enlace. Si lo dejas vacío, se genera
								automáticamente a partir del título.
							</FieldHint>
							<Input
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="mi-evento-especial"
							/>
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
					<form.Field
						name="startsAt"
						validators={{
							onChange: ({ value }) => startsAtValidator(value),
							onSubmit: ({ value }) => startsAtValidator(value),
						}}
					>
						{(field) => {
							const showError =
								field.state.meta.errors.length > 0 &&
								(field.state.meta.isTouched || submissionAttempts > 0);
							const errorText = showError
								? String(field.state.meta.errors[0] ?? "")
								: undefined;

							return (
								<div className="space-y-2">
									<Label required>Inicio</Label>
									<DateTimePicker
										id="startsAt"
										value={field.state.value}
										onChange={field.handleChange}
										placeholder="Fecha y hora de inicio"
									/>
									<FieldError>{errorText}</FieldError>
								</div>
							);
						}}
					</form.Field>
					<form.Field
						name="endsAt"
						validators={{
							onChange: ({ value }) => endsAtValidator(value),
							onSubmit: ({ value }) => endsAtValidator(value),
						}}
					>
						{(field) => {
							const showError =
								field.state.meta.errors.length > 0 &&
								(field.state.meta.isTouched || submissionAttempts > 0);
							const errorText = showError
								? String(field.state.meta.errors[0] ?? "")
								: undefined;

							return (
								<div className="space-y-2">
									<Label required>Fin</Label>
									<DateTimePicker
										id="endsAt"
										value={field.state.value}
										onChange={field.handleChange}
										placeholder="Fecha y hora de fin"
									/>
									<FieldError>{errorText}</FieldError>
								</div>
							);
						}}
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
