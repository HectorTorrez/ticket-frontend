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
import { ApiError } from "#/lib/api/errors";
import { changePasswordRequest } from "#/lib/api/ticket-api";
import { requireAuthRedirect } from "#/lib/auth/guards";
import { setSession } from "#/lib/auth/session";

const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(8, "Al menos 8 caracteres"),
		newPassword: z.string().min(8, "Al menos 8 caracteres"),
		confirmPassword: z.string().min(8, "Al menos 8 caracteres"),
	})
	.refine((v) => v.newPassword === v.confirmPassword, {
		message: "Las contraseñas no coinciden",
		path: ["confirmPassword"],
	});

const passwordValidator = (value: string) =>
	value.length >= 8 ? undefined : "Al menos 8 caracteres";

export const Route = createFileRoute("/change-password/")({
	ssr: false,
	beforeLoad: () => {
		requireAuthRedirect();
	},
	component: ChangePasswordPage,
});

function ChangePasswordPage() {
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		setHydrated(true);
	}, []);

	const form = useForm({
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
		onSubmit: async ({ value }) => {
			const parsed = changePasswordSchema.safeParse(value);
			if (!parsed.success) {
				return;
			}
			try {
				const data = await changePasswordRequest({
					currentPassword: parsed.data.currentPassword,
					newPassword: parsed.data.newPassword,
				});
				setSession(data);
				toast.success("Contraseña actualizada");
				form.reset();
			} catch (e) {
				if (e instanceof ApiError) toast.error(e.message);
				else toast.error("No se pudo cambiar la contraseña");
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
						kicker="Cuenta"
						title="Cambiar contraseña"
						description="Introduce tu contraseña actual y elige una nueva."
					/>
					<form
						className="auth-shell rise-in stagger-1 space-y-6 p-8"
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
					>
						<form.Field
							name="currentPassword"
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
										<Label htmlFor="currentPassword" required>
											Contraseña actual
										</Label>
										<Input
											id="currentPassword"
											type="password"
											autoComplete="current-password"
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
											Confirmar nueva contraseña
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
									{isSubmitting ? "Guardando…" : "Guardar contraseña"}
								</Button>
							)}
						</form.Subscribe>
					</form>
					<p className="text-sm text-muted-foreground">
						<Link
							to="/"
							className="font-medium text-primary underline-offset-4 hover:underline"
						>
							Volver al inicio
						</Link>
					</p>
				</div>
			</div>
		</PublicLayout>
	);
}
