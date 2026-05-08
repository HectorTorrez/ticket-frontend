import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import type { z } from "zod";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { Switch } from "#/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { ApiError } from "#/lib/api/errors";
import { eventListItemSchema } from "#/lib/api/schemas";
import {
	fetchAdminEventsList,
	publishEvent,
	unpublishEvent,
} from "#/lib/api/ticket-api";
import { eventsKeys } from "#/lib/query-keys";

type EventListItem = z.infer<typeof eventListItemSchema>;

export const Route = createFileRoute("/dashboard/events/")({
	component: DashboardEventsList,
});

const ADMIN_EVENTS_PAGE_SIZE = 10;

function EventVisibilityControl({ event }: { event: EventListItem }) {
	const qc = useQueryClient();
	const toggle = useMutation({
		mutationFn: (nextPublished: boolean) =>
			nextPublished ? publishEvent(event.id) : unpublishEvent(event.id),
		onSuccess: async (_data, nextPublished) => {
			await qc.invalidateQueries({ queryKey: eventsKeys.all });
			toast.success(
				nextPublished ? "Event is now public" : "Event is now a draft",
			);
		},
		onError: (e) =>
			toast.error(
				e instanceof ApiError ? e.message : "Could not update visibility",
			),
	});

	return (
		<div className="flex flex-wrap items-center gap-2">
			<Switch
				checked={event.published}
				disabled={toggle.isPending}
				size="sm"
				aria-label={
					event.published
						? "Event is public — switch off to hide from catalog"
						: "Event is draft — switch on to publish"
				}
				onCheckedChange={(checked) => {
					if (checked !== event.published) toggle.mutate(checked);
				}}
			/>
			<Badge variant={event.published ? "default" : "secondary"}>
				{event.published ? "Public" : "Draft"}
			</Badge>
		</div>
	);
}

function DashboardEventsList() {
	const q = useQuery({
		queryKey: eventsKeys.adminList({
			page: 1,
			limit: ADMIN_EVENTS_PAGE_SIZE,
		}),
		queryFn: () =>
			fetchAdminEventsList({
				page: 1,
				limit: ADMIN_EVENTS_PAGE_SIZE,
			}),
	});

	return (
		<div className="space-y-8">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="display-title text-2xl font-semibold">Events</h1>
					<p className="text-muted-foreground">
						All events (draft and public). Toggle the switch to publish or hide
						from the catalog.
					</p>
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
								<TableHead>Visibility</TableHead>
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
										<EventVisibilityControl event={ev} />
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
