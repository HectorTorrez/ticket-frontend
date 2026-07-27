import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ReceiptText } from "lucide-react";

import { PublicLayout } from "#/components/layouts/public-layout";
import { PageHeader } from "#/components/page-header";
import { PosterSurface } from "#/components/poster-surface";
import {
	orderStatusTone,
	StatusIndicator,
} from "#/components/status-indicator";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { useErrorToast } from "#/hooks/use-error-toast";
import { fetchMyOrder } from "#/lib/api/ticket-api";
import { requireCustomer } from "#/lib/auth/guards";
import { formatOrderRef, labelFor, orderStatusLabel } from "#/lib/labels";
import { ordersKeys } from "#/lib/query-keys";

export const Route = createFileRoute("/my-orders/$orderId")({
	ssr: false,
	beforeLoad: () => {
		requireCustomer();
	},
	component: OrderDetailPage,
});

function OrderDetailPage() {
	const { orderId } = Route.useParams();

	const q = useQuery({
		queryKey: ordersKeys.meDetail(orderId),
		queryFn: () => fetchMyOrder(orderId),
	});

	useErrorToast(q.isError ? q.error : null, "No pudimos cargar el pedido");

	return (
		<PublicLayout>
			<div className="page-wrap max-w-2xl space-y-8 py-12">
				<Button variant="ghost" asChild>
					<Link to="/my-orders">← Pedidos</Link>
				</Button>

				{q.isPending ? <Skeleton className="h-56 rounded-xl" /> : null}
				{q.isError ? (
					<p className="text-muted-foreground">No pudimos cargar el pedido.</p>
				) : null}

				{q.data ? (
					<div className="space-y-6">
						<PageHeader
							eyebrow="Recibo digital"
							title={`Pedido ${formatOrderRef(q.data.id)}`}
							description={
								<StatusIndicator
									label={labelFor(orderStatusLabel, q.data.status)}
									tone={orderStatusTone(q.data.status)}
								/>
							}
						/>
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
							{q.data.paidAt ? (
								<p className="mt-6 text-sm text-muted-foreground">
									Pagado el{" "}
									{new Intl.DateTimeFormat("es", {
										dateStyle: "medium",
										timeStyle: "short",
									}).format(new Date(q.data.paidAt))}
								</p>
							) : null}
							{q.data.status === "PAID" ? (
								<div className="mt-6">
									<Button asChild>
										<Link to="/my-tickets">Ver mis pases</Link>
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
