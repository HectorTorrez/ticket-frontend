import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router";
import { Check, Clock, CreditCard, Ticket } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";
import { EmptyState } from "#/components/empty-state";
import { PublicLayout } from "#/components/layouts/public-layout";
import { PageHeader } from "#/components/page-header";
import { PosterSurface } from "#/components/poster-surface";
import { orderStatusTone, StatusBadge } from "#/components/status-indicator";
import { StatusPanel } from "#/components/status-panel";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { useErrorToast } from "#/hooks/use-error-toast";
import { getUserFacingErrorMessage } from "#/lib/api/errors";
import type { orderDetailSchema } from "#/lib/api/schemas";
import {
	cancelOrder,
	createOrder,
	fetchEventDetail,
	mockPayOrder,
} from "#/lib/api/ticket-api";
import { requireCustomer } from "#/lib/auth/guards";
import { labelFor, orderStatusLabel } from "#/lib/labels";
import { eventsKeys, ordersKeys, ticketsKeys } from "#/lib/query-keys";
import { cn } from "#/lib/utils";
import { useInventorySocket } from "#/routes/events/$eventSlugOrId/-hooks/use-inventory-socket";

type CheckoutLine = { ticketTypeId: string; quantity: number };
type OrderDetail = z.infer<typeof orderDetailSchema>;

const checkoutLinesKey = (eventSlugOrId: string) =>
	`checkout-lines:${eventSlugOrId}`;

const HOLD_SECONDS = 15 * 60;

function readStoredLines(eventSlugOrId: string): CheckoutLine[] | null {
	try {
		const raw = sessionStorage.getItem(checkoutLinesKey(eventSlugOrId));
		if (!raw) return null;
		const parsed = JSON.parse(raw) as CheckoutLine[];
		return parsed.length > 0 ? parsed : null;
	} catch {
		return null;
	}
}

function storeLines(eventSlugOrId: string, lines: CheckoutLine[]) {
	try {
		sessionStorage.setItem(
			checkoutLinesKey(eventSlugOrId),
			JSON.stringify(lines),
		);
	} catch {
		/* quota / private mode */
	}
}

function useCheckoutLines(eventSlugOrId: string): CheckoutLine[] | null {
	const fromState = useRouterState({
		select: (s) => {
			const st = s.location.state as { lines?: CheckoutLine[] } | undefined;
			if (!st?.lines?.length) return null;
			return st.lines;
		},
	});

	const [stored] = useState(() => readStoredLines(eventSlugOrId));

	const lines = fromState ?? stored;

	useEffect(() => {
		if (lines?.length) storeLines(eventSlugOrId, lines);
	}, [eventSlugOrId, lines]);

	return lines;
}

export const Route = createFileRoute("/events/$eventSlugOrId/checkout")({
	ssr: false,
	beforeLoad: () => {
		requireCustomer();
	},
	component: CheckoutPage,
});

