import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { fetchDashboardSummary } from "#/lib/api/ticket-api";
import { dashboardKeys } from "#/lib/query-keys";

export const Route = createFileRoute("/dashboard/")({
	component: DashboardHome,
});

function formatMoney(amount: string, currency = "USD") {
	const n = Number(amount);
	return new Intl.NumberFormat(undefined, {
		style: "currency",
		currency,
	}).format(Number.isFinite(n) ? n : 0);
}

function DashboardHome() {
	const q = useQuery({
		queryKey: dashboardKeys.summary(),
		queryFn: fetchDashboardSummary,
	});

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
			<Card className="border-destructive/50">
				<CardHeader>
					<CardTitle>Could not load dashboard</CardTitle>
				</CardHeader>
				<CardContent className="text-sm text-muted-foreground">
					{(q.error as Error).message}
				</CardContent>
			</Card>
		);
	}

	const d = q.data;

	const stat = (label: string, value: string, hint?: string) => (
		<Card className="feature-card border-border/80 transition-transform">
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
		<div className="space-y-8">
			<div>
				<h1 className="display-title text-2xl font-semibold">Overview</h1>
				<p className="mt-1 text-muted-foreground">
					Live snapshot from your Nest API.
				</p>
				<Badge variant="outline" className="mt-3">
					Admin
				</Badge>
			</div>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{stat("Tickets sold", String(d.ticketsSold), "All time")}
				{stat("Revenue", formatMoney(d.totalRevenue), "Paid orders")}
				{stat("Active events", String(d.activeEvents), "Published & not ended")}
				{stat(
					"Remaining inventory",
					String(d.remainingInventory),
					"Tickets left to sell",
				)}
			</div>
		</div>
	);
}
