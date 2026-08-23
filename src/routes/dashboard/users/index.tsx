import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";

import {
	MobileRecordCard,
	MobileRecordList,
} from "#/components/admin/mobile-record-card";
import { MobileSortSelect } from "#/components/admin/mobile-sort-select";
import { SortableTableHead } from "#/components/admin/sortable-table-head";
import { TableExportMenu } from "#/components/admin/table-export-menu";
import { ListPagination } from "#/components/list-pagination";
import { StatusBadge, userStatusTone } from "#/components/status-indicator";
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
import { useErrorToast } from "#/hooks/use-error-toast";
import { adminUsersSortDefaults } from "#/lib/admin/default-search";
import { fetchAllPages } from "#/lib/admin/fetch-all-pages";
import { cycleSort, resolveTableSort } from "#/lib/admin/sort";
import type { AdminResetPasswordResponse, AdminUser } from "#/lib/api/schemas";
import { fetchAdminUsers } from "#/lib/api/ticket-api";
import { getSession } from "#/lib/auth/session";
import type { ExportColumn } from "#/lib/export/table-export";
import { labelFor, userRoleLabel, userStatusLabel } from "#/lib/labels";
import { adminUsersKeys } from "#/lib/query-keys";
import { cn } from "#/lib/utils.ts";

import { CreateAdminDialog } from "./-components/create-admin-dialog";
import {
	TemporaryPasswordDialog,
	UserActions,
} from "./-components/user-actions";

const searchSchema = z.object({
	page: z.coerce.number().catch(1),
	limit: z.coerce.number().catch(20),
	q: z.string().optional(),
	role: z.enum(["ADMIN", "CUSTOMER"]).optional(),
	status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]).optional(),
	sortBy: z
		.enum(["email", "role", "status", "createdAt", "orderCount"])
		.catch(adminUsersSortDefaults.sortBy),
	sortDirection: z.enum(["asc", "desc", "default"]).catch("default"),
});

const userExportColumns: ExportColumn<AdminUser>[] = [
	{ header: "Correo", value: (row) => row.email },
	{ header: "Rol", value: (row) => labelFor(userRoleLabel, row.role) },
	{ header: "Estado", value: (row) => labelFor(userStatusLabel, row.status) },
	{ header: "Pedidos", value: (row) => String(row.orderCount) },
	{
		header: "Alta",
		value: (row) =>
			new Intl.DateTimeFormat("es", { dateStyle: "short" }).format(
				new Date(row.createdAt),
			),
	},
];

export const Route = createFileRoute("/dashboard/users/")({
	validateSearch: (s) => searchSchema.parse(s),
	component: AdminUsersPage,
});

