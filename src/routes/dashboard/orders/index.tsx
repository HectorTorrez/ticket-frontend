import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { fetchAdminOrders } from "#/lib/api/ticket-api";
import { labelFor, orderStatusLabel } from "#/lib/labels";
import { adminOrdersKeys } from "#/lib/query-keys";

const searchSchema = z.object({
	page: z.coerce.number().catch(1),
	limit: z.coerce.number().catch(20),
	status: z.string().optional(),
	userId: z.string().optional(),
});

export const Route = createFileRoute("/dashboard/orders/")({
	validateSearch: (s) => searchSchema.parse(s),
	component: AdminOrdersPage,
});

function AdminOrdersPage() {
	const search = Route.useSearch();
	const { page, limit, status, userId } = search;
	const navigate = Route.useNavigate();

	const q = useQuery({
		queryKey: adminOrdersKeys.list({ page, limit, status, userId }),
		queryFn: () => fetchAdminOrders({ page, limit, status, userId }),
	});

	return (
		<div className="space-y-8">
			<div>
				<h1 className="display-title text-2xl font-semibold">Todos los pedidos</h1>
				<p className="text-muted-foreground">
					Todas las reservas y compras de clientes
				</p>
			</div>

			<form
				className="flex flex-wrap items-end gap-3"
				onSubmit={(e) => {
					e.preventDefault();
					const fd = new FormData(e.currentTarget);
					navigate({
						search: {
							page: 1,
							limit,
							status: String(fd.get("status") || "") || undefined,
							userId: String(fd.get("userId") || "") || undefined,
						},
					});
				}}
			>
				<div className="space-y-1">
					<label className="text-xs text-muted-foreground" htmlFor="st">
						Estado
					</label>
					<select
						id="st"
						name="status"
						defaultValue={status ?? ""}
						className="h-9 rounded-md border border-input bg-background px-2 text-sm"
					>
						<option value="">Todos</option>
						<option value="PENDING">{orderStatusLabel.PENDING}</option>
						<option value="PAID">{orderStatusLabel.PAID}</option>
						<option value="FAILED">{orderStatusLabel.FAILED}</option>
						<option value="EXPIRED">{orderStatusLabel.EXPIRED}</option>
						<option value="CANCELLED">{orderStatusLabel.CANCELLED}</option>
					</select>
				</div>
				<div className="space-y-1">
					<label className="text-xs text-muted-foreground" htmlFor="uid">
						ID de usuario
					</label>
					<Input
						id="uid"
						name="userId"
						defaultValue={userId ?? ""}
						placeholder="UUID"
						className="h-9 w-64 font-mono text-xs"
					/>
				</div>
				<Button type="submit" size="sm" variant="secondary">
					Aplicar
				</Button>
			</form>

			{q.isPending ? <Skeleton className="h-72 rounded-xl" /> : null}
			{q.isError ? (
				<p className="text-destructive">{(q.error as Error).message}</p>
			) : null}

			{q.data && q.data.items.length > 0 ? (
				<>
					<div className="overflow-x-auto rounded-xl border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Pedido</TableHead>
									<TableHead>Cliente</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead className="text-right">Total</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{q.data.items.map((o) => (
									<TableRow key={o.id}>
										<TableCell className="font-mono text-xs">
											{o.id.slice(0, 8)}…
										</TableCell>
										<TableCell className="text-sm">{o.user.email}</TableCell>
										<TableCell>
											<Badge variant="outline">
												{labelFor(orderStatusLabel, o.status)}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											{new Intl.NumberFormat("es", {
												style: "currency",
												currency: o.currency,
											}).format(Number(o.totalAmount))}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
					<div className="flex justify-between">
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
				</>
			) : null}

			{q.data && q.data.items.length === 0 ? (
				<p className="text-muted-foreground">
					Ningún pedido coincide con los filtros.
				</p>
			) : null}
		</div>
	);
}
