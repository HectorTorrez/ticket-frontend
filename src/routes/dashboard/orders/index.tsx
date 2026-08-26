import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";

import {
	MobileRecordCard,
	MobileRecordList,
} from "#/components/admin/mobile-record-card";
import { MobileSortSelect } from "#/components/admin/mobile-sort-select";
import { SortableTableHead } from "#/components/admin/sortable-table-head";
import { TableExportMenu } from "#/components/admin/table-export-menu";
import { ListPagination } from "#/components/list-pagination";
import { orderStatusTone, StatusBadge } from "#/components/status-indicator";
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
	q: z.string().optional(),
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
	const { page, limit, status, q: customerQ, sortBy, sortDirection } = search;
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
			customerQ,
			sortBy,
			sortDirection,
		}),
		queryFn: () =>
			fetchAdminOrders({
				page,
				limit,
				status,
				q: customerQ,
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
				q: customerQ,
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
				className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
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
							q: String(fd.get("q") || "") || undefined,
						},
					});
				}}
			>
				<div className="w-full space-y-1 sm:w-auto">
					<label className="text-xs text-muted-foreground" htmlFor="st">
						Estado
					</label>
					<select
						id="st"
						name="status"
						defaultValue={status ?? ""}
						className="h-12 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm sm:h-12 sm:w-auto"
					>
						<option value="">Todos</option>
						<option value="PENDING">{orderStatusLabel.PENDING}</option>
						<option value="PAID">{orderStatusLabel.PAID}</option>
						<option value="FAILED">{orderStatusLabel.FAILED}</option>
						<option value="EXPIRED">{orderStatusLabel.EXPIRED}</option>
						<option value="CANCELLED">{orderStatusLabel.CANCELLED}</option>
					</select>
				</div>
				<div className="w-full space-y-1 sm:w-auto">
					<label className="text-xs text-muted-foreground" htmlFor="cust-q">
						Correo del cliente
					</label>
					<Input
						id="cust-q"
						name="q"
						defaultValue={customerQ ?? ""}
						placeholder="cliente@ejemplo.com"
						className="h-12 w-full text-sm sm:w-64"
					/>
				</div>
				<Button type="submit" variant="outline" className="w-full sm:w-auto">
					Aplicar
				</Button>
			</form>

			{q.isLoading ? <Skeleton className="h-72 rounded-xl" /> : null}
			{q.isError ? (
				<p className="text-muted-foreground">No pudimos cargar los pedidos.</p>
			) : null}

			{q.data && q.data.items.length > 0 ? (
				<>
					<MobileSortSelect
						id="orders-sort"
						sortBy={sortBy}
						sortDirection={sortDirection}
						onChange={(next) =>
							navigate({ search: { ...search, ...next, page: 1 } })
						}
						options={[
							{
								sortBy: "createdAt",
								sortDirection: "default",
								label: "Predeterminado",
							},
							{
								sortBy: "createdAt",
								sortDirection: "desc",
								label: "Más recientes",
							},
							{
								sortBy: "createdAt",
								sortDirection: "asc",
								label: "Más antiguos",
							},
							{
								sortBy: "userEmail",
								sortDirection: "asc",
								label: "Cliente A–Z",
							},
							{
								sortBy: "userEmail",
								sortDirection: "desc",
								label: "Cliente Z–A",
							},
							{
								sortBy: "totalAmount",
								sortDirection: "desc",
								label: "Total · mayor a menor",
							},
							{
								sortBy: "totalAmount",
								sortDirection: "asc",
								label: "Total · menor a mayor",
							},
						]}
					/>
					<MobileRecordList className={cn(q.isFetching && "opacity-60")}>
						{q.data.items.map((o) => (
							<MobileRecordCard key={o.id}>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<Link
											to="/dashboard/orders/$orderId"
											params={{ orderId: o.id }}
											className="font-medium text-primary hover:underline"
										>
											{formatOrderRef(o.id)}
										</Link>
										<p className="mt-1 break-all text-sm text-muted-foreground">
											{o.user.email}
										</p>
									</div>
									<p className="display-title shrink-0 text-lg font-semibold tabular-nums">
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
							</MobileRecordCard>
						))}
					</MobileRecordList>
					<div
						className={cn(
							"table-fetching hidden overflow-x-auto rounded-xl border md:block",
							q.isFetching && "opacity-60",
						)}
					>
						<Table className="table-fixed">
							<TableHeader>
								<TableRow>
									<SortableTableHead
										label="Pedido"
										column="id"
										sortBy={sortBy}
										sortDirection={sortDirection}
										onSort={handleSort}
										className="w-30"
									/>
									<SortableTableHead
										label="Cliente"
										column="userEmail"
										sortBy={sortBy}
										sortDirection={sortDirection}
										onSort={handleSort}
										className="w-[42%]"
									/>
									<SortableTableHead
										label="Estado"
										column="status"
										sortBy={sortBy}
										sortDirection={sortDirection}
										onSort={handleSort}
										className="w-35"
									/>
									<SortableTableHead
										label="Total"
										column="totalAmount"
										sortBy={sortBy}
										sortDirection={sortDirection}
										onSort={handleSort}
										className="w-30 text-right"
									/>
								</TableRow>
							</TableHeader>
							<TableBody>
								{q.data.items.map((o) => (
									<TableRow key={o.id}>
										<TableCell className="text-sm font-medium">
											<Link
												to="/dashboard/orders/$orderId"
												params={{ orderId: o.id }}
												className="text-primary hover:underline"
											>
												{formatOrderRef(o.id)}
											</Link>
										</TableCell>
										<TableCell className="max-w-0 truncate text-sm">
											{o.user.email}
										</TableCell>
										<TableCell>
											<StatusBadge
												label={labelFor(orderStatusLabel, o.status)}
												tone={orderStatusTone(o.status)}
											/>
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
					<ListPagination
						page={page}
						total={q.data.total}
						limit={limit}
						label={`Página ${page} · ${q.data.total} pedidos en total`}
						onPrev={() => navigate({ search: { ...search, page: page - 1 } })}
						onNext={() => navigate({ search: { ...search, page: page + 1 } })}
					/>
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
