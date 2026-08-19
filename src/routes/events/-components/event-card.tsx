import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";
import type { MouseEvent } from "react";
import type { z } from "zod";
import { ScrollReveal } from "#/components/scroll-reveal";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import type { eventListItemSchema } from "#/lib/api/schemas";
import { eventBannerTransitionName, runViewTransition } from "#/lib/view-transition";

type EventItem = z.infer<typeof eventListItemSchema>;

function formatWhen(iso: string) {
	try {
		return new Intl.DateTimeFormat("es", {
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
			month: new Intl.DateTimeFormat("es", { month: "short" })
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
	revealDelayMs?: number;
};

export function EventCard({ event, revealDelayMs = 0 }: EventCardProps) {
	const navigate = useNavigate();
	const minRemaining = Math.min(
		...event.ticketTypes.map((t) => t.quantityRemaining),
		Number.POSITIVE_INFINITY,
	);
	const soldOut = event.ticketTypes.length > 0 && minRemaining <= 0;
	const dateChip = formatDateChip(event.startsAt);
	const fromPrice = minPrice(event);
	const bannerTransition = eventBannerTransitionName(event.id);
	const openEvent = (eventClick: MouseEvent<HTMLAnchorElement>) => {
		if (eventClick.defaultPrevented) return;
		if (
			eventClick.metaKey ||
			eventClick.ctrlKey ||
			eventClick.shiftKey ||
			eventClick.altKey ||
			eventClick.currentTarget.target === "_blank"
		) {
			return;
		}

		eventClick.preventDefault();
		runViewTransition(
			() =>
				navigate({
					to: "/events/$eventSlugOrId",
					params: { eventSlugOrId: event.slug },
				}),
			"forward",
		);
	};

	return (
		<ScrollReveal delayMs={revealDelayMs}>
			<article className="poster-frame group grid grid-cols-[4.5rem_1fr] overflow-hidden rounded-lg">
				<div className="poster-date-rail flex flex-col items-center justify-start gap-1 px-2 py-5 text-center">
					<span className="text-[0.68rem] font-bold tracking-[0.14em]">
						{dateChip.month}
					</span>
					<span className="display-title text-3xl font-bold leading-none">
						{dateChip.day}
					</span>
					<span className="mt-auto font-ticket-code text-[0.62rem] uppercase tracking-wider opacity-70">
						En vivo
					</span>
				</div>
				<div className="min-w-0">
					<Link
						to="/events/$eventSlugOrId"
						params={{ eventSlugOrId: event.slug }}
						onClick={openEvent}
						className="relative block aspect-[16/9] w-full overflow-hidden bg-muted"
						aria-label={`Ver ${event.title}`}
					>
						{event.bannerUrl ? (
							<img
								src={event.bannerUrl}
								alt=""
								className="size-full object-cover transition-transform duration-500 ease-[var(--ease-out-strong)] motion-safe:group-hover:scale-[1.025]"
								loading="lazy"
								style={{ viewTransitionName: bannerTransition }}
							/>
						) : (
							<div className="flex size-full items-center justify-center bg-secondary text-primary">
								<span className="display-title text-5xl font-bold opacity-30">
									{event.title.charAt(0)}
								</span>
							</div>
						)}
						<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-sea-ink/45 via-transparent to-transparent" />
						{soldOut ? (
							<Badge variant="destructive" className="absolute right-3 top-3">
								Agotado
							</Badge>
						) : null}
					</Link>
					<div className="flex min-h-52 flex-col gap-3 p-5">
						<div>
							<h2 className="display-title text-xl font-semibold leading-tight">
								<Link
									to="/events/$eventSlugOrId"
									params={{ eventSlugOrId: event.slug }}
									onClick={openEvent}
									className="text-foreground underline-offset-4 hover:text-primary hover:underline"
								>
									{event.title}
								</Link>
							</h2>
							<p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
								<MapPin className="size-3.5 shrink-0" aria-hidden />
								{event.venue ?? "Lugar por confirmar"}
							</p>
						</div>
						<p className="text-sm text-muted-foreground">
							{formatWhen(event.startsAt)}
						</p>
						<div className="mt-auto flex items-end justify-between gap-3 border-t border-dashed border-border pt-4">
							<div className="text-sm">
								{fromPrice !== null ? (
									<>
										<span className="block text-xs text-muted-foreground">
											Desde
										</span>
										<span className="display-title text-xl font-semibold">
											{new Intl.NumberFormat("es", {
												style: "currency",
												currency: "USD",
											}).format(fromPrice)}
										</span>
									</>
								) : (
									<span className="text-muted-foreground">
										{event.ticketTypes.length} categoría
										{event.ticketTypes.length === 1 ? "" : "s"}
									</span>
								)}
							</div>
							<Button size="sm" variant="outline" className="gap-1.5" asChild>
								<Link
									to="/events/$eventSlugOrId"
									params={{ eventSlugOrId: event.slug }}
									onClick={openEvent}
								>
									Ver evento
									<ArrowRight className="size-3.5" aria-hidden />
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</article>
		</ScrollReveal>
	);
}
