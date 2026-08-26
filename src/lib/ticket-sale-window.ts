export type TicketSaleWindow = {
	saleStartsAt?: string | null;
	saleEndsAt?: string | null;
};

export type TicketSalePhase = "before" | "open" | "after";

export function getTicketSalePhase(
	ticket: TicketSaleWindow,
	now = Date.now(),
): TicketSalePhase {
	if (ticket.saleStartsAt) {
		const start = new Date(ticket.saleStartsAt).getTime();
		if (Number.isFinite(start) && start > now) return "before";
	}
	if (ticket.saleEndsAt) {
		const end = new Date(ticket.saleEndsAt).getTime();
		if (Number.isFinite(end) && end < now) return "after";
	}
	return "open";
}

export function isTicketSaleOpen(ticket: TicketSaleWindow, now = Date.now()) {
	return getTicketSalePhase(ticket, now) === "open";
}

export function formatSaleWindowLabel(
	ticket: TicketSaleWindow,
	phase: TicketSalePhase,
) {
	const fmt = new Intl.DateTimeFormat("es", {
		dateStyle: "medium",
		timeStyle: "short",
	});
	if (phase === "before" && ticket.saleStartsAt) {
		return `Venta desde ${fmt.format(new Date(ticket.saleStartsAt))}`;
	}
	if (phase === "after" && ticket.saleEndsAt) {
		return `Venta finalizada el ${fmt.format(new Date(ticket.saleEndsAt))}`;
	}
	return null;
}
