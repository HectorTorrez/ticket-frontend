import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Calendar,
	CheckCircle2,
	Download,
	MapPin,
	ShieldCheck,
	Ticket,
} from "lucide-react";
import { useState } from "react";

import { PublicLayout } from "#/components/layouts/public-layout";
import {
	qrResultTone,
	StatusIndicator,
	ticketStatusTone,
} from "#/components/status-indicator";
import { TicketDateStub } from "#/components/ticket-date-stub";
import { TicketQrCode } from "#/components/ticket-qr-code";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { usePageEntrance } from "#/hooks/use-auth-entrance";
import { useErrorToast } from "#/hooks/use-error-toast";
import {
	fetchPublicTicket,
	ticketPdfUrl,
	validateQrCode,
} from "#/lib/api/ticket-api";
import { getSession, isAdmin } from "#/lib/auth/session";
import {
	formatTicketCode,
	labelFor,
	qrResultLabel,
	ticketStatusLabel,
} from "#/lib/labels";
import { ticketsKeys } from "#/lib/query-keys";
import { apiErrorMessage, toastMutation } from "#/lib/toast-mutation";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/check/$publicCode")({
	component: CheckTicketPage,
});

function CheckTicketPage() {
	const { publicCode } = Route.useParams();
	const queryClient = useQueryClient();
	const session = typeof window !== "undefined" ? getSession() : null;
	const admin = isAdmin(session);
	const [lastResult, setLastResult] = useState<string | null>(null);
	const headingClass = usePageEntrance("ticket-check-entrance-seen");

	const ticketQ = useQuery({
		queryKey: ticketsKeys.public(publicCode),
		queryFn: () => fetchPublicTicket(publicCode),
		retry: false,
	});

	useErrorToast(
		ticketQ.isError ? ticketQ.error : null,
		"Entrada no encontrada",
	);

	const validate = useMutation({
		mutationFn: () =>
			toastMutation(validateQrCode(publicCode), {
				loading: "Validando entrada…",
				success: (r) => {
					setLastResult(r.result);
					if (r.result === "VALID") {
						void queryClient.invalidateQueries({
							queryKey: ticketsKeys.public(publicCode),
						});
						return "Entrada validada — acceso concedido";
					}
					if (r.result === "ALREADY_USED") {
						return "Esta entrada ya fue usada";
					}
					throw new Error("Entrada inválida");
				},
				error: (e) =>
					e instanceof Error && e.message === "Entrada inválida"
						? e.message
						: apiErrorMessage(e, "Error al validar"),
			}),
	});

	const ticket = ticketQ.data;
	const canCheckIn = admin && ticket?.status === "ACTIVE";

	return (
		<PublicLayout>
			<div className="page-wrap mx-auto max-w-lg space-y-8 py-12 md:py-16">
				<div className={cn("text-center", headingClass)}>
					<p className="island-kicker">Control de acceso</p>
					<h1 className="display-title mt-2 text-2xl font-semibold md:text-3xl">
						Verificación de entrada
					</h1>
				</div>

				{ticketQ.isPending ? <Skeleton className="h-72 rounded-xl" /> : null}

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
						{ticket.event.bannerUrl ? (
							<div className="relative aspect-[2/1] w-full border-b border-border/60 bg-muted">
								<img
									src={ticket.event.bannerUrl}
									alt=""
									className="size-full object-cover"
									loading="eager"
									decoding="async"
								/>
							</div>
						) : null}
						<div className="flex flex-col sm:flex-row">
							<div className="pass-card-stub flex w-full shrink-0 flex-row items-center justify-center gap-3 px-4 py-4 sm:w-20 sm:flex-col sm:px-3 sm:py-6">
								<TicketDateStub
									startsAt={ticket.event.startsAt}
									tier={ticket.ticketType.tier}
								/>
							</div>
							<div className="min-w-0 flex-1 space-y-4 border-t border-dashed border-border p-6 sm:border-t-0 sm:border-l">
								<div className="flex flex-wrap items-start justify-between gap-2">
									<h2 className="display-title text-xl font-semibold leading-snug">
										{ticket.event.title}
									</h2>
									<StatusIndicator
										label={labelFor(ticketStatusLabel, ticket.status)}
										tone={ticketStatusTone(ticket.status)}
										className="text-sm shrink-0"
									/>
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
									{ticket.event.venue ? (
										<p className="flex items-center gap-1.5">
											<MapPin className="size-3.5 shrink-0" />
											{ticket.event.venue}
										</p>
									) : null}
								</div>
							</div>
						</div>
						<div className="flex flex-col items-center gap-3 border-t border-dashed border-border bg-muted/30 px-6 py-8">
							<p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
								Escanea en la entrada
							</p>
							<div className="rounded-lg border border-border bg-white p-3 shadow-sm">
								<TicketQrCode
									publicCode={ticket.publicCode}
									size={180}
									alt={`Código QR para ${ticket.event.title}`}
									className="rounded"
								/>
							</div>
							<span className="font-ticket-code text-xs uppercase tracking-wider text-muted-foreground">
								{formatTicketCode(ticket.publicCode)}
							</span>
							<Button variant="outline" size="sm" className="mt-2" asChild>
								<a
									href={ticketPdfUrl(ticket.publicCode)}
									target="_blank"
									rel="noopener noreferrer"
								>
									<Download className="mr-2 size-4" aria-hidden />
									Descargar PDF
								</a>
							</Button>
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
							<p className="text-center text-sm text-muted-foreground">
								Entrada cancelada — acceso denegado.
							</p>
						) : null}
						{lastResult ? (
							<output
								key={lastResult}
								className="state-reveal block rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-center"
								aria-live="polite"
							>
								<StatusIndicator
									label={`Resultado: ${labelFor(qrResultLabel, lastResult)}`}
									tone={qrResultTone(lastResult)}
									className="text-base"
								/>
							</output>
						) : null}
					</div>
				) : null}

				{ticket && !admin ? (
					<div className="island-shell space-y-4 rounded-xl p-6 text-center">
						<p className="text-sm text-muted-foreground">
							Presenta el código QR de arriba en la entrada. El personal lo
							escaneará para validar tu acceso.
						</p>
						{ticket.status === "USED" ? (
							<p className="text-sm font-medium text-muted-foreground">
								Ya ingresaste con este pase.
							</p>
						) : null}
						{!session ? (
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
						) : null}
					</div>
				) : null}
			</div>
		</PublicLayout>
	);
}
