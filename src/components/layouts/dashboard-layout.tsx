import { Link, useRouterState } from "@tanstack/react-router";
import {
	CalendarSearch,
	LayoutDashboard,
	Menu,
	QrCode,
	ShoppingBag,
} from "lucide-react";
import { ModeToggle } from "#/components/mode-toggle";
import { Button } from "#/components/ui/button";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetTrigger,
} from "#/components/ui/sheet";
import { cn } from "#/lib/utils";

const links = [
	{ to: "/dashboard", label: "Resumen", icon: LayoutDashboard, end: true },
	{ to: "/dashboard/events", label: "Eventos", icon: CalendarSearch },
	{ to: "/dashboard/orders", label: "Pedidos", icon: ShoppingBag },
	{ to: "/dashboard/scanner", label: "Escáner", icon: QrCode },
] as const;

type DashboardLayoutProps = {
	children: React.ReactNode;
};

function navClassName(active: boolean) {
	return cn(
		"flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
		active
			? "bg-sidebar-accent text-sidebar-accent-foreground"
			: "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
	);
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	const NavDesktop = () => (
		<nav className="flex flex-col gap-1 p-4">
			{links.map(({ to, label, icon: Icon, end }) => {
				const active =
					end === true
						? pathname === to
						: pathname === to || pathname.startsWith(`${to}/`);
				return (
					<Link key={to} to={to} className={navClassName(active)}>
						<Icon className="size-4 shrink-0 opacity-80" />
						{label}
					</Link>
				);
			})}
		</nav>
	);

	const NavMobile = () => (
		<nav className="flex flex-col gap-1 p-4">
			{links.map(({ to, label, icon: Icon, end }) => {
				const active =
					end === true
						? pathname === to
						: pathname === to || pathname.startsWith(`${to}/`);
				return (
					<SheetClose key={to} asChild>
						<Link to={to} className={navClassName(active)}>
							<Icon className="size-4 shrink-0 opacity-80" />
							{label}
						</Link>
					</SheetClose>
				);
			})}
		</nav>
	);

	return (
		<div className="flex min-h-dvh">
			<aside className="hidden w-60 shrink-0 border-r border-border bg-sidebar text-sidebar-foreground lg:block">
				<div className="flex h-16 items-center border-b border-sidebar-border px-4">
					<Link to="/dashboard" className="display-title font-semibold">
						Admin
					</Link>
				</div>
				<NavDesktop />
			</aside>
			<div className="flex min-w-0 flex-1 flex-col">
				<header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background/90 px-4 backdrop-blur lg:px-6">
					<Sheet>
						<SheetTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="lg:hidden"
								aria-label="Abrir menú"
							>
								<Menu className="size-5" />
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="w-64 p-0">
							<div className="flex h-14 items-center border-b px-4 font-semibold">
								Menú
							</div>
							<NavMobile />
						</SheetContent>
					</Sheet>
					<div className="flex flex-1 items-center justify-between gap-2">
						<Link
							to="/"
							className="text-sm text-muted-foreground hover:text-foreground"
						>
							← Volver al sitio
						</Link>
						<ModeToggle />
					</div>
				</header>
				<div className="flex-1 p-4 lg:p-8">{children}</div>
			</div>
		</div>
	);
}
