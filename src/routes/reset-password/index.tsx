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
import { resetPasswordRequest } from "#/lib/api/ticket-api";
import { setSession } from "#/lib/auth/session";

const resetSchema = z
	.object({
		newPassword: z.string().min(8, "Al menos 8 caracteres"),
		confirmPassword: z.string().min(8, "Al menos 8 caracteres"),
	})
	.refine((v) => v.newPassword === v.confirmPassword, {
		message: "Las contraseñas no coinciden",
		path: ["confirmPassword"],
	});

const passwordValidator = (value: string) =>
	value.length >= 8 ? undefined : "Al menos 8 caracteres";

export const Route = createFileRoute("/reset-password/")({
	ssr: false,
	validateSearch: z.object({
		token: z.string().optional(),
	}),
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const { token } = Route.useSearch();
	const [hydrated, setHydrated] = useState(false);
	const { headingClass, formClass } = useAuthEntrance();

	useEffect(() => {
		setHydrated(true);
	}, []);

	const form = useForm({
		defaultValues: {
			newPassword: "",
			confirmPassword: "",
		},
		onSubmit: async ({ value }) => {
			const parsed = resetSchema.safeParse(value);
			if (!parsed.success || !token) {
				if (!token) {
					toast.error("Falta el enlace de restablecimiento");
				}
				return;
			}
			try {
				const data = await resetPasswordRequest({
					token,
					newPassword: parsed.data.newPassword,
				});
				setSession(data);
				toast.success("Contraseña actualizada");
				const target = data.user.role === "ADMIN" ? "/dashboard" : "/account";
				window.location.href = target;
			} catch (e) {
				toast.error(
					getUserFacingErrorMessage(e, "No pudimos restablecer la contraseña"),
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

	if (!token) {
		return (
			<PublicLayout>
				<div className="page-wrap flex justify-center py-16 md:py-20">
					<div className="w-full max-w-md space-y-6 text-center">
						<AuthHeading
							entranceClass={headingClass}
							kicker="Acceso"
							title="Enlace no válido"
							description="Solicita un nuevo enlace de restablecimiento."
						/>
						<Button asChild>
							<Link to="/forgot-password">Solicitar enlace</Link>
						</Button>
					</div>
				</div>
			</PublicLayout>
		);
	}

	return (
		<PublicLayout>
			<div className="page-wrap flex justify-center py-16 md:py-20">
				<div className="w-full max-w-md space-y-8">
					<AuthHeading
						entranceClass={headingClass}
						kicker="Acceso"
						title="Nueva contraseña"
						description="Elige una contraseña segura para tu cuenta."
					/>
					<form
						className={formClass}
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
					>
						<form.Field
							name="newPassword"
							validators={{
								onChange: ({ value }) => passwordValidator(value),
								onSubmit: ({ value }) => passwordValidator(value),
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
										<Label htmlFor="newPassword" required>
											Nueva contraseña
										</Label>
										<Input
											id="newPassword"
											type="password"
											autoComplete="new-password"
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
						<form.Field
							name="confirmPassword"
							validators={{
								onChange: ({ value, fieldApi }) => {
									const base = passwordValidator(value);
									if (base) return base;
									const newPassword =
										fieldApi.form.getFieldValue("newPassword");
									return value === newPassword
										? undefined
										: "Las contraseñas no coinciden";
								},
								onSubmit: ({ value, fieldApi }) => {
									const base = passwordValidator(value);
									if (base) return base;
									const newPassword =
										fieldApi.form.getFieldValue("newPassword");
									return value === newPassword
										? undefined
										: "Las contraseñas no coinciden";
								},
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
										<Label htmlFor="confirmPassword" required>
											Confirmar contraseña
										</Label>
										<Input
											id="confirmPassword"
											type="password"
											autoComplete="new-password"
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
									{isSubmitting ? "Guardando…" : "Restablecer contraseña"}
								</Button>
							)}
						</form.Subscribe>
					</form>
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