function CheckoutPage() {
	const { eventSlugOrId } = Route.useParams();
	const navigate = useNavigate();
	const qc = useQueryClient();
	const lines = useCheckoutLines(eventSlugOrId);
	const autoReserveAttempted = useRef(false);

	const [order, setOrder] = useState<OrderDetail | null>(null);

	const eventQ = useQuery({
		queryKey: eventsKeys.detail(eventSlugOrId),
		queryFn: () => fetchEventDetail(eventSlugOrId),
	});

	useErrorToast(
		eventQ.isError ? eventQ.error : null,
		"No pudimos cargar el pago",
	);

	useInventorySocket(eventSlugOrId, eventQ.data?.id);

	const reserve = useMutation({
		mutationFn: () => {
			if (!lines?.length) throw new Error("No ticket lines");
			return createOrder(lines);
		},
		onSuccess: (o) => {
			setOrder(o);
			void qc.invalidateQueries({ queryKey: eventsKeys.detail(eventSlugOrId) });
		},
		onError: (e) => {
			toast.error(getUserFacingErrorMessage(e));
		},
	});

	useEffect(() => {
		if (!lines || lines.length === 0 || order || autoReserveAttempted.current)
			return;
		autoReserveAttempted.current = true;
		reserve.mutate();
	}, [lines, order, reserve]);

	const pay = useMutation({
		mutationFn: () => {
			if (!order) throw new Error("No order");
			return mockPayOrder(order.id, "SUCCESS");
		},
		onSuccess: async (paid) => {
			setOrder(paid);
			if (paid.status !== "PAID") {
				toast.error(
					paid.status === "EXPIRED"
						? "Tu reserva expiró. Vuelve a iniciar el pago."
						: "No se pudo completar el pago.",
				);
				return;
			}
			try {
				sessionStorage.removeItem(checkoutLinesKey(eventSlugOrId));
			} catch {
				/* ignore */
			}
			await qc.invalidateQueries({ queryKey: ordersKeys.all });
			await qc.invalidateQueries({ queryKey: ticketsKeys.all });
			await qc.invalidateQueries({
				queryKey: eventsKeys.detail(eventSlugOrId),
			});
			toast.success("Pago completado correctamente");
			void navigate({
				to: "/my-orders/$orderId",
				params: { orderId: paid.id },
			});
		},
		onError: (e) =>
			toast.error(getUserFacingErrorMessage(e, "Error al procesar el pago")),
	});

	const cancelMu = useMutation({
		mutationFn: () => {
			if (!order) throw new Error("No order");
			return cancelOrder(order.id);
		},
		onSuccess: async () => {
			toast.message("Reserva cancelada");
			await qc.invalidateQueries({
				queryKey: eventsKeys.detail(eventSlugOrId),
			});
			void navigate({
				to: "/events/$eventSlugOrId",
				params: { eventSlugOrId },
			});
		},
		onError: (e) =>
			toast.error(getUserFacingErrorMessage(e, "No se pudo cancelar")),
	});

	const expiresAt = order?.expiresAt;
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		if (!expiresAt) return;
		const t = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(t);
	}, [expiresAt]);

	const secondsLeft = useMemo(() => {
		if (!expiresAt) return null;
		const end = new Date(expiresAt).getTime();
		return Math.max(0, Math.floor((end - now) / 1000));
	}, [expiresAt, now]);

	const progress = useMemo(() => {
		if (secondsLeft === null) return 1;
		return secondsLeft / HOLD_SECONDS;
	}, [secondsLeft]);

	const selectionTotal = useMemo(() => {
		if (!eventQ.data || !lines) return 0;
		return lines.reduce((sum, l) => {
			const tt = eventQ.data?.ticketTypes.find((t) => t.id === l.ticketTypeId);
			if (!tt) return sum;
			return sum + Number(tt.price) * l.quantity;
		}, 0);
	}, [eventQ.data, lines]);

	const currentStep = order?.status === "PAID" ? 3 : order ? 2 : 1;
	const reservationExpired =
		order?.status === "PENDING" && secondsLeft !== null && secondsLeft <= 0;

	const isStepComplete = (step: number) => {
		if (step === 1) return currentStep > 1;
		if (step === 2) return currentStep > 2;
		return false;
	};

	const isStepCurrent = (step: number) => currentStep === step;

	if (!lines || lines.length === 0) {
		return (
			<PublicLayout>
				<div className="page-wrap space-y-6 py-16">
					<EmptyState
						icon={Ticket}
						title="Tu selección está vacía"
						description="Elige al menos una entrada antes de continuar al pago."
						action={
							<Button asChild>
								<Link to="/events/$eventSlugOrId" params={{ eventSlugOrId }}>
									Volver al evento
								</Link>
							</Button>
						}
					/>
				</div>
			</PublicLayout>
		);
	}

	if (eventQ.isPending) {
		return (
			<PublicLayout>
				<div className="page-wrap py-16">
					<Skeleton className="h-64 rounded-xl" />
				</div>
			</PublicLayout>
		);
	}

	if (eventQ.isError) {
		return (
			<PublicLayout>
				<div className="page-wrap py-16 text-center">
					<p className="text-muted-foreground">No pudimos cargar el pago.</p>
					<Button className="mt-6" variant="outline" asChild>
						<Link to="/events/$eventSlugOrId" params={{ eventSlugOrId }}>
							Volver al evento
						</Link>
					</Button>
				</div>
			</PublicLayout>
		);
	}

	if (!eventQ.data) {
		return (
			<PublicLayout>
				<div className="page-wrap py-16 text-muted-foreground">
					Datos del evento no disponibles.
				</div>
			</PublicLayout>
		);
	}

	const ev = eventQ.data;

	return (
		<PublicLayout>
			<div className="page-wrap max-w-xl space-y-8 py-12 md:py-16">
				<PageHeader
					eyebrow="Tu entrada"
					title={ev.title}
					description="Revisa la selección y completa el pago antes de que termine la reserva."
				/>

				{/* Steps */}
				<ol
					className="grid grid-cols-3 gap-2 text-sm"
					aria-label="Progreso del pago"
				>
					{[
						{ n: 1, label: "Selección", icon: Ticket },
						{ n: 2, label: "Pago", icon: CreditCard },
						{ n: 3, label: "Confirmación", icon: Check },
					].map((s) => {
						const complete = isStepComplete(s.n);
						const current = isStepCurrent(s.n);

						return (
							<li key={s.n} className="min-w-0">
								<span
									className={cn(
										"flex h-12 w-full items-center justify-center gap-1.5 rounded-sm border px-1.5 font-medium transition-colors sm:px-3",
										complete && "border-primary/40 bg-primary/5 text-primary",
										current &&
											"border-2 border-primary bg-primary/10 text-primary ring-2 ring-primary/15",
										!complete &&
											!current &&
											"border-transparent bg-muted text-muted-foreground",
									)}
								>
									{complete ? (
										<Check className="size-3.5 shrink-0" aria-hidden />
									) : (
										<s.icon className="size-3.5 shrink-0" aria-hidden />
									)}
									<span className="truncate text-xs sm:text-sm">{s.label}</span>
								</span>
							</li>
						);
					})}
				</ol>

				{/* Selection summary */}
				<PosterSurface variant="receipt" padding="default">
					<h2 className="font-semibold">Tu selección</h2>
					<ul className="mt-4 space-y-3 text-sm">
						{lines.map((l) => {
							const tt = ev.ticketTypes.find((t) => t.id === l.ticketTypeId);
							if (!tt) return null;
							return (
								<li
									key={l.ticketTypeId}
									className="flex justify-between gap-2 border-b border-border/50 pb-3 last:border-0 last:pb-0"
								>
									<span>
										{tt.name} × {l.quantity}
									</span>
									<span className="font-medium">
										{new Intl.NumberFormat("es", {
											style: "currency",
											currency: "USD",
										}).format(Number(tt.price) * l.quantity)}
									</span>
								</li>
							);
						})}
					</ul>
					<div className="mt-4 flex justify-between border-t border-dashed border-border pt-4 font-semibold">
						<span>Subtotal</span>
						<span className="display-title text-2xl">
							{new Intl.NumberFormat("es", {
								style: "currency",
								currency: "USD",
							}).format(selectionTotal)}
						</span>
					</div>
				</PosterSurface>

				{reserve.isPending && !order ? (
					<p className="text-sm text-muted-foreground">
						Reservando tus entradas…
					</p>
				) : null}

				{reserve.isError ? (
					<StatusPanel
						tone="error"
						title="No se pudo crear la reserva"
						description="El inventario pudo cambiar mientras elegías tus entradas."
						action={
							<Button
								variant="outline"
								size="sm"
								onClick={() => reserve.mutate()}
								disabled={reserve.isPending}
							>
								Reintentar reserva
							</Button>
						}
					/>
				) : null}

				{order ? (
					<PosterSurface
						variant="receipt"
						padding="default"
						className="border-primary/30"
					>
						<div className="flex flex-wrap items-start justify-between gap-4">
							<div>
								<h2 className="font-semibold">Reserva confirmada</h2>
								<p className="mt-1 text-sm text-muted-foreground">
									Estado:{" "}
									<StatusBadge
										label={labelFor(orderStatusLabel, order.status)}
										tone={orderStatusTone(order.status)}
									/>
								</p>
							</div>
							{secondsLeft !== null && order.status === "PENDING" ? (
								<div
									className="countdown-ring"
									style={{ "--progress": progress } as React.CSSProperties}
								>
									<div className="countdown-ring-inner">
										<span className="flex flex-col items-center leading-tight">
											<Clock className="mb-0.5 size-3 text-phosphor" />
											{Math.floor(secondsLeft / 60)}:
											{String(secondsLeft % 60).padStart(2, "0")}
										</span>
									</div>
								</div>
							) : null}
						</div>

						<p className="display-title mt-4 text-4xl font-semibold">
							{new Intl.NumberFormat("es", {
								style: "currency",
								currency: order.currency,
							}).format(Number(order.totalAmount))}
						</p>

						{order.status === "PENDING" && reservationExpired ? (
							<StatusPanel
								tone="warning"
								title="Tu reserva expiró"
								description="El tiempo para completar el pago terminó. Vuelve al evento para reservar de nuevo."
								className="mt-6"
								action={
									<Button variant="outline" size="sm" asChild>
										<Link
											to="/events/$eventSlugOrId"
											params={{ eventSlugOrId }}
										>
											Volver al evento
										</Link>
									</Button>
								}
							/>
						) : null}

						{order.status === "PENDING" && !reservationExpired ? (
							<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
								<Button
									size="lg"
									className="w-full gap-2 sm:w-auto"
									onClick={() => pay.mutate()}
									disabled={pay.isPending}
								>
									<CreditCard className="size-4" />
									Completar pago
								</Button>
								<Button
									variant="outline"
									className="w-full sm:w-auto"
									onClick={() => cancelMu.mutate()}
									disabled={cancelMu.isPending}
								>
									Liberar reserva
								</Button>
							</div>
						) : null}
					</PosterSurface>
				) : null}

				<Button variant="ghost" asChild>
					<Link to="/events/$eventSlugOrId" params={{ eventSlugOrId }}>
						← Editar selección
					</Link>
				</Button>
			</div>
		</PublicLayout>
	);
}
