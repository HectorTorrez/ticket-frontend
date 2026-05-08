import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { PublicLayout } from "#/components/layouts/public-layout";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
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
			<div className="page-wrap space-y-8 py-12">
				<div>
					<h1 className="display-title text-3xl font-semibold">My tickets</h1>
					<p className="mt-1 text-muted-foreground">
						Digital passes for events you have purchased.
					</p>
				</div>

				{q.isPending ? (
					<div className="grid gap-4 md:grid-cols-2">
						<Skeleton className="h-64 rounded-xl" />
						<Skeleton className="h-64 rounded-xl" />
					</div>
				) : null}

				{q.isError ? (
					<p className="text-destructive">{(q.error as Error).message}</p>
				) : null}

				{q.data && q.data.length === 0 ? (
					<Card>
						<CardContent className="py-12 text-center text-muted-foreground">
							No tickets yet.{" "}
							<Link
								to="/events"
								className="font-medium text-primary underline-offset-4 hover:underline"
							>
								Browse events
							</Link>
						</CardContent>
					</Card>
				) : null}

				{q.data && q.data.length > 0 ? (
					<ul className="grid gap-6 md:grid-cols-2">
						{q.data.map((t) => (
							<li key={t.id}>
								<Card className="overflow-hidden">
									<CardHeader className="pb-2">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<CardTitle className="text-base">
												{t.event.title}
											</CardTitle>
											<Badge
												variant={
													t.status === "ACTIVE" ? "default" : "secondary"
												}
											>
												{t.status}
											</Badge>
										</div>
										<p className="text-sm text-muted-foreground">
											{t.ticketType.name} · {t.ticketType.tier}
										</p>
									</CardHeader>
									<CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
										<img
											src={ticketQrImageUrl(t.publicCode)}
											alt=""
											width={160}
											height={160}
											className="rounded-md border bg-white p-1"
										/>
										<div className="min-w-0 flex-1 space-y-2 text-sm">
											<p className="text-muted-foreground">
												{new Intl.DateTimeFormat(undefined, {
													dateStyle: "medium",
													timeStyle: "short",
												}).format(new Date(t.event.startsAt))}
											</p>
											{t.event.venue ? <p>{t.event.venue}</p> : null}
											<p className="break-all font-mono text-xs text-muted-foreground">
												{t.publicCode}
											</p>
										</div>
									</CardContent>
								</Card>
							</li>
						))}
					</ul>
				) : null}
			</div>
		</PublicLayout>
	);
}
