import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, MapPin, Ticket } from "lucide-react";

import { PublicLayout } from "#/components/layouts/public-layout";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { fetchMyTickets, ticketQrImageUrl } from "#/lib/api/ticket-api";
import { requireCustomer } from "#/lib/auth/guards";
import { ticketsKeys } from "#/lib/query-keys";

export const Route = createFileRoute("/my-tickets/")({
	beforeLoad: () => {
		requireCustomer();
	},
	component: MyTicketsPage,
});

function MyTicketsPage() {
	const q = useQuery({
		queryKey: ticketsKeys.mine(),
		queryFn: fetchMyTickets,
	});

	return (
		<PublicLayout>
			<div className="page-wrap space-y-8 py-12 md:py-16">
				<div className="rise-in">
					<p className="island-kicker">Your wallet</p>
					<h1 className="display-title mt-2 text-3xl font-semibold md:text-4xl">
						My tickets
					</h1>
					<p className="mt-2 text-muted-foreground">
						Show these passes at the door. Each code is unique to your purchase.
					</p>
				</div>

				{q.isPending ? (
					<div className="grid gap-6 md:grid-cols-2">
						<Skeleton className="h-56 rounded-xl" />
						<Skeleton className="h-56 rounded-xl" />
					</div>
				) : null}

				{q.isError ? (
					<div className="island-shell rounded-xl p-8 text-center text-destructive">
						{(q.error as Error).message}
					</div>
				) : null}

				{q.data && q.data.length === 0 ? (
					<div className="island-shell rise-in rounded-xl p-12 text-center">
						<Ticket className="mx-auto size-12 text-muted-foreground/50" />
						<p className="mt-4 text-lg font-medium">No passes yet</p>
						<p className="mt-1 text-muted-foreground">
							When you buy tickets, they'll appear here ready to scan.
						</p>
						<Button className="mt-6" asChild>
							<Link to="/events">Browse events</Link>
						</Button>
					</div>
				) : null}

				{q.data && q.data.length > 0 ? (
					<ul className="grid gap-6 md:grid-cols-2">
						{q.data.map((t) => (
							<li key={t.id}>
								<article className="pass-card ticket-edge-left flex overflow-hidden rounded-xl">
									<div className="pass-card-stub flex w-20 shrink-0 flex-col items-center justify-center gap-1 px-3 py-6 text-center">
										<span className="text-[0.6rem] font-bold uppercase tracking-widest text-primary">
											{new Intl.DateTimeFormat(undefined, {
												month: "short",
											})
												.format(new Date(t.event.startsAt))
												.toUpperCase()}
										</span>
										<span className="display-title text-2xl font-bold leading-none">
											{new Date(t.event.startsAt).getDate()}
										</span>
										<span className="mt-2 text-[0.55rem] font-medium uppercase tracking-wider text-muted-foreground">
											{t.ticketType.tier}
										</span>
									</div>
									<div className="flex min-w-0 flex-1 flex-col gap-4 p-5 sm:flex-row sm:items-center">
										<div className="min-w-0 flex-1 space-y-2">
											<div className="flex flex-wrap items-start justify-between gap-2">
												<h2 className="display-title font-semibold leading-snug">
													{t.event.title}
												</h2>
												<Badge
													variant={
														t.status === "ACTIVE" ? "default" : "secondary"
													}
												>
													{t.status}
												</Badge>
											</div>
											<p className="text-sm text-muted-foreground">
												{t.ticketType.name}
											</p>
											<div className="space-y-1 text-sm text-muted-foreground">
												<p className="flex items-center gap-1.5">
													<Calendar className="size-3.5 shrink-0" />
													{new Intl.DateTimeFormat(undefined, {
														dateStyle: "medium",
														timeStyle: "short",
													}).format(new Date(t.event.startsAt))}
												</p>
												{t.event.venue ? (
													<p className="flex items-center gap-1.5">
														<MapPin className="size-3.5 shrink-0" />
														{t.event.venue}
													</p>
												) : null}
											</div>
											<p className="break-all font-mono text-xs text-muted-foreground/80">
												{t.publicCode}
											</p>
										</div>
										<div className="flex shrink-0 flex-col items-center gap-2">
											<div className="rounded-lg border-2 border-dashed border-primary/20 bg-white p-2">
												<img
													src={ticketQrImageUrl(t.publicCode)}
													alt={`QR code for ${t.event.title}`}
													width={140}
													height={140}
													className="rounded"
												/>
											</div>
											<span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
												Scan at entry
											</span>
										</div>
									</div>
								</article>
							</li>
						))}
					</ul>
				) : null}
			</div>
		</PublicLayout>
	);
}
