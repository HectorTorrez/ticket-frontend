import { describe, expect, it } from "vitest";

import {
	getEventWalletNotice,
	groupTicketsByEvent,
	isEventPast,
} from "#/lib/my-ticket-event-state";

const baseEvent = {
	id: "11111111-1111-1111-1111-111111111111",
	title: "Concierto demo",
	slug: "concierto-demo",
	startsAt: "2026-12-01T20:00:00.000Z",
	endsAt: "2026-12-01T23:00:00.000Z",
	venue: "Arena",
	published: true,
	deletedAt: null,
};

const baseTicket = {
	id: "22222222-2222-2222-2222-222222222222",
	publicCode: "abc-123",
	orderLineId: "33333333-3333-3333-3333-333333333333",
	userId: "44444444-4444-4444-4444-444444444444",
	eventId: baseEvent.id,
	ticketTypeId: "55555555-5555-5555-5555-555555555555",
	status: "ACTIVE" as const,
	usedAt: null,
	event: baseEvent,
	ticketType: { tier: "GENERAL" as const, name: "General" },
};

describe("my-ticket-event-state", () => {
	it("detects past events", () => {
		expect(
			isEventPast(
				{ ...baseEvent, startsAt: "2020-01-01T20:00:00.000Z" },
				new Date("2026-01-01T00:00:00.000Z"),
			),
		).toBe(true);
	});

	it("returns finalized notice for past events", () => {
		const notice = getEventWalletNotice(
			{ ...baseEvent, startsAt: "2020-01-01T20:00:00.000Z" },
			new Date("2026-01-01T00:00:00.000Z"),
		);
		expect(notice?.badge).toBe("Finalizado");
	});

	it("returns deactivated notice for unpublished upcoming events", () => {
		const notice = getEventWalletNotice(
			{ ...baseEvent, published: false },
			new Date("2026-01-01T00:00:00.000Z"),
		);
		expect(notice?.badge).toBe("Desactivado");
	});

	it("groups tickets by event preserving order", () => {
		const otherEvent = {
			...baseEvent,
			id: "66666666-6666-6666-6666-666666666666",
			title: "Otro show",
		};
		const groups = groupTicketsByEvent([
			baseTicket,
			{ ...baseTicket, id: "77777777-7777-7777-7777-777777777777" },
			{
				...baseTicket,
				id: "88888888-8888-8888-8888-888888888888",
				eventId: otherEvent.id,
				event: otherEvent,
			},
		]);

		expect(groups).toHaveLength(2);
		expect(groups[0]?.tickets).toHaveLength(2);
		expect(groups[1]?.tickets).toHaveLength(1);
	});
});
