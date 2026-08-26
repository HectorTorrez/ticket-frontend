import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Clock, CreditCard, ReceiptText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";

import { PublicLayout } from "#/components/layouts/public-layout";
import { PageHeader } from "#/components/page-header";
import { PosterSurface } from "#/components/poster-surface";
import { orderStatusTone, StatusBadge } from "#/components/status-indicator";
import { StatusPanel } from "#/components/status-panel";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { useErrorToast } from "#/hooks/use-error-toast";
import { getUserFacingErrorMessage } from "#/lib/api/errors";
import type {
	orderDetailSchema,
	orderEventSummarySchema,
} from "#/lib/api/schemas";
import { cancelOrder, fetchMyOrder, mockPayOrder } from "#/lib/api/ticket-api";
import { requireCustomer } from "#/lib/auth/guards";
import {
	eventsListDefaultSearch,
	myOrdersDefaultSearch,
	myTicketsDefaultSearch,
} from "#/lib/default-search";
import { formatOrderRef, labelFor, orderStatusLabel } from "#/lib/labels";
import { ordersKeys, ticketsKeys } from "#/lib/query-keys";

export const Route = createFileRoute("/my-orders/$orderId")({
	ssr: false,
	beforeLoad: () => {
		requireCustomer();
	},
	component: OrderDetailPage,
});

type OrderDetail = z.infer<typeof orderDetailSchema>;
type OrderEventSummary = z.infer<typeof orderEventSummarySchema>;

function formatWhen(iso: string) {
	return new Intl.DateTimeFormat("es", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(iso));
}

function isOrderEventSummary(value: unknown): value is OrderEventSummary {
	return (
		typeof value === "object" &&
		value !== null &&
		"slug" in value &&
		"title" in value &&
		typeof value.slug === "string" &&
		typeof value.title === "string"
	);
}

function getOrderEvent(order: OrderDetail): OrderEventSummary | null {
	for (const line of order.lines) {
		const tt = line.ticketType;
		if ("event" in tt && isOrderEventSummary(tt.event)) return tt.event;
	}
	return null;
}

