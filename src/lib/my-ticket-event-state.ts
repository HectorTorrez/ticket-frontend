import type { z } from "zod";
import type { StatusTone } from "#/components/status-indicator";
import type { myTicketSchema } from "#/lib/api/schemas";

export type MyTicket = z.infer<typeof myTicketSchema>;
export type MyTicketEvent = MyTicket["event"];

export type EventWalletNotice = {
	badge: string;
	tone: StatusTone;
	description: string;
};

export function isEventPast(event: MyTicketEvent, now = new Date()): boolean {
	return new Date(event.startsAt) < now;
}

export function isEventArchived(event: MyTicketEvent): boolean {
	return event.deletedAt != null;
}

export function isEventUnpublished(event: MyTicketEvent): boolean {
	return !event.published;
}

export function getEventWalletNotice(
	event: MyTicketEvent,
	now = new Date(),
): EventWalletNotice | null {
	const past = isEventPast(event, now);
	const archived = isEventArchived(event);
	const unpublished = isEventUnpublished(event);

	if (archived) {
		return {
			badge: "Archivado",
			tone: "neutral",
			description:
				"Este evento fue archivado por el organizador. Tus pases se conservan aquí como historial.",
		};
	}

	if (past && unpublished) {
		return {
			badge: "Finalizado",
			tone: "neutral",
			description:
				"El evento ya pasó y ya no está en cartelera. Conserva tus pases como comprobante de asistencia.",
		};
	}

	if (past) {
		return {
			badge: "Finalizado",
			tone: "neutral",
			description:
				"Este evento ya ocurrió. Tus pases permanecen en tu historial por si los necesitas.",
		};
	}

	if (unpublished) {
		return {
			badge: "Desactivado",
			tone: "warning",
			description:
				"El evento ya no está publicado en cartelera, pero tu pase sigue siendo válido para la fecha programada.",
		};
	}

	return null;
}

export function groupTicketsByEvent(tickets: MyTicket[]) {
	const byEvent = new Map<string, MyTicket[]>();

	for (const ticket of tickets) {
		const group = byEvent.get(ticket.eventId) ?? [];
		group.push(ticket);
		byEvent.set(ticket.eventId, group);
	}

	const seen = new Set<string>();
	const groups: Array<{ event: MyTicketEvent; tickets: MyTicket[] }> = [];

	for (const ticket of tickets) {
		if (seen.has(ticket.eventId)) continue;
		seen.add(ticket.eventId);
		groups.push({
			event: ticket.event,
			tickets: byEvent.get(ticket.eventId) ?? [],
		});
	}

	return groups;
}
