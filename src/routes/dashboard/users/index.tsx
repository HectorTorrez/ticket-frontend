import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, KeyRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "#/components/ui/button";
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
import { ApiError } from "#/lib/api/errors";
import { adminResetPasswordRequest } from "#/lib/api/ticket-api";
import type { AdminResetPasswordResponse } from "#/lib/api/schemas";

const emailSchema = z.string().email("Se requiere un correo válido");

const emailValidator = (value: string) =>
	emailSchema.safeParse(value).success
		? undefined
		: "Se requiere un correo válido";

export const Route = createFileRoute("/dashboard/users/")({
	component: AdminUsersPage,
});

function AdminUsersPage() {
	const [result, setResult] = useState<AdminResetPasswordResponse | null>(
		null,
	);

	const form = useForm({
		defaultValues: { email: "" },
		onSubmit: async ({ value }) => {
			const parsed = emailSchema.safeParse(value.email.trim());
			if (!parsed.success) return;
			try {
				const data = await adminResetPasswordRequest({ email: parsed.data });
				setResult(data);
				form.reset();
			} catch (e) {
				if (e instanceof ApiError) toast.error(e.message);
				else toast.error("No se pudo restablecer la contraseña");
			}
		},
	});

	const submissionAttempts = form.state.submissionAttempts;

	const copyPassword = async () => {
		if (!result?.temporaryPassword) return;
		try {
			await navigator.clipboard.writeText(result.temporaryPassword);
			toast.success("Contraseña copiada");
		} catch {
			toast.error("No se pudo copiar al portapapeles");
		}
	};

	return (
		<div className="space-y-8">
			<div>
				<h1 className="display-title text-2xl font-semibold">Usuarios</h1>
				<p className="text-muted-foreground">
					Restablece la contraseña de un cliente y comunícasela por otro canal
					(WhatsApp, en persona, etc.).
				</p>
			</div>

			<form
				className="max-w-lg space-y-4 rounded-xl border p-6"
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
			>
				<div className="flex items-center gap-3">
					<div className="inline-flex rounded-full bg-primary/10 p-2 text-primary">
						<KeyRound className="size-5" />
					</div>
					<div>
						<h2 className="font-medium">Restablecer contraseña</h2>
						<p className="text-sm text-muted-foreground">
							Se invalidan las sesiones activas del usuario.
						</p>
					</div>
				</div>

				<form.Field
					name="email"
					validators={{
						onChange: ({ value }) => emailValidator(value),
						onSubmit: ({ value }) => emailValidator(value),
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
								<Label htmlFor="reset-email" required>
									Correo del usuario
								</Label>
								<Input
									id="reset-email"
									type="email"
									autoComplete="off"
									placeholder="cliente@ejemplo.com"
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

				<Button type="submit">Generar contraseña temporal</Button>
			</form>

			<Dialog
				open={result !== null}
				onOpenChange={(open) => {
					if (!open) setResult(null);
				}}
			>
				<DialogContent showCloseButton={false}>
					<DialogHeader>
						<DialogTitle>Contraseña temporal generada</DialogTitle>
						<DialogDescription>
							Cópiala ahora; no se volverá a mostrar. Entrégasela al usuario
							por un canal seguro.
						</DialogDescription>
					</DialogHeader>
					{result ? (
						<div className="space-y-3">
							<p className="text-sm text-muted-foreground">
								Usuario:{" "}
								<span className="font-medium text-foreground">
									{result.user.email}
								</span>
							</p>
							<div className="flex items-center gap-2">
								<code className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm">
									{result.temporaryPassword}
								</code>
								<Button
									type="button"
									variant="outline"
									size="icon"
									onClick={() => void copyPassword()}
									aria-label="Copiar contraseña"
								>
									<Copy className="size-4" />
								</Button>
							</div>
						</div>
					) : null}
					<DialogFooter>
						<Button type="button" onClick={() => setResult(null)}>
							Listo
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
