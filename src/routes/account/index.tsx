import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	CalendarDays,
	KeyRound,
	LayoutDashboard,
	Ticket,
	User,
} from "lucide-react";

import { PublicLayout } from "#/components/layouts/public-layout";
import { PageHeader } from "#/components/page-header";
import { StatusBadge } from "#/components/status-indicator";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { useErrorToast } from "#/hooks/use-error-toast";
import { fetchMe } from "#/lib/api/ticket-api";
import { requireAuthRedirect } from "#/lib/auth/guards";
import { getSession, isAdmin } from "#/lib/auth/session";
import {
	myOrdersDefaultSearch,
	myTicketsDefaultSearch,
} from "#/lib/default-search";
import { labelFor, userStatusLabel } from "#/lib/labels";
import { accountKeys } from "#/lib/query-keys";

export const Route = createFileRoute("/account/")({
	ssr: false,
	beforeLoad: () => {
		requireAuthRedirect();
	},
	component: AccountPage,
});

function formatWhen(iso: string) {
	return new Intl.DateTimeFormat("es", {
		dateStyle: "long",
	}).format(new Date(iso));
}

function userStatusTone(status: string) {
	if (status === "ACTIVE") return "success" as const;
	if (status === "SUSPENDED") return "warning" as const;
	return "error" as const;
}

function AccountPage() {
	const session = getSession();
	const q = useQuery({
		queryKey: accountKeys.profile(),
		queryFn: fetchMe,
	});

	useErrorToast(q.isError ? q.error : null, "No pudimos cargar tu cuenta");

	const profile = q.data;

	return (
		<PublicLayout>
			<div className="page-wrap space-y-8 py-10 md:py-14">
				<PageHeader
					eyebrow="Cuenta"
					title="Tu perfil"
					description="Datos de acceso y enlaces rápidos a pedidos, pases y seguridad."
				/>

				{q.isPending ? <Skeleton className="h-56 rounded-xl" /> : null}

				{profile ? (
					<section className="surface-card max-w-xl space-y-6 p-6 md:p-8">
						<div className="flex items-start gap-4">
							<div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted">
								<User className="size-5 text-muted-foreground" aria-hidden />
							</div>
							<div className="min-w-0 space-y-2">
								<p className="truncate text-lg font-semibold">
									{profile.email}
								</p>
								<div className="flex flex-wrap items-center gap-2">
									<StatusBadge
										label={profile.role === "ADMIN" ? "Organizador" : "Cliente"}
										tone={profile.role === "ADMIN" ? "info" : "neutral"}
									/>
									<StatusBadge
										label={labelFor(userStatusLabel, profile.status)}
										tone={userStatusTone(profile.status)}
									/>
								</div>
								<p className="text-sm text-muted-foreground">
									Miembro desde {formatWhen(profile.createdAt)}
								</p>
							</div>
						</div>

						<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
							{session && session.user.role === "CUSTOMER" ? (
								<>
									<Button variant="outline" className="gap-2" asChild>
										<Link to="/my-tickets" search={myTicketsDefaultSearch}>
											<Ticket className="size-4" />
											Mis pases
										</Link>
									</Button>
									<Button variant="outline" className="gap-2" asChild>
										<Link to="/my-orders" search={myOrdersDefaultSearch}>
											<CalendarDays className="size-4" />
											Mis pedidos
										</Link>
									</Button>
								</>
							) : null}
							{session && isAdmin(session) ? (
								<Button variant="outline" className="gap-2" asChild>
									<Link to="/dashboard">
										<LayoutDashboard className="size-4" />
										Panel de organizador
									</Link>
								</Button>
							) : null}
							<Button variant="outline" className="gap-2" asChild>
								<Link to="/change-password">
									<KeyRound className="size-4" />
									Cambiar contraseña
								</Link>
							</Button>
						</div>
					</section>
				) : null}
			</div>
		</PublicLayout>
	);
}
