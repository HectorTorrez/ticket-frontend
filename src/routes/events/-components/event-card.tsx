import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";
import type { z } from "zod";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import type { eventListItemSchema } from "#/lib/api/schemas";

type EventItem = z.infer<typeof eventListItemSchema>;

function formatWhen(iso: string) {
	try {
		return new Intl.DateTimeFormat(undefined, {
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
		}).format(new Date(iso));
	} catch {
		return iso;
	}
}

function formatDateChip(iso: string) {
	try {
		const d = new Date(iso);
		return {
			month: new Intl.DateTimeFormat(undefined, { month: "short" })
				.format(d)
				.toUpperCase(),
			day: d.getDate(),
		};
	} catch {
		return { month: "—", day: 0 };
	}
}

function minPrice(event: EventItem) {
	if (event.ticketTypes.length === 0) return null;
	const prices = event.ticketTypes.map((t) => Number(t.price));
	return Math.min(...prices);
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
	const dateChip = formatDateChip(event.startsAt);
	const fromPrice = minPrice(event);

	return (
		<article className="feature-card ticket-edge group flex flex-col overflow-hidden rounded-xl border border-border/80">
			<div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
				{event.bannerUrl ? (
					<img
						src={event.bannerUrl}
						alt=""
						className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
						loading="lazy"
					/>
				) : (
					<div className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/10 to-primary/5 text-muted-foreground">
						<span className="display-title text-3xl font-bold text-primary/30">
							{event.title.charAt(0)}
						</span>
					</div>
				)}
				<div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
				<div className="absolute left-3 top-3 flex flex-col items-center rounded-lg bg-background/95 px-2.5 py-1.5 text-center shadow-sm backdrop-blur-sm">
					<span className="text-[0.65rem] font-bold tracking-wider text-primary">
						{dateChip.month}
					</span>
					<span className="display-title text-xl font-bold leading-none">
						{dateChip.day}
					</span>
				</div>
				{soldOut ? (
					<Badge className="absolute right-3 top-3 bg-phosphor text-white hover:bg-phosphor">
						Sold out
					</Badge>
				) : null}
			</div>
			<div className="flex flex-1 flex-col gap-3 p-5">
				<div>
					<h2 className="display-title text-lg font-semibold leading-snug">
						{event.title}
					</h2>
					<p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
						<MapPin className="size-3.5 shrink-0" />
						{event.venue ?? "Venue TBA"}
					</p>
				</div>
				<p className="text-sm text-muted-foreground">
					{formatWhen(event.startsAt)}
				</p>
				<div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-4">
					<div className="text-sm">
						{fromPrice !== null ? (
							<>
								<span className="text-muted-foreground">From </span>
								<span className="font-semibold">
									{new Intl.NumberFormat(undefined, {
										style: "currency",
										currency: "USD",
									}).format(fromPrice)}
								</span>
							</>
						) : (
							<span className="text-muted-foreground">
								{event.ticketTypes.length} tier
								{event.ticketTypes.length === 1 ? "" : "s"}
							</span>
						)}
					</div>
					<Button size="sm" className="gap-1.5" asChild>
						<Link
							to="/events/$eventSlugOrId"
							params={{ eventSlugOrId: event.slug }}
						>
							Get tickets
							<ArrowRight className="size-3.5" />
						</Link>
					</Button>
				</div>
			</div>
		</article>
	);
}
