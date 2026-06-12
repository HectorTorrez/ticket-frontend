import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, CheckCircle2, ShieldCheck, Ticket } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PublicLayout } from "#/components/layouts/public-layout";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { ApiError } from "#/lib/api/errors";
import { fetchPublicTicket, validateQrCode } from "#/lib/api/ticket-api";
import { getSession, isAdmin } from "#/lib/auth/session";
import { labelFor, formatTicketCode, qrResultLabel, ticketStatusLabel, ticketTierLabel } from "#/lib/labels";
import { ticketsKeys } from "#/lib/query-keys";

export const Route = createFileRoute("/check/$publicCode")({
	component: CheckTicketPage,
});

function CheckTicketPage() {
	const { publicCode } = Route.useParams();
	const queryClient = useQueryClient();
	const session = typeof window !== "undefined" ? getSession() : null;
	const admin = isAdmin(session);
	const [lastResult, setLastResult] = useState<string | null>(null);

	const ticketQ = useQuery({
		queryKey: ticketsKeys.public(publicCode),
		queryFn: () => fetchPublicTicket(publicCode),
		retry: false,
	});

	const validate = useMutation({
		mutationFn: () => validateQrCode(publicCode),
		onSuccess: async (r) => {
			setLastResult(r.result);
			if (r.result === "VALID") {
				toast.success("Entrada validada — acceso concedido");
				await queryClient.invalidateQueries({
					queryKey: ticketsKeys.public(publicCode),
				});
			} else if (r.result === "ALREADY_USED") {
				toast.message("Esta entrada ya fue usada");
			} else {
				toast.error("Entrada inválida");
			}
		},
		onError: (e) =>
			toast.error(e instanceof ApiError ? e.message : "Error al validar"),
	});

	const ticket = ticketQ.data;
	const canCheckIn = admin && ticket?.status === "ACTIVE";

	return (
		<PublicLayout>
			<div className="page-wrap mx-auto max-w-lg space-y-8 py-12 md:py-16">
				<div className="rise-in text-center">
					<p className="island-kicker">Control de acceso</p>
					<h1 className="display-title mt-2 text-2xl font-semibold md:text-3xl">
						Verificación de entrada
					</h1>
				</div>

				{ticketQ.isPending ? (
					<Skeleton className="h-72 rounded-xl" />
				) : null}

				{ticketQ.isError ? (
					<div className="island-shell rounded-xl p-8 text-center">
						<Ticket className="mx-auto size-12 text-muted-foreground/50" />
						<p className="mt-4 text-lg font-medium">Entrada no encontrada</p>
						<p className="mt-1 text-sm text-muted-foreground">
							El código escaneado no corresponde a ningún pase activo en el
							sistema.
						</p>
						<Button className="mt-6" variant="outline" asChild>
							<Link to="/events">Ver eventos</Link>
						</Button>
					</div>
				) : null}

				{ticket ? (
					<article className="pass-card ticket-edge-left overflow-hidden rounded-xl">
						<div className="pass-card-stub flex w-20 shrink-0 flex-col items-center justify-center gap-1 px-3 py-6 text-center">
							<span className="text-[0.6rem] font-bold uppercase tracking-widest text-primary">
								{new Intl.DateTimeFormat("es", { month: "short" })
									.format(new Date(ticket.event.startsAt))
									.toUpperCase()}
							</span>
							<span className="display-title text-2xl font-bold leading-none">
								{new Date(ticket.event.startsAt).getDate()}
							</span>
							<span className="mt-2 text-[0.55rem] font-medium uppercase tracking-wider text-muted-foreground">
								{labelFor(ticketTierLabel, ticket.ticketType.tier)}
							</span>
						</div>
						<div className="min-w-0 flex-1 space-y-4 p-6">
							<div className="flex flex-wrap items-start justify-between gap-2">
								<h2 className="display-title text-xl font-semibold leading-snug">
									{ticket.event.title}
								</h2>
								<Badge
									variant={
										ticket.status === "ACTIVE" ? "default" : "secondary"
									}
								>
									{labelFor(ticketStatusLabel, ticket.status)}
								</Badge>
							</div>
							<p className="text-sm text-muted-foreground">
								{ticket.ticketType.name}
							</p>
							<div className="space-y-1 text-sm text-muted-foreground">
								<p className="flex items-center gap-1.5">
									<Calendar className="size-3.5 shrink-0" />
									{new Intl.DateTimeFormat("es", {
										dateStyle: "full",
										timeStyle: "short",
									}).format(new Date(ticket.event.startsAt))}
								</p>
							</div>
							<p className="text-xs text-muted-foreground">
								Código del pase{" "}
								<span className="font-mono">{formatTicketCode(ticket.publicCode)}</span>
							</p>
						</div>
					</article>
				) : null}

				{ticket && admin ? (
					<div className="island-shell space-y-4 rounded-xl p-6">
						<div className="flex items-center gap-2 text-sm font-medium">
							<ShieldCheck className="size-4 text-primary" />
							Personal autorizado — {session?.user.email}
						</div>
						{canCheckIn ? (
							<>
								<p className="text-sm text-muted-foreground">
									Confirma que el asistente puede entrar. La entrada quedará
									marcada como usada.
								</p>
								<Button
									type="button"
									className="w-full"
									size="lg"
									disabled={validate.isPending}
									onClick={() => validate.mutate()}
								>
									<CheckCircle2 className="size-4" />
									Confirmar entrada
								</Button>
							</>
						) : null}
						{ticket.status === "USED" ? (
							<p className="text-center text-sm text-muted-foreground">
								Esta entrada ya fue utilizada. No se puede validar de nuevo.
							</p>
						) : null}
						{ticket.status === "CANCELLED" ? (
							<p className="text-center text-sm text-destructive">
								Entrada cancelada — acceso denegado.
							</p>
						) : null}
						{lastResult ? (
							<output
								className="block text-center text-lg font-semibold"
								aria-live="polite"
							>
								Resultado: {labelFor(qrResultLabel, lastResult)}
							</output>
						) : null}
					</div>
				) : null}

				{ticket && !admin ? (
					<div className="island-shell space-y-4 rounded-xl p-6 text-center">
						<p className="text-sm text-muted-foreground">
							Presenta este pase en la entrada. El personal escaneará tu código
							QR o abrirá este enlace para validar tu acceso.
						</p>
						{ticket.status === "USED" ? (
							<p className="text-sm font-medium text-muted-foreground">
								Ya ingresaste con este pase.
							</p>
						) : null}
						<p className="text-xs text-muted-foreground">
							¿Eres personal del evento?{" "}
							<Link
								to="/login"
								search={{ redirect: `/check/${publicCode}` }}
								className="font-medium text-primary underline-offset-4 hover:underline"
							>
								Inicia sesión como organizador
							</Link>
						</p>
					</div>
				) : null}
			</div>
		</PublicLayout>
	);
}
