import { Link, useRouterState } from "@tanstack/react-router";
import {
	CalendarDays,
	KeyRound,
	LayoutDashboard,
	LogIn,
	Menu,
	Ticket,
	UserPlus,
} from "lucide-react";
import { ModeToggle } from "#/components/mode-toggle";
import { SkipLink } from "#/components/skip-link";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "#/components/ui/sheet";
import { useTransitionClick } from "#/hooks/use-transition-navigate";
import { logoutRequest } from "#/lib/api/ticket-api";
import { getSession, isAdmin } from "#/lib/auth/session";
import { cn } from "#/lib/utils";

type PublicLayoutProps = {
	children: React.ReactNode;
};

function BrandMark() {
	return (
		<span className="brand-mark" aria-hidden>
			<Ticket className="size-4" strokeWidth={2.25} />
		</span>
	);
}

export function PublicLayout({ children }: PublicLayoutProps) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const session = typeof window !== "undefined" ? getSession() : null;
	const homeClick = useTransitionClick({ to: "/" }, "back");
	const eventsClick = useTransitionClick(
		{ to: "/events", search: { page: 1, limit: 10 } },
		"forward",
	);

	const navLink = (
		to: string,
		label: string,
		onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void,
	) => {
		const active = pathname === to || (to !== "/" && pathname.startsWith(to));
		return (
			<Link
				to={to}
				onClick={onClick}
				className={`nav-link rounded-md px-3 py-2 text-sm font-medium ${active ? "is-active" : ""}`}
			>
				{label}
			</Link>
		);
	};

	const sheetLinkClass =
		"rounded-md px-3 py-2.5 text-sm font-medium text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring";

	function sheetNavLink(
		to: string,
		label: string,
		onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void,
	) {
		const active = pathname === to || (to !== "/" && pathname.startsWith(to));
		return (
			<SheetClose key={to} asChild>
				<Link
					to={to}
					onClick={onClick}
					className={cn(sheetLinkClass, active && "bg-muted font-semibold")}
				>
					{label}
				</Link>
			</SheetClose>
		);
	}

	const signOut = async () => {
		await logoutRequest();
		window.location.href = "/";
	};

	return (
		<div className="flex min-h-dvh flex-col">
			<SkipLink />
			<header
				className="sticky top-0 z-50 border-b border-border/60 bg-header-bg/90 backdrop-blur-lg"
				style={{ viewTransitionName: "site-header" }}
			>
				<div className="page-wrap flex h-16 min-w-0 items-center justify-between gap-3">
					<div className="flex min-w-0 flex-1 items-center gap-4 md:gap-8 md:flex-initial">
						<Link
							to="/"
							onClick={homeClick}
							className="group flex min-w-0 items-center gap-2.5 text-foreground no-underline outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						>
							<BrandMark />
							<span className="display-title truncate text-lg font-semibold tracking-tight">
								Tide Tickets
							</span>
						</Link>
						<nav
							className="hidden items-center gap-1 md:flex"
							aria-label="Navegación principal"
						>
							{navLink("/events", "Eventos", eventsClick)}
							{session &&
								session.user.role === "CUSTOMER" &&
								navLink("/my-tickets", "Mis pases")}
							{session &&
								session.user.role === "CUSTOMER" &&
								navLink("/my-orders", "Pedidos")}
							{session &&
								isAdmin(session) &&
								navLink("/dashboard", "Organizador")}
						</nav>
					</div>
					<div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
						<ModeToggle />
						<div className="hidden items-center gap-4 md:flex">
							{session ? (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" size="sm" className="gap-2">
											<span className="max-w-32 truncate">
												{session.user.email}
											</span>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-56">
										<DropdownMenuLabel>Cuenta</DropdownMenuLabel>
										<DropdownMenuSeparator />
										{session.user.role === "CUSTOMER" && (
											<>
												<DropdownMenuItem asChild>
													<Link to="/my-tickets">
														<Ticket className="mr-2 size-4" />
														Mis pases
													</Link>
												</DropdownMenuItem>
												<DropdownMenuItem asChild>
													<Link to="/my-orders">
														<CalendarDays className="mr-2 size-4" />
														Historial de pedidos
													</Link>
												</DropdownMenuItem>
											</>
										)}
										{isAdmin(session) && (
											<DropdownMenuItem asChild>
												<Link to="/dashboard">
													<LayoutDashboard className="mr-2 size-4" />
													Panel de organizador
												</Link>
											</DropdownMenuItem>
										)}
										<DropdownMenuItem asChild>
											<Link to="/change-password">
												<KeyRound className="mr-2 size-4" />
												Cambiar contraseña
											</Link>
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem onClick={() => void signOut()}>
											Cerrar sesión
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							) : (
								<>
									<Button variant="ghost" size="sm" asChild>
										<Link to="/login" className="gap-1.5">
											<LogIn className="size-4" />
											Iniciar sesión
										</Link>
									</Button>
									<Button size="sm" asChild>
										<Link to="/register" className="gap-1.5">
											<UserPlus className="size-4" />
											Registrarse
										</Link>
									</Button>
								</>
							)}
						</div>
						<Sheet>
							<SheetTrigger asChild>
								<Button
									variant="outline"
									size="icon"
									className="md:hidden"
									aria-label="Abrir menú"
								>
									<Menu className="size-5" />
								</Button>
							</SheetTrigger>
							<SheetContent
								side="right"
								className="flex w-[min(100vw-2rem,20rem)] flex-col gap-0 sm:max-w-sm"
							>
								<SheetHeader className="text-left">
									<SheetTitle className="flex items-center gap-2">
										<BrandMark />
										Menú
									</SheetTitle>
									{session ? (
										<SheetDescription className="truncate">
											Sesión iniciada como {session.user.email}
										</SheetDescription>
									) : null}
								</SheetHeader>
								<nav
									className="flex flex-col px-2 pb-2"
									aria-label="Navegación móvil"
								>
									{sheetNavLink("/events", "Eventos", eventsClick)}
									{session &&
										session.user.role === "CUSTOMER" &&
										sheetNavLink("/my-tickets", "Mis pases")}
									{session &&
										session.user.role === "CUSTOMER" &&
										sheetNavLink("/my-orders", "Pedidos")}
									{session &&
										isAdmin(session) &&
										sheetNavLink("/dashboard", "Organizador")}
									{session &&
										sheetNavLink("/change-password", "Cambiar contraseña")}
								</nav>
								<SheetFooter className="mt-auto border-t pt-4">
									{session ? (
										<SheetClose asChild>
											<Button
												variant="outline"
												className="w-full"
												onClick={() => void signOut()}
											>
												Cerrar sesión
											</Button>
										</SheetClose>
									) : (
										<div className="flex w-full flex-col gap-2">
											<SheetClose asChild>
												<Button variant="outline" className="w-full" asChild>
													<Link to="/login" className="gap-1.5">
														<LogIn className="size-4" />
														Iniciar sesión
													</Link>
												</Button>
											</SheetClose>
											<SheetClose asChild>
												<Button className="w-full" asChild>
													<Link to="/register" className="gap-1.5">
														<UserPlus className="size-4" />
														Registrarse
													</Link>
												</Button>
											</SheetClose>
										</div>
									)}
								</SheetFooter>
							</SheetContent>
						</Sheet>
					</div>
				</div>
			</header>
			<main id="main-content" className="flex-1" tabIndex={-1}>
				{children}
			</main>
			<footer
				className="site-footer mt-auto py-12"
				style={{ viewTransitionName: "site-footer" }}
			>
				<div className="page-wrap">
					<div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
						<div className="flex items-center gap-2.5">
							<BrandMark />
							<div>
								<p className="display-title text-sm font-semibold">
									Tide Tickets
								</p>
								<p className="text-sm text-muted-foreground">
									Cartelera, entradas y pases digitales
								</p>
							</div>
						</div>
						<div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
							<Link
								to="/events"
								onClick={eventsClick}
								className="nav-link hover:text-foreground"
							>
								Eventos
							</Link>
							{!session ? (
								<>
									<Link to="/login" className="nav-link hover:text-foreground">
										Iniciar sesión
									</Link>
									<Link
										to="/register"
										className="nav-link hover:text-foreground"
									>
										Registrarse
									</Link>
								</>
							) : null}
						</div>
					</div>
					<div className="mt-8 h-px max-w-xs bg-border" />
					<p className="font-ticket-code mt-4 text-xs text-muted-foreground">
						© {new Date().getFullYear()} Tide Tickets · Reserva · paga · entra
						con QR
					</p>
				</div>
			</footer>
		</div>
	);
}
