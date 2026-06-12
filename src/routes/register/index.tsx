import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { PublicLayout } from "#/components/layouts/public-layout";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { ApiError } from "#/lib/api/errors";
import { registerRequest } from "#/lib/api/ticket-api";
import { getSession, setSession } from "#/lib/auth/session";

const registerSchema = z.object({
	email: z.string().email("Se requiere un correo válido"),
	password: z.string().min(8, "Al menos 8 caracteres"),
});

export const Route = createFileRoute("/register/")({
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
				toast.error(
					parsed.error.flatten().formErrors.join(", ") || "Revisa el formulario",
				);
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
				<div className="page-wrap py-16">Cargando…</div>
			</PublicLayout>
		);
	}

	return (
		<PublicLayout>
			<div className="page-wrap flex justify-center py-16 md:py-20">
				<div className="w-full max-w-md space-y-8">
					<div className="rise-in text-center">
						<div className="mx-auto mb-4 inline-flex rounded-full bg-primary/10 p-3 text-primary">
							<UserPlus className="size-6" />
						</div>
						<h1 className="display-title text-3xl font-semibold">
							Crear una cuenta
						</h1>
						<p className="mt-2 text-muted-foreground">
							Compra entradas, sigue tus pedidos y guarda tus pases en la
							cartera.
						</p>
					</div>
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
								onChange: ({ value }) =>
									z.string().email("Se requiere un correo válido").safeParse(value)
										.success
										? undefined
										: "Se requiere un correo válido",
							}}
						>
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor="reg-email">Correo electrónico</Label>
									<Input
										id="reg-email"
										type="email"
										autoComplete="email"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
									/>
								</div>
							)}
						</form.Field>
						<form.Field
							name="password"
							validators={{
								onChange: ({ value }) =>
									value.length >= 8 ? undefined : "Al menos 8 caracteres",
							}}
						>
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor="reg-password">Contraseña</Label>
									<Input
										id="reg-password"
										type="password"
										autoComplete="new-password"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
									/>
								</div>
							)}
						</form.Field>
						<Button type="submit" className="w-full" size="lg">
							Crear cuenta
						</Button>
					</form>
					<p className="text-center text-sm text-muted-foreground">
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
