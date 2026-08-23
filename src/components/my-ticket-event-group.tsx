import { Link } from "@tanstack/react-router";
import { Calendar, MapPin } from "lucide-react";

import {
	StatusBadge,
	StatusIndicator,
	ticketStatusTone,
} from "#/components/status-indicator";
import { TicketDateStub } from "#/components/ticket-date-stub";
import { TicketQrCode } from "#/components/ticket-qr-code";
import { Button } from "#/components/ui/button";
import { formatTicketCode, labelFor, ticketStatusLabel } from "#/lib/labels";
import {
	getEventWalletNotice,
	isEventPast,
	type MyTicket,
} from "#/lib/my-ticket-event-state";
import { cn } from "#/lib/utils";

type MyTicketEventGroupProps = {
	event: MyTicket["event"];
	tickets: MyTicket[];
};

function formatEventDateTime(startsAt: string) {
	return new Intl.DateTimeFormat("es", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(startsAt));
}

export function MyTicketEventGroup({
	event,
	tickets,
}: MyTicketEventGroupProps) {
	const notice = getEventWalletNotice(event);
	const past = isEventPast(event);
	const primaryTier = tickets[0]?.ticketType.tier ?? "GENERAL";

	return (
		<section
			className={cn(
				"stub-shell ticket-edge-left overflow-hidden rounded-xl",
				past && "opacity-95",
			)}
			aria-labelledby={`event-${event.id}-title`}
		>
			<div className="grid sm:grid-cols-[5.5rem_1fr]">
				<div className="poster-date-rail flex min-h-24 min-w-0 flex-col items-center justify-center gap-1 px-2 py-5 text-center">
					<TicketDateStub startsAt={event.startsAt} tier={primaryTier} />
				</div>

				<div className="min-w-0 space-y-4 p-5 md:p-6">
					<div className="space-y-3">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div className="min-w-0 space-y-2">
								<h2
									id={`event-${event.id}-title`}
									className="display-title min-w-0 wrap-break-word font-semibold leading-snug"
								>
									{event.title}
								</h2>
								<p className="text-sm text-muted-foreground">
									{tickets.length} {tickets.length === 1 ? "pase" : "pases"}{" "}
									para este evento
								</p>
							</div>
							{notice ? (
								<StatusBadge
									label={notice.badge}
									tone={notice.tone}
									className="shrink-0"
								/>
							) : null}
						</div>

						<div className="space-y-1 text-sm text-muted-foreground">
							<p className="flex items-center gap-1.5">
								<Calendar className="size-3.5 shrink-0" aria-hidden />
								{formatEventDateTime(event.startsAt)}
							</p>
							{event.venue ? (
								<p className="flex items-center gap-1.5">
									<MapPin className="size-3.5 shrink-0" aria-hidden />
									{event.venue}
								</p>
							) : null}
						</div>

						{notice ? (
							<p className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
								{notice.description}
							</p>
						) : null}
					</div>

					<ul className="space-y-3" aria-label={`Pases de ${event.title}`}>
						{tickets.map((ticket) => (
							<li
								key={ticket.id}
								className="flex flex-col gap-4 rounded-lg border border-border/80 bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between"
							>
								<div className="min-w-0 space-y-1">
									<p className="font-medium">{ticket.ticketType.name}</p>
									<StatusIndicator
										label={labelFor(ticketStatusLabel, ticket.status)}
										tone={ticketStatusTone(ticket.status)}
										className="text-xs"
										iconClassName="size-3"
									/>
								</div>

								<div className="flex shrink-0 flex-col items-center gap-2 sm:items-end">
									<div className="rounded-md border border-border bg-white p-2">
										<TicketQrCode
											publicCode={ticket.publicCode}
											alt={`Código QR para ${event.title}`}
											className="rounded"
										/>
									</div>
									<span className="font-ticket-code text-[0.65rem] uppercase tracking-wider text-muted-foreground">
										{formatTicketCode(ticket.publicCode)}
									</span>
									<Button variant="link" size="sm" className="text-xs" asChild>
										<Link
											to="/check/$publicCode"
											params={{ publicCode: ticket.publicCode }}
										>
											Ver pase completo
										</Link>
									</Button>
								</div>
							</li>
						))}
					</ul>
				</div>
			</div>
		</section>
	);
}
