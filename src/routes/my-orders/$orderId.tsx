import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { PublicLayout } from "#/components/layouts/public-layout";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { useErrorToast } from "#/hooks/use-error-toast";
import { fetchMyOrder } from "#/lib/api/ticket-api";
import { requireCustomer } from "#/lib/auth/guards";
import { labelFor, formatOrderRef, orderStatusLabel } from "#/lib/labels";
import { ordersKeys } from "#/lib/query-keys";

export const Route = createFileRoute("/my-orders/$orderId")({
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
					<p className="text-muted-foreground">
						No pudimos cargar el pedido.
					</p>
				) : null}

				{q.data ? (
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between gap-2">
								<CardTitle>Recibo {formatOrderRef(q.data.id)}</CardTitle>
								<Badge>{labelFor(orderStatusLabel, q.data.status)}</Badge>
							</div>
						</CardHeader>
						<CardContent className="space-y-6">
							<p className="text-3xl font-semibold">
								{new Intl.NumberFormat("es", {
									style: "currency",
									currency: q.data.currency,
								}).format(Number(q.data.totalAmount))}
							</p>
							<ul className="divide-y rounded-lg border">
								{q.data.lines.map((l) => (
									<li
										key={l.id}
										className="flex justify-between gap-4 px-4 py-3 text-sm"
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
								<p className="text-sm text-muted-foreground">
									Pagado el{" "}
									{new Intl.DateTimeFormat("es", {
										dateStyle: "medium",
										timeStyle: "short",
									}).format(new Date(q.data.paidAt))}
								</p>
							) : null}
							{q.data.status === "PAID" ? (
								<Button asChild>
									<Link to="/my-tickets">Ver mis entradas</Link>
								</Button>
							) : null}
						</CardContent>
					</Card>
				) : null}
			</div>
		</PublicLayout>
	);
}