function OrderDetailPage() {
	const { orderId } = Route.useParams();
	const navigate = useNavigate();
	const qc = useQueryClient();
	const [now, setNow] = useState(() => Date.now());

	const q = useQuery({
		queryKey: ordersKeys.meDetail(orderId),
		queryFn: () => fetchMyOrder(orderId),
		refetchInterval: (query) => {
			const order = query.state.data;
			if (order?.status === "PENDING" && order.expiresAt) return 30_000;
			return false;
		},
	});

	useErrorToast(q.isError ? q.error : null, "No pudimos cargar el pedido");

	const order = q.data;
	const expiresAt = order?.expiresAt;

	useEffect(() => {
		if (!expiresAt || order?.status !== "PENDING") return;
		const t = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(t);
	}, [expiresAt, order?.status]);

	const secondsLeft = useMemo(() => {
		if (!expiresAt) return null;
		const end = new Date(expiresAt).getTime();
		return Math.max(0, Math.floor((end - now) / 1000));
	}, [expiresAt, now]);

	const reservationExpired =
		order?.status === "PENDING" && secondsLeft !== null && secondsLeft <= 0;

	const event = order ? getOrderEvent(order) : null;

	const pay = useMutation({
		mutationFn: () => mockPayOrder(orderId, "SUCCESS"),
		onSuccess: async (paid) => {
			if (paid.status !== "PAID") {
				toast.error(
					paid.status === "EXPIRED"
						? "Tu reserva expiró. Vuelve al evento para reservar de nuevo."
						: "No se pudo completar el pago.",
				);
				await qc.invalidateQueries({ queryKey: ordersKeys.meDetail(orderId) });
				return;
			}
			await qc.invalidateQueries({ queryKey: ordersKeys.all });
			await qc.invalidateQueries({ queryKey: ticketsKeys.all });
			toast.success("Pago completado correctamente");
		},
		onError: (e) =>
			toast.error(getUserFacingErrorMessage(e, "Error al procesar el pago")),
	});

	const cancelMu = useMutation({
		mutationFn: () => cancelOrder(orderId),
		onSuccess: async () => {
			toast.message("Reserva cancelada");
			await qc.invalidateQueries({ queryKey: ordersKeys.all });
			if (event) {
				void navigate({
					to: "/events/$eventSlugOrId",
					params: { eventSlugOrId: event.slug },
				});
				return;
			}
			void navigate({ to: "/my-orders", search: myOrdersDefaultSearch });
		},
		onError: (e) =>
			toast.error(getUserFacingErrorMessage(e, "No se pudo cancelar")),
	});

	return (
		<PublicLayout>
			<div className="page-wrap max-w-2xl space-y-8 py-12">
				<Button variant="ghost" asChild>
					<Link to="/my-orders" search={myOrdersDefaultSearch}>
						← Pedidos
					</Link>
				</Button>

				{q.isPending ? <Skeleton className="h-56 rounded-xl" /> : null}
				{q.isError ? (
					<p className="text-muted-foreground">No pudimos cargar el pedido.</p>
				) : null}

				{order ? (
					<div className="space-y-6">
						<PageHeader
							eyebrow="Recibo digital"
							title={`Pedido ${formatOrderRef(order.id)}`}
							description={
								<StatusBadge
									label={labelFor(orderStatusLabel, order.status)}
									tone={orderStatusTone(order.status)}
								/>
							}
						/>

						{event ? (
							<p className="text-sm text-muted-foreground">
								Evento:{" "}
								<Link
									to="/events/$eventSlugOrId"
									params={{ eventSlugOrId: event.slug }}
									className="font-medium text-primary hover:underline"
								>
									{event.title}
								</Link>
							</p>
						) : null}

						<PosterSurface variant="receipt" padding="large">
							<div className="flex items-start justify-between gap-4">
								<div>
									<p className="text-sm text-muted-foreground">Total</p>
									<p className="display-title mt-1 text-4xl font-semibold">
										{new Intl.NumberFormat("es", {
											style: "currency",
											currency: order.currency,
										}).format(Number(order.totalAmount))}
									</p>
								</div>
								<ReceiptText className="size-7 text-primary" aria-hidden />
							</div>

							<ul className="mt-8 divide-y divide-dashed divide-border border-y border-dashed border-border">
								{order.lines.map((l) => (
									<li
										key={l.id}
										className="flex justify-between gap-4 py-4 text-sm"
									>
										<span>
											{l.ticketType.name} × {l.quantity}
										</span>
										<span className="text-muted-foreground">
											{new Intl.NumberFormat("es", {
												style: "currency",
												currency: order.currency,
											}).format(Number(l.unitPrice) * l.quantity)}
										</span>
									</li>
								))}
							</ul>

							<dl className="mt-6 space-y-2 text-sm text-muted-foreground">
								<div className="flex justify-between gap-4">
									<dt>Creado</dt>
									<dd>{formatWhen(order.createdAt)}</dd>
								</div>
								{order.expiresAt ? (
									<div className="flex justify-between gap-4">
										<dt>Reserva válida hasta</dt>
										<dd>{formatWhen(order.expiresAt)}</dd>
									</div>
								) : null}
								{order.paidAt ? (
									<div className="flex justify-between gap-4">
										<dt>Pagado</dt>
										<dd>{formatWhen(order.paidAt)}</dd>
									</div>
								) : null}
							</dl>

							{order.status === "PENDING" &&
							secondsLeft !== null &&
							!reservationExpired ? (
								<p className="mt-6 flex items-center gap-2 text-sm font-medium text-warning">
									<Clock className="size-4 shrink-0" aria-hidden />
									{Math.floor(secondsLeft / 60)}:
									{String(secondsLeft % 60).padStart(2, "0")} para completar el
									pago
								</p>
							) : null}

							{order.status === "PENDING" && reservationExpired ? (
								<StatusPanel
									tone="warning"
									title="Tu reserva expiró"
									description="El tiempo para pagar terminó. Puedes volver al evento y reservar de nuevo."
									className="mt-6"
									action={
										event ? (
											<Button variant="outline" size="sm" asChild>
												<Link
													to="/events/$eventSlugOrId"
													params={{ eventSlugOrId: event.slug }}
												>
													Volver al evento
												</Link>
											</Button>
										) : (
											<Button variant="outline" size="sm" asChild>
												<Link to="/events" search={eventsListDefaultSearch}>
													Ver eventos
												</Link>
											</Button>
										)
									}
								/>
							) : null}

							{order.status === "PENDING" && !reservationExpired ? (
								<div className="mt-6 flex flex-col gap-3 sm:flex-row">
									<Button
										className="gap-2"
										onClick={() => pay.mutate()}
										disabled={pay.isPending || cancelMu.isPending}
									>
										<CreditCard className="size-4" aria-hidden />
										Completar pago
									</Button>
									<Button
										variant="outline"
										onClick={() => cancelMu.mutate()}
										disabled={pay.isPending || cancelMu.isPending}
									>
										Cancelar reserva
									</Button>
								</div>
							) : null}

							{order.status === "PAID" ? (
								<div className="mt-6">
									<Button asChild>
										<Link to="/my-tickets" search={myTicketsDefaultSearch}>
											Ver mis pases
										</Link>
									</Button>
								</div>
							) : null}
						</PosterSurface>
					</div>
				) : null}
			</div>
		</PublicLayout>
	);
}
