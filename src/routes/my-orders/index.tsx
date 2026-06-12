import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";

import { PublicLayout } from "#/components/layouts/public-layout";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { useErrorToast } from "#/hooks/use-error-toast";
import { fetchMyOrders } from "#/lib/api/ticket-api";
import { requireCustomer } from "#/lib/auth/guards";
import { labelFor, formatOrderRef, orderStatusLabel } from "#/lib/labels";
import { ordersKeys } from "#/lib/query-keys";

const searchSchema = z.object({
	page: z.coerce.number().catch(1),
	limit: z.coerce.number().catch(20),
	status: z.string().optional(),
});

export const Route = createFileRoute("/my-orders/")({
	validateSearch: (s) => searchSchema.parse(s),
	beforeLoad: () => {
		requireCustomer();
	},
	component: MyOrdersPage,
});

function MyOrdersPage() {
	const { page, limit, status } = Route.useSearch();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();

	const q = useQuery({
		queryKey: ordersKeys.meList({ page, limit, status }),
		queryFn: () => fetchMyOrders({ page, limit, status }),
	});

	useErrorToast(q.isError ? q.error : null, "No pudimos cargar tus pedidos");

	return (
		<PublicLayout>
			<div className="page-wrap space-y-8 py-12">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h1 className="display-title text-3xl font-semibold">
							Historial de pedidos
						</h1>
						<p className="mt-1 text-muted-foreground">
							Reservas y compras en tu cuenta.
						</p>
					</div>
					<form
						className="flex flex-wrap items-center gap-2"
						onSubmit={(e) => {
							e.preventDefault();
							const fd = new FormData(e.currentTarget);
							const st = String(fd.get("status") ?? "").trim();
							navigate({
								search: {
									page: 1,
									limit,
									status: st || undefined,
								},
							});
						}}
					>
						<select
							name="status"
							defaultValue={status ?? ""}
							className="h-9 rounded-md border border-input bg-background px-2 text-sm"
						>
							<option value="">Todos los estados</option>
							<option value="PENDING">
								{orderStatusLabel.PENDING}
							</option>
							<option value="PAID">{orderStatusLabel.PAID}</option>
							<option value="FAILED">{orderStatusLabel.FAILED}</option>
							<option value="EXPIRED">{orderStatusLabel.EXPIRED}</option>
							<option value="CANCELLED">
								{orderStatusLabel.CANCELLED}
							</option>
						</select>
						<Button type="submit" size="sm" variant="secondary">
							Filtrar
						</Button>
					</form>
				</div>

				{q.isPending ? <Skeleton className="h-48 rounded-xl" /> : null}
				{q.isError ? (
					<p className="text-muted-foreground">
						No pudimos cargar tus pedidos.
					</p>
				) : null}

				{q.data && q.data.items.length === 0 ? (
					<Card>
						<CardContent className="py-12 text-center text-muted-foreground">
							Aún no tienes pedidos.
						</CardContent>
					</Card>
				) : null}

				{q.data && q.data.items.length > 0 ? (
					<ul className="space-y-4">
						{q.data.items.map((o) => (
							<li key={o.id}>
								<Card>
									<CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
										<CardTitle className="text-base">
											Pedido {formatOrderRef(o.id)}
										</CardTitle>
										<Badge variant="outline">
											{labelFor(orderStatusLabel, o.status)}
										</Badge>
									</CardHeader>
									<CardContent className="space-y-3 text-sm">
										<p className="text-lg font-semibold">
											{new Intl.NumberFormat("es", {
												style: "currency",
												currency: o.currency,
											}).format(Number(o.totalAmount))}
										</p>
										<ul className="space-1 text-muted-foreground">
											{o.lines.map((l) => (
												<li key={l.id}>
													{l.ticketType.name} × {l.quantity}
												</li>
											))}
										</ul>
										<Button variant="link" className="h-auto p-0" asChild>
											<Link to="/my-orders/$orderId" params={{ orderId: o.id }}>
												Ver recibo
											</Link>
										</Button>
									</CardContent>
								</Card>
							</li>
						))}
					</ul>
				) : null}

				{q.data && q.data.total > limit ? (
					<div className="flex justify-between gap-4">
						<Button
							type="button"
							variant="outline"
							disabled={page <= 1}
							onClick={() =>
								navigate({ search: { ...search, page: page - 1 } })
							}
						>
							Anterior
						</Button>
						<Button
							type="button"
							variant="outline"
							disabled={page * limit >= q.data.total}
							onClick={() =>
								navigate({ search: { ...search, page: page + 1 } })
							}
						>
							Siguiente
						</Button>
					</div>
				) : null}
			</div>
		</PublicLayout>
	);
}
