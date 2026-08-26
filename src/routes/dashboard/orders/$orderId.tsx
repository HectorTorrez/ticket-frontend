import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ReceiptText } from "lucide-react";

import { PosterSurface } from "#/components/poster-surface";
import { orderStatusTone, StatusBadge } from "#/components/status-indicator";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { useErrorToast } from "#/hooks/use-error-toast";
import { fetchAdminOrder } from "#/lib/api/ticket-api";
import { formatOrderRef, labelFor, orderStatusLabel } from "#/lib/labels";
import { adminOrdersKeys } from "#/lib/query-keys";

export const Route = createFileRoute("/dashboard/orders/$orderId")({
	component: AdminOrderDetailPage,
});

function formatWhen(iso: string) {
	return new Intl.DateTimeFormat("es", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(iso));
}

function AdminOrderDetailPage() {
	const { orderId } = Route.useParams();

	const q = useQuery({
		queryKey: adminOrdersKeys.detail(orderId),
		queryFn: () => fetchAdminOrder(orderId),
	});

	useErrorToast(q.isError ? q.error : null, "No pudimos cargar el pedido");

	return (
		<div className="mx-auto max-w-2xl space-y-8">
			<Button variant="ghost" asChild>
				<Link to="/dashboard/orders">← Pedidos</Link>
			</Button>

			{q.isPending ? <Skeleton className="h-56 rounded-xl" /> : null}
			{q.isError ? (
				<p className="text-muted-foreground">No pudimos cargar el pedido.</p>
			) : null}

			{q.data ? (
				<div className="space-y-6">
					<div>
						<h1 className="display-title text-2xl font-semibold">
							Pedido {formatOrderRef(q.data.id)}
						</h1>
						<div className="mt-2">
							<StatusBadge
								label={labelFor(orderStatusLabel, q.data.status)}
								tone={orderStatusTone(q.data.status)}
							/>
						</div>
					</div>

					<PosterSurface variant="receipt" padding="large">
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-sm text-muted-foreground">Total</p>
								<p className="display-title mt-1 text-4xl font-semibold">
									{new Intl.NumberFormat("es", {
										style: "currency",
										currency: q.data.currency,
									}).format(Number(q.data.totalAmount))}
								</p>
							</div>
							<ReceiptText className="size-7 text-primary" aria-hidden />
						</div>

						<dl className="mt-6 space-y-3 text-sm">
							<div className="flex justify-between gap-4">
								<dt className="text-muted-foreground">Cliente</dt>
								<dd className="text-right font-medium">{q.data.user.email}</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-muted-foreground">Creado</dt>
								<dd>{formatWhen(q.data.createdAt)}</dd>
							</div>
							{q.data.expiresAt ? (
								<div className="flex justify-between gap-4">
									<dt className="text-muted-foreground">Expira</dt>
									<dd>{formatWhen(q.data.expiresAt)}</dd>
								</div>
							) : null}
							{q.data.paidAt ? (
								<div className="flex justify-between gap-4">
									<dt className="text-muted-foreground">Pagado</dt>
									<dd>{formatWhen(q.data.paidAt)}</dd>
								</div>
							) : null}
							{q.data.paymentReference ? (
								<div className="flex justify-between gap-4">
									<dt className="text-muted-foreground">Referencia</dt>
									<dd className="font-mono text-xs">
										{q.data.paymentReference}
									</dd>
								</div>
							) : null}
						</dl>

						<ul className="mt-8 divide-y divide-dashed divide-border border-y border-dashed border-border">
							{q.data.lines.map((l) => (
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
											currency: q.data.currency,
										}).format(Number(l.unitPrice) * l.quantity)}
									</span>
								</li>
							))}
						</ul>
					</PosterSurface>
				</div>
			) : null}
		</div>
	);
}
