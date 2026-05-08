import { Link } from "@tanstack/react-router";
import type { z } from "zod";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import type { eventListItemSchema } from "#/lib/api/schemas";

type EventItem = z.infer<typeof eventListItemSchema>;

function formatWhen(iso: string) {
	try {
		return new Intl.DateTimeFormat(undefined, {
			dateStyle: "medium",
			timeStyle: "short",
		}).format(new Date(iso));
	} catch {
		return iso;
	}
}

type EventCardProps = {
	event: EventItem;
};

export function EventCard({ event }: EventCardProps) {
	const minRemaining = Math.min(
		...event.ticketTypes.map((t) => t.quantityRemaining),
		Number.POSITIVE_INFINITY,
	);
	const soldOut = event.ticketTypes.length > 0 && minRemaining <= 0;

	return (
		<article className="feature-card island-shell flex flex-col overflow-hidden rounded-xl border border-border/80">
			<div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
				{event.bannerUrl ? (
					<img
						src={event.bannerUrl}
						alt=""
						className="size-full object-cover"
						loading="lazy"
					/>
				) : (
					<div className="flex size-full items-center justify-center text-sm text-muted-foreground">
						No banner
					</div>
				)}
				{soldOut ? (
					<Badge className="absolute right-3 top-3" variant="secondary">
						Sold out
					</Badge>
				) : null}
			</div>
			<div className="flex flex-1 flex-col gap-3 p-5">
				<div>
					<h2 className="text-lg font-semibold leading-snug">{event.title}</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						{event.venue ?? "Venue TBA"}
					</p>
				</div>
				<p className="text-sm text-muted-foreground">
					{formatWhen(event.startsAt)}
				</p>
				<div className="mt-auto flex items-center justify-between gap-3 pt-2">
					<span className="text-xs text-muted-foreground">
						{event.ticketTypes.length} ticket type
						{event.ticketTypes.length === 1 ? "" : "s"}
					</span>
					<Button size="sm" asChild>
						<Link
							to="/events/$eventSlugOrId"
							params={{ eventSlugOrId: event.slug }}
						>
							View
						</Link>
					</Button>
				</div>
			</div>
		</article>
	);
}
