import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthFormSkeleton, AuthHeading } from "#/components/auth-heading";
import { PublicLayout } from "#/components/layouts/public-layout";
import { Button } from "#/components/ui/button";
import { FieldError } from "#/components/ui/field-message";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { useAuthEntrance } from "#/hooks/use-auth-entrance";
import { getUserFacingErrorMessage } from "#/lib/api/errors";
import type { ForgotPasswordResponse } from "#/lib/api/schemas";
import { forgotPasswordRequest } from "#/lib/api/ticket-api";

const forgotSchema = z.object({
	email: z.string().email("Se requiere un correo válido"),
});

const emailValidator = (value: string) =>
	z.string().email("Se requiere un correo válido").safeParse(value).success
		? undefined
		: "Se requiere un correo válido";

export const Route = createFileRoute("/forgot-password/")({
	ssr: false,
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const [hydrated, setHydrated] = useState(false);
	const [result, setResult] = useState<ForgotPasswordResponse | null>(null);
	const { headingClass, formClass } = useAuthEntrance();

	useEffect(() => {
		setHydrated(true);
	}, []);

	const form = useForm({
		defaultValues: { email: "" },
		onSubmit: async ({ value }) => {
			const parsed = forgotSchema.safeParse(value);
			if (!parsed.success) return;
			try {
				const data = await forgotPasswordRequest(parsed.data);
				setResult(data);
				toast.success("Revisa tu correo si tienes una cuenta registrada");
			} catch (e) {
				toast.error(
					getUserFacingErrorMessage(
						e,
						"No pudimos procesar la solicitud de restablecimiento",
					),
				);
			}
		},
	});

	if (!hydrated) {
		return (
			<PublicLayout>
				<AuthFormSkeleton />
			</PublicLayout>
		);
	}

	const submissionAttempts = form.state.submissionAttempts;

	return (
		<PublicLayout>
			<div className="page-wrap flex justify-center py-16 md:py-20">
				<div className="w-full max-w-md space-y-8">
					<AuthHeading
						entranceClass={headingClass}
						kicker="Acceso"
						title="¿Olvidaste tu contraseña?"
						description="Te enviaremos un enlace para elegir una nueva contraseña."
					/>

					{result ? (
						<div className="surface-card space-y-4 p-6 text-sm">
							<p>{result.message}</p>
							{result.resetUrl ? (
								<div className="space-y-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-4">
									<p className="font-medium text-amber-800 dark:text-amber-300">
										Modo desarrollo
									</p>
									<p className="text-muted-foreground">
										En local el correo no se envía. Usa este enlace para
										continuar:
									</p>
									<Button variant="outline" className="w-full" asChild>
										<a href={result.resetUrl}>Abrir restablecimiento</a>
									</Button>
								</div>
							) : null}
						</div>
					) : (
						<form
							className={formClass}
							onSubmit={(e) => {
								e.preventDefault();
								form.handleSubmit();
							}}
						>
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
											<Label htmlFor="email" required>
												Correo electrónico
											</Label>
											<Input
												id="email"
												type="email"
												autoComplete="email"
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
							<form.Subscribe selector={(state) => state.isSubmitting}>
								{(isSubmitting) => (
									<Button
										type="submit"
										className="w-full"
										size="lg"
										disabled={isSubmitting}
									>
										{isSubmitting ? "Enviando…" : "Enviar enlace"}
									</Button>
								)}
							</form.Subscribe>
						</form>
					)}

					<p className="text-sm text-muted-foreground">
						<Link
							to="/login"
							className="font-medium text-primary underline-offset-4 hover:underline"
						>
							Volver a iniciar sesión
						</Link>
					</p>
				</div>
			</div>
		</PublicLayout>
	);
}
