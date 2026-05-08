import { io, type Socket } from "socket.io-client";
import { ticketsUpdatePayloadSchema } from "#lib/api/schemas";
import { getApiBaseUrl, getSocketPath } from "#lib/env";

export type TicketsUpdatePayload = import("zod").infer<
	typeof ticketsUpdatePayloadSchema
>;

export function createInventorySocket(accessToken: string): Socket {
	return io(`${getApiBaseUrl()}/inventory`, {
		path: getSocketPath(),
		auth: { token: accessToken },
		autoConnect: true,
		transports: ["websocket", "polling"],
	});
}

export function joinEventRoom(
	socket: Socket,
	eventId: string,
	onUpdate: (payload: TicketsUpdatePayload) => void,
): () => void {
	const handler = (raw: unknown) => {
		const parsed = ticketsUpdatePayloadSchema.safeParse(raw);
		if (parsed.success) onUpdate(parsed.data);
	};
	socket.on("tickets:update", handler);

	socket.emit(
		"event:join",
		{ eventId },
		(ack: { ok: boolean; room?: string; error?: string } | undefined) => {
			if (ack && !ack.ok) {
				console.warn("event:join failed", ack.error);
			}
		},
	);

	return () => {
		socket.off("tickets:update", handler);
	};
}
