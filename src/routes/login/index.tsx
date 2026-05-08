import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";

import { PublicLayout } from "#/components/layouts/public-layout";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { ApiError } from "#/lib/api/errors";
import { loginRequest } from "#/lib/api/ticket-api";
import { getSession, setSession } from "#/lib/auth/session";

const loginSchema = z.object({
	email: z.string().email("Valid email required"),
	password: z.string().min(8, "At least 8 characters"),
});

export const Route = createFileRoute("/login/")({
	validateSearch: z.object({
		redirect: z.string().optional(),
	}),
	beforeLoad: () => {
		const s = getSession();
		if (!s) return;
		if (s.user.role === "ADMIN") throw redirect({ to: "/dashboard" });
		throw redirect({ to: "/" });
	},
	component: LoginPage,
});

function LoginPage() {
	const { redirect: redirectTo } = Route.useSearch();
	const [formError, setFormError] = useState<string | null>(null);
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		setHydrated(true);
	}, []);

	const form = useForm({
		defaultValues: { email: "", password: "" },
		onSubmit: async ({ value }) => {
			setFormError(null);
			const parsed = loginSchema.safeParse(value);
			if (!parsed.success) {
				setFormError(parsed.error.flatten().formErrors.join(", "));
				return;
			}
			try {
				const data = await loginRequest(parsed.data);
				setSession(data);
				const safeRedirect =
					redirectTo?.startsWith("/") && !redirectTo.startsWith("//")
						? redirectTo
						: null;
				const target =
					safeRedirect ?? (data.user.role === "ADMIN" ? "/dashboard" : "/");
				window.location.href = target;
			} catch (e) {
				if (e instanceof ApiError) setFormError(e.message);
				else setFormError("Could not sign in");
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
			<div className="page-wrap flex max-w-md flex-col gap-8 py-16">
				<div>
					<h1 className="display-title text-3xl font-semibold">Welcome back</h1>
					<p className="mt-2 text-muted-foreground">
						Sign in to reserve tickets and manage orders.
					</p>
				</div>
				<form
					className="island-shell space-y-6 rounded-xl p-8"
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
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
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
								<Label htmlFor="password">Password</Label>
								<Input
									id="password"
									type="password"
									autoComplete="current-password"
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
					<Button type="submit" className="w-full">
						Sign in
					</Button>
				</form>
				<p className="text-center text-sm text-muted-foreground">
					No account?{" "}
					<Link
						to="/register"
						className="font-medium text-primary underline-offset-4 hover:underline"
					>
						Register
					</Link>
				</p>
			</div>
		</PublicLayout>
	);
}