function AdminUsersPage() {
	const search = Route.useSearch();
	const { page, limit, q, role, status, sortBy, sortDirection } = search;
	const navigate = Route.useNavigate();
	const [createOpen, setCreateOpen] = useState(false);
	const [passwordResult, setPasswordResult] =
		useState<AdminResetPasswordResponse | null>(null);
	const [passwordCreated, setPasswordCreated] = useState(false);
	const currentUserId =
		typeof window !== "undefined" ? getSession()?.user.id : undefined;
	const effectiveSort = resolveTableSort(
		sortBy,
		sortDirection,
		adminUsersSortDefaults,
	);

	const list = useQuery({
		queryKey: adminUsersKeys.list({
			page,
			limit,
			q,
			role,
			status,
			sortBy,
			sortDirection,
		}),
		queryFn: () =>
			fetchAdminUsers({
				page,
				limit,
				q,
				role,
				status,
				sortBy: effectiveSort.sortBy,
				sortOrder: effectiveSort.sortOrder,
			}),
		placeholderData: keepPreviousData,
	});

	useErrorToast(
		list.isError ? list.error : null,
		"No pudimos cargar los usuarios",
	);

	function handleSort(
		column: "email" | "role" | "status" | "createdAt" | "orderCount",
	) {
		const next = cycleSort(
			{ sortBy, sortDirection },
			column,
			adminUsersSortDefaults,
		);
		navigate({
			search: { ...search, ...next, page: 1 },
		});
	}

	async function fetchAllUsers(): Promise<AdminUser[]> {
		return fetchAllPages((p, l) =>
			fetchAdminUsers({
				page: p,
				limit: l,
				q,
				role,
				status,
				sortBy: effectiveSort.sortBy,
				sortOrder: effectiveSort.sortOrder,
			}),
		);
	}

	return (
		<div className="space-y-8">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="display-title text-2xl font-semibold">Usuarios</h1>
					<p className="text-muted-foreground">
						Crea administradores, restablece contraseñas, o suspende, bloquea y
						elimina accesos.
					</p>
				</div>
				<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
					{list.data ? (
						<TableExportMenu
							title="Usuarios"
							filenameBase="usuarios"
							columns={userExportColumns}
							pageRows={list.data.items}
							pageCount={list.data.items.length}
							totalCount={list.data.total}
							fetchAllRows={fetchAllUsers}
							disabled={list.isFetching}
						/>
					) : null}
					<Button
						className="w-full sm:w-auto"
						onClick={() => setCreateOpen(true)}
					>
						Nuevo administrador
					</Button>
				</div>
			</div>

			<form
				className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
				onSubmit={(e) => {
					e.preventDefault();
					const fd = new FormData(e.currentTarget);
					const nextQ = String(fd.get("q") || "").trim();
					const nextRole = String(fd.get("role") || "");
					const nextStatus = String(fd.get("status") || "");
					navigate({
						search: {
							page: 1,
							limit,
							sortBy,
							sortDirection,
							q: nextQ || undefined,
							role:
								nextRole === "ADMIN" || nextRole === "CUSTOMER"
									? nextRole
									: undefined,
							status:
								nextStatus === "ACTIVE" ||
								nextStatus === "SUSPENDED" ||
								nextStatus === "BANNED"
									? nextStatus
									: undefined,
						},
					});
				}}
			>
				<div className="w-full space-y-1 sm:w-auto">
					<label className="text-xs text-muted-foreground" htmlFor="user-q">
						Correo
					</label>
					<Input
						id="user-q"
						name="q"
						type="search"
						defaultValue={q ?? ""}
						placeholder="cliente@ejemplo.com"
						className="h-12 w-full text-sm sm:w-64"
					/>
				</div>
				<div className="w-full space-y-1 sm:w-auto">
					<label className="text-xs text-muted-foreground" htmlFor="user-role">
						Rol
					</label>
					<select
						id="user-role"
						name="role"
						defaultValue={role ?? ""}
						className="h-12 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm sm:w-auto"
					>
						<option value="">Todos</option>
						<option value="CUSTOMER">{userRoleLabel.CUSTOMER}</option>
						<option value="ADMIN">{userRoleLabel.ADMIN}</option>
					</select>
				</div>
				<div className="w-full space-y-1 sm:w-auto">
					<label
						className="text-xs text-muted-foreground"
						htmlFor="user-status"
					>
						Estado
					</label>
					<select
						id="user-status"
						name="status"
						defaultValue={status ?? ""}
						className="h-12 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm sm:w-auto"
					>
						<option value="">Todos</option>
						<option value="ACTIVE">{userStatusLabel.ACTIVE}</option>
						<option value="SUSPENDED">{userStatusLabel.SUSPENDED}</option>
						<option value="BANNED">{userStatusLabel.BANNED}</option>
					</select>
				</div>
				<Button type="submit" variant="outline" className="w-full sm:w-auto">
					Aplicar
				</Button>
			</form>

			{list.isLoading ? <Skeleton className="h-72 rounded-xl" /> : null}
			{list.isError ? (
				<p className="text-muted-foreground">No pudimos cargar los usuarios.</p>
			) : null}

			{list.data && list.data.items.length > 0 ? (
				<>
					<MobileSortSelect
						id="users-sort"
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
								sortBy: "email",
								sortDirection: "asc",
								label: "Correo A–Z",
							},
							{
								sortBy: "email",
								sortDirection: "desc",
								label: "Correo Z–A",
							},
							{
								sortBy: "orderCount",
								sortDirection: "desc",
								label: "Más pedidos",
							},
						]}
					/>
					<MobileRecordList className={cn(list.isFetching && "opacity-60")}>
						{list.data.items.map((user) => (
							<MobileRecordCard key={user.id}>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<p className="break-all font-medium">{user.email}</p>
										<p className="mt-1 text-sm text-muted-foreground">
											{labelFor(userRoleLabel, user.role)}
											{" · "}
											{user.orderCount}{" "}
											{user.orderCount === 1 ? "pedido" : "pedidos"}
										</p>
									</div>
									<UserActions
										user={user}
										isSelf={user.id === currentUserId}
										onPasswordReset={(result) => {
											setPasswordCreated(false);
											setPasswordResult(result);
										}}
									/>
								</div>
								<StatusBadge
									label={labelFor(userStatusLabel, user.status)}
									tone={userStatusTone(user.status)}
								/>
							</MobileRecordCard>
						))}
					</MobileRecordList>
					<div
						className={cn(
							"table-fetching hidden overflow-x-auto rounded-xl border md:block",
							list.isFetching && "opacity-60",
						)}
					>
						<Table className="table-fixed">
							<TableHeader>
								<TableRow>
									<SortableTableHead
										label="Correo"
										column="email"
										sortBy={sortBy}
										sortDirection={sortDirection}
										onSort={handleSort}
										className="w-[38%]"
									/>
									<SortableTableHead
										label="Rol"
										column="role"
										sortBy={sortBy}
										sortDirection={sortDirection}
										onSort={handleSort}
										className="w-[16%]"
									/>
									<SortableTableHead
										label="Estado"
										column="status"
										sortBy={sortBy}
										sortDirection={sortDirection}
										onSort={handleSort}
										className="w-[16%]"
									/>
									<SortableTableHead
										label="Pedidos"
										column="orderCount"
										sortBy={sortBy}
										sortDirection={sortDirection}
										onSort={handleSort}
										className="w-[12%] text-right"
									/>
									<TableHead className="w-[18%] text-right">Acciones</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{list.data.items.map((user) => (
									<TableRow key={user.id}>
										<TableCell className="max-w-0 truncate font-medium">
											{user.email}
										</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{labelFor(userRoleLabel, user.role)}
										</TableCell>
										<TableCell>
											<StatusBadge
												label={labelFor(userStatusLabel, user.status)}
												tone={userStatusTone(user.status)}
											/>
										</TableCell>
										<TableCell className="text-right tabular-nums">
											{user.orderCount}
										</TableCell>
										<TableCell className="text-right">
											<UserActions
												user={user}
												isSelf={user.id === currentUserId}
												onPasswordReset={(result) => {
													setPasswordCreated(false);
													setPasswordResult(result);
												}}
											/>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
					<ListPagination
						page={page}
						total={list.data.total}
						limit={limit}
						label={`Página ${page} · ${list.data.total} usuarios en total`}
						onPrev={() => navigate({ search: { ...search, page: page - 1 } })}
						onNext={() => navigate({ search: { ...search, page: page + 1 } })}
					/>
				</>
			) : null}

			{list.data && list.data.items.length === 0 ? (
				<p className="text-muted-foreground">
					Ningún usuario coincide con los filtros.
				</p>
			) : null}

			<CreateAdminDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
				onCreated={(result) => {
					setPasswordCreated(true);
					setPasswordResult(result);
				}}
			/>
			<TemporaryPasswordDialog
				result={passwordResult}
				created={passwordCreated}
				onClose={() => {
					setPasswordResult(null);
					setPasswordCreated(false);
				}}
			/>
		</div>
	);
}
