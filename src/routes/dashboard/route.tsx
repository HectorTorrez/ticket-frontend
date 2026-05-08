import { createFileRoute, Outlet } from "@tanstack/react-router";

import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import { requireAdmin } from "#/lib/auth/guards";

export const Route = createFileRoute("/dashboard")({
	beforeLoad: () => {
		requireAdmin();
	},
	component: DashboardShell,
});

function DashboardShell() {
	return (
		<DashboardLayout>
			<Outlet />
		</DashboardLayout>
	);
}
