import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

import { PublicLayout } from "#/components/layouts/public-layout";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { ApiError } from "#/lib/api/errors";
import { registerRequest } from "#/lib/api/ticket-api";
import { getSession, setSession } from "#/lib/auth/session";

const registerSchema = z.object({
	email: z.string().email("Valid email required"),
	password: z.string().min(8, "At least 8 characters"),
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
	const [formError, setFormError] = useState<string | null>(null);
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		setHydrated(true);
	}, []);

	const form = useForm({
		defaultValues: { email: "", password: "" },
		onSubmit: async ({ value }) => {
			setFormError(null);
			const parsed = registerSchema.safeParse(value);
			if (!parsed.success) {
				setFormError(parsed.error.flatten().formErrors.join(", "));
				return;
			}
			try {
				const data = await registerRequest(parsed.data);
				setSession(data);
				window.location.href = data.user.role === "ADMIN" ? "/dashboard" : "/";
			} catch (e) {
				if (e instanceof ApiError) setFormError(e.message);
				else setFormError("Could not register");
			}
		},
	});

	if (!hydrated) {
		return (
			<PublicLayout>
				<div className="page-wrap py-16">Loading…</div>
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
							Create an account
						</h1>
						<p className="mt-2 text-muted-foreground">
							Buy tickets, track orders, and keep passes in your wallet.
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
									z.string().email("Valid email required").safeParse(value)
										.success
										? undefined
										: "Valid email required",
							}}
						>
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor="reg-email">Email</Label>
									<Input
										id="reg-email"
										type="email"
										autoComplete="email"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
									/>
									{field.state.meta.errors[0] ? (
										<p className="text-sm text-destructive">
											{field.state.meta.errors[0]}
										</p>
									) : null}
								</div>
							)}
						</form.Field>
						<form.Field
							name="password"
							validators={{
								onChange: ({ value }) =>
									value.length >= 8 ? undefined : "At least 8 characters",
							}}
						>
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor="reg-password">Password</Label>
									<Input
										id="reg-password"
										type="password"
										autoComplete="new-password"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
									/>
									{field.state.meta.errors[0] ? (
										<p className="text-sm text-destructive">
											{field.state.meta.errors[0]}
										</p>
									) : null}
								</div>
							)}
						</form.Field>
						{formError ? (
							<p className="text-sm text-destructive">{formError}</p>
						) : null}
						<Button type="submit" className="w-full" size="lg">
							Create account
						</Button>
					</form>
					<p className="text-center text-sm text-muted-foreground">
						Already have an account?{" "}
						<Link
							to="/login"
							className="font-medium text-primary underline-offset-4 hover:underline"
						>
							Sign in
						</Link>
					</p>
				</div>
			</div>
		</PublicLayout>
	);
}
