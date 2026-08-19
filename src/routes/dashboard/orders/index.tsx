import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { SortableTableHead } from "#/components/admin/sortable-table-head";
import { TableExportMenu } from "#/components/admin/table-export-menu";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { useErrorToast } from "#/hooks/use-error-toast";
import { adminOrdersSortDefaults } from "#/lib/admin/default-search";
import { fetchAllPages } from "#/lib/admin/fetch-all-pages";
import { cycleSort, resolveTableSort } from "#/lib/admin/sort";
import { fetchAdminOrders } from "#/lib/api/ticket-api";
import type { ExportColumn } from "#/lib/export/table-export";
import { formatOrderRef, labelFor, orderStatusLabel } from "#/lib/labels";
import { adminOrdersKeys } from "#/lib/query-keys";
import { cn } from "#/lib/utils.ts";

const searchSchema = z.object({
	page: z.coerce.number().catch(1),
	limit: z.coerce.number().catch(20),
	status: z.string().optional(),
	userId: z.string().optional(),
	sortBy: z
		.enum(["id", "createdAt", "status", "totalAmount", "userEmail"])
		.catch(adminOrdersSortDefaults.sortBy),
	sortDirection: z.enum(["asc", "desc", "default"]).catch("default"),
});

type AdminOrderRow = {
	id: string;
	status: keyof typeof orderStatusLabel;
	currency: string;
	totalAmount: string;
	user: { email: string };
};

const orderExportColumns: ExportColumn<AdminOrderRow>[] = [
	{
		header: "Pedido",
		value: (row) => formatOrderRef(row.id),
	},
	{
		header: "Cliente",
		value: (row) => row.user.email,
	},
	{
		header: "Estado",
		value: (row) => labelFor(orderStatusLabel, row.status),
	},
	{
		header: "Total",
		value: (row) =>
			new Intl.NumberFormat("es", {
				style: "currency",
				currency: row.currency,
			}).format(Number(row.totalAmount)),
	},
];

export const Route = createFileRoute("/dashboard/orders/")({
	validateSearch: (s) => searchSchema.parse(s),
	component: AdminOrdersPage,
});

function AdminOrdersPage() {
	const search = Route.useSearch();
	const { page, limit, status, userId, sortBy, sortDirection } = search;
	const navigate = Route.useNavigate();
	const effectiveSort = resolveTableSort(
		sortBy,
		sortDirection,
		adminOrdersSortDefaults,
	);

	const q = useQuery({
		queryKey: adminOrdersKeys.list({
			page,
			limit,
			status,
			userId,
			sortBy,
			sortDirection,
		}),
		queryFn: () =>
			fetchAdminOrders({
				page,
				limit,
				status,
				userId,
				sortBy: effectiveSort.sortBy,
				sortOrder: effectiveSort.sortOrder,
			}),
		placeholderData: keepPreviousData,
	});

	useErrorToast(q.isError ? q.error : null, "No pudimos cargar los pedidos");

	function handleSort(
		column: "id" | "createdAt" | "status" | "totalAmount" | "userEmail",
	) {
		const next = cycleSort(
			{ sortBy, sortDirection },
			column,
			adminOrdersSortDefaults,
		);
		navigate({
			search: { ...search, ...next, page: 1 },
		});
	}

	async function fetchAllOrders(): Promise<AdminOrderRow[]> {
		return fetchAllPages((p, l) =>
			fetchAdminOrders({
				page: p,
				limit: l,
				status,
				userId,
				sortBy: effectiveSort.sortBy,
				sortOrder: effectiveSort.sortOrder,
			}),
		);
	}

	return (
		<div className="space-y-8">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="display-title text-2xl font-semibold">
						Todos los pedidos
					</h1>
					<p className="text-muted-foreground">
						Todas las reservas y compras de clientes
					</p>
				</div>
				{q.data ? (
					<TableExportMenu
						title="Todos los pedidos"
						filenameBase="pedidos"
						columns={orderExportColumns}
						pageRows={q.data.items}
						pageCount={q.data.items.length}
						totalCount={q.data.total}
						fetchAllRows={fetchAllOrders}
						disabled={q.isFetching}
					/>
				) : null}
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
							sortBy,
							sortDirection,
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
						className="h-9 cursor-pointer rounded-md border border-input bg-background px-2 text-sm"
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
						Correo o ID de cliente
					</label>
					<Input
						id="uid"
						name="userId"
						defaultValue={userId ?? ""}
						placeholder="cliente@ejemplo.com"
						className="h-9 w-64 text-sm"
					/>
				</div>
				<Button type="submit" size="sm" variant="outline">
					Aplicar
				</Button>
			</form>

			{q.isLoading ? <Skeleton className="h-72 rounded-xl" /> : null}
			{q.isError ? (
				<p className="text-muted-foreground">No pudimos cargar los pedidos.</p>
			) : null}

			{q.data && q.data.items.length > 0 ? (
				<>
					<div
						className={cn(
							"overflow-x-auto rounded-xl border transition-opacity",
							q.isFetching && "opacity-60",
						)}
					>
						<Table>
							<TableHeader>
								<TableRow>
									<SortableTableHead
										label="Pedido"
										column="id"
										sortBy={sortBy}
										sortDirection={sortDirection}
										onSort={handleSort}
									/>
									<SortableTableHead
										label="Cliente"
										column="userEmail"
										sortBy={sortBy}
										sortDirection={sortDirection}
										onSort={handleSort}
									/>
									<SortableTableHead
										label="Estado"
										column="status"
										sortBy={sortBy}
										sortDirection={sortDirection}
										onSort={handleSort}
									/>
									<SortableTableHead
										label="Total"
										column="totalAmount"
										sortBy={sortBy}
										sortDirection={sortDirection}
										onSort={handleSort}
										className="text-right"
									/>
								</TableRow>
							</TableHeader>
							<TableBody>
								{q.data.items.map((o) => (
									<TableRow key={o.id}>
										<TableCell className="text-sm font-medium">
											{formatOrderRef(o.id)}
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
					<div className="flex items-center justify-between gap-4">
						<p className="text-sm text-muted-foreground">
							Página {page} · {q.data.total} pedidos en total
						</p>
						<div className="flex gap-2">
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
