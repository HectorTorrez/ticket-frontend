import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ReceiptText } from "lucide-react";
import { z } from "zod";

import { EmptyState } from "#/components/empty-state";
import { PublicLayout } from "#/components/layouts/public-layout";
import { PageHeader } from "#/components/page-header";
import { orderStatusTone, StatusBadge } from "#/components/status-indicator";
import { TicketStub } from "#/components/ticket-stub";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { useErrorToast } from "#/hooks/use-error-toast";
import { fetchMyOrders } from "#/lib/api/ticket-api";
import { requireCustomer } from "#/lib/auth/guards";
import { formatOrderRef, labelFor, orderStatusLabel } from "#/lib/labels";
import { ordersKeys } from "#/lib/query-keys";

const searchSchema = z.object({
	page: z.coerce.number().catch(1),
	limit: z.coerce.number().catch(20),
	status: z.string().optional(),
});

export const Route = createFileRoute("/my-orders/")({
	ssr: false,
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
				<PageHeader
					eyebrow="Tu cartera"
					title="Pedidos"
					description="Reservas, pagos y recibos de tus entradas."
					action={
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
								aria-label="Filtrar por estado"
								className="h-12 cursor-pointer rounded-md border border-input bg-background px-3 text-sm"
							>
								<option value="">Todos los estados</option>
								<option value="PENDING">{orderStatusLabel.PENDING}</option>
								<option value="PAID">{orderStatusLabel.PAID}</option>
								<option value="FAILED">{orderStatusLabel.FAILED}</option>
								<option value="EXPIRED">{orderStatusLabel.EXPIRED}</option>
								<option value="CANCELLED">{orderStatusLabel.CANCELLED}</option>
							</select>
							<Button type="submit" variant="outline">
								Filtrar
							</Button>
						</form>
					}
				/>

				{q.isPending ? <Skeleton className="h-48 rounded-xl" /> : null}
				{q.isError ? (
					<p className="text-muted-foreground">
						No pudimos cargar tus pedidos.
					</p>
				) : null}

				{q.data && q.data.items.length === 0 ? (
					<EmptyState
						icon={ReceiptText}
						title="Aún no tienes pedidos"
						description="Tus reservas y pagos aparecerán aquí después de elegir un evento."
						action={
							<Button asChild>
								<Link to="/events">Explorar eventos</Link>
							</Button>
						}
					/>
				) : null}

				{q.data && q.data.items.length > 0 ? (
					<ul className="space-y-4">
						{q.data.items.map((o) => (
							<li key={o.id}>
								<TicketStub
									rail={
										<div>
											<ReceiptText className="mx-auto size-5" aria-hidden />
											<span className="font-ticket-code mt-2 block text-[0.65rem]">
												{formatOrderRef(o.id)}
											</span>
										</div>
									}
									aside={
										<Button variant="outline" asChild>
											<Link to="/my-orders/$orderId" params={{ orderId: o.id }}>
												Ver recibo
											</Link>
										</Button>
									}
								>
									<div className="space-y-3 text-sm">
										<div className="flex flex-wrap items-start justify-between gap-3">
											<div>
												<p className="text-sm text-muted-foreground">
													Pedido {formatOrderRef(o.id)}
												</p>
												<p className="display-title mt-1 text-3xl font-semibold">
													{new Intl.NumberFormat("es", {
														style: "currency",
														currency: o.currency,
													}).format(Number(o.totalAmount))}
												</p>
											</div>
											<StatusBadge
												label={labelFor(orderStatusLabel, o.status)}
												tone={orderStatusTone(o.status)}
											/>
										</div>
										<ul className="space-1 text-muted-foreground">
											{o.lines.map((l) => (
												<li key={l.id}>
													{l.ticketType.name} × {l.quantity}
												</li>
											))}
										</ul>
									</div>
								</TicketStub>
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
