type EventWithEndsAt = { endsAt: string };

export function isEventEnded(
	event: EventWithEndsAt,
	now = new Date(),
): boolean {
	return new Date(event.endsAt) <= now;
}
