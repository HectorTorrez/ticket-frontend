import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
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
import { registerRequest } from "#/lib/api/ticket-api";
import { getSession, setSession } from "#/lib/auth/session";

const registerSchema = z.object({
	email: z.string().email("Se requiere un correo válido"),
	password: z.string().min(8, "Al menos 8 caracteres"),
});

const emailValidator = (value: string) =>
	z.string().email("Se requiere un correo válido").safeParse(value).success
		? undefined
		: "Se requiere un correo válido";

const passwordValidator = (value: string) =>
	value.length >= 8 ? undefined : "Al menos 8 caracteres";

export const Route = createFileRoute("/register/")({
	ssr: false,
	beforeLoad: () => {
		const s = getSession();
		if (!s) return;
		if (s.user.role === "ADMIN") throw redirect({ to: "/dashboard" });
		throw redirect({ to: "/" });
	},
	component: RegisterPage,
});

function RegisterPage() {
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		setHydrated(true);
	}, []);

	const form = useForm({
		defaultValues: { email: "", password: "" },
		onSubmit: async ({ value }) => {
			const parsed = registerSchema.safeParse(value);
			if (!parsed.success) {
				return;
			}
			try {
				const data = await registerRequest(parsed.data);
				setSession(data);
				window.location.href = data.user.role === "ADMIN" ? "/dashboard" : "/";
			} catch (e) {
				if (e instanceof ApiError) toast.error(e.message);
				else toast.error("No se pudo registrar la cuenta");
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
						kicker="Registro"
						title="Crear una cuenta"
						description="Compra entradas, sigue tus pedidos y guarda tus pases en la cartera."
					/>
					<form
						className="auth-shell rise-in stagger-1 space-y-6 p-8"
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
										<Label htmlFor="reg-email" required>
											Correo electrónico
										</Label>
										<Input
											id="reg-email"
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
						<form.Field
							name="password"
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
										<Label htmlFor="reg-password" required>
											Contraseña
										</Label>
										<Input
											id="reg-password"
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
									{isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
								</Button>
							)}
						</form.Subscribe>
					</form>
					<p className="text-sm text-muted-foreground">
						¿Ya tienes cuenta?{" "}
						<Link
							to="/login"
							className="font-medium text-primary underline-offset-4 hover:underline"
						>
							Inicia sesión
						</Link>
					</p>
				</div>
			</div>
		</PublicLayout>
	);
}
