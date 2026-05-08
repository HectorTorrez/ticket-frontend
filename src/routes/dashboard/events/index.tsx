import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { fetchEventsList } from "#/lib/api/ticket-api";
import { eventsKeys } from "#/lib/query-keys";

export const Route = createFileRoute("/dashboard/events/")({
	component: DashboardEventsList,
});

function DashboardEventsList() {
	const q = useQuery({
		queryKey: eventsKeys.list({
			page: 1,
			limit: 100,
			publishedOnly: false,
		}),
		queryFn: () =>
			fetchEventsList({
				page: 1,
				limit: 100,
				publishedOnly: false,
			}),
	});

	return (
		<div className="space-y-8">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="display-title text-2xl font-semibold">Events</h1>
					<p className="text-muted-foreground">Draft and published events</p>
				</div>
				<Button asChild>
					<Link to="/dashboard/events/create">Create event</Link>
				</Button>
			</div>

			{q.isPending ? <Skeleton className="h-64 w-full rounded-xl" /> : null}
			{q.isError ? (
				<p className="text-destructive">{(q.error as Error).message}</p>
			) : null}

			{q.data && q.data.items.length === 0 ? (
				<p className="text-muted-foreground">No events yet.</p>
			) : null}

			{q.data && q.data.items.length > 0 ? (
				<div className="overflow-x-auto rounded-xl border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Title</TableHead>
								<TableHead>Slug</TableHead>
								<TableHead>Starts</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{q.data.items.map((ev) => (
								<TableRow key={ev.id}>
									<TableCell className="font-medium">{ev.title}</TableCell>
									<TableCell className="font-mono text-xs">{ev.slug}</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{new Intl.DateTimeFormat(undefined, {
											dateStyle: "short",
										}).format(new Date(ev.startsAt))}
									</TableCell>
									<TableCell>
										<Badge variant={ev.published ? "default" : "secondary"}>
											{ev.published ? "Published" : "Draft"}
										</Badge>
									</TableCell>
									<TableCell className="text-right">
										<Button variant="outline" size="sm" asChild>
											<Link
												to="/dashboard/events/$eventId/edit"
												params={{ eventId: ev.id }}
											>
												Edit
											</Link>
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			) : null}
		</div>
	);
}
