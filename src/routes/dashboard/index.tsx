import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { useErrorToast } from "#/hooks/use-error-toast";
import { fetchDashboardSummary } from "#/lib/api/ticket-api";
import { dashboardKeys } from "#/lib/query-keys";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/dashboard/")({
	component: DashboardHome,
});

function formatMoney(amount: string, currency = "USD") {
	const n = Number(amount);
	return new Intl.NumberFormat("es", {
		style: "currency",
		currency,
	}).format(Number.isFinite(n) ? n : 0);
}

function StatCard({
	label,
	value,
	hint,
	to,
	search,
}: {
	label: string;
	value: string;
	hint?: string;
	to: string;
	search?: Record<string, string | undefined>;
}) {
	const body = (
		<Card className="feature-card h-full border-border/80 transition-colors hover:border-primary/40 hover:bg-muted/20">
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					{label}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-2xl font-semibold tracking-tight">{value}</p>
				{hint ? (
					<p className="mt-1 text-xs text-muted-foreground">{hint}</p>
				) : null}
			</CardContent>
		</Card>
	);

	return (
		<Link
			to={to}
			search={search}
			className={cn(
				"block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
			)}
		>
			{body}
		</Link>
	);
}

function DashboardHome() {
	const q = useQuery({
		queryKey: dashboardKeys.summary(),
		queryFn: fetchDashboardSummary,
	});

	useErrorToast(q.isError ? q.error : null, "No se pudo cargar el panel");

	if (q.isPending) {
		return (
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{["d1", "d2", "d3", "d4"].map((id) => (
					<Skeleton key={id} className="h-28 rounded-xl" />
				))}
			</div>
		);
	}

	if (q.isError) {
		return (
			<p className="text-muted-foreground">
				No se pudo cargar el panel. Inténtalo de nuevo en unos instantes.
			</p>
		);
	}

	const d = q.data;

	return (
		<div className="space-y-8">
			<div>
				<h1 className="display-title text-2xl font-semibold">Resumen</h1>
				<p className="mt-1 text-muted-foreground">
					Métricas de ventas e inventario de tus eventos.
				</p>
				<Badge variant="outline" className="mt-3">
					Organizador
				</Badge>
			</div>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label="Entradas vendidas"
					value={String(d.ticketsSold)}
					hint="Ver pedidos pagados"
					to="/dashboard/orders"
					search={{ status: "PAID" }}
				/>
				<StatCard
					label="Ingresos"
					value={formatMoney(d.totalRevenue)}
					hint="Ver pedidos pagados"
					to="/dashboard/orders"
					search={{ status: "PAID" }}
				/>
				<StatCard
					label="Eventos activos"
					value={String(d.activeEvents)}
					hint="Publicados y no finalizados"
					to="/dashboard/events"
					search={{ published: "true" }}
				/>
				<StatCard
					label="Inventario restante"
					value={String(d.remainingInventory)}
					hint="Gestionar eventos"
					to="/dashboard/events"
				/>
			</div>
		</div>
	);
}
