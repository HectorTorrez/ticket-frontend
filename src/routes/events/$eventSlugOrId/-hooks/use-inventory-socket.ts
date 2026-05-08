import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { getSession } from "#/lib/auth/session";
import { eventsKeys } from "#/lib/query-keys";
import {
	createInventorySocket,
	joinEventRoom,
} from "#/lib/websocket/inventory-socket";

export function useInventorySocket(
	slugOrId: string,
	eventId: string | undefined,
) {
	const qc = useQueryClient();

	useEffect(() => {
		if (!eventId) return;
		const session = getSession();
		if (!session?.accessToken) return;

		const socket = createInventorySocket(session.accessToken);
		const detach = joinEventRoom(socket, eventId, (p) => {
			qc.setQueryData(eventsKeys.detail(slugOrId), (prev) => {
				if (!prev || prev.id !== p.eventId) return prev;
				return {
					...prev,
					ticketTypes: prev.ticketTypes.map((t) =>
						t.id === p.ticketTypeId
							? { ...t, quantityRemaining: p.remaining }
							: t,
					),
				};
			});
		});

		return () => {
			detach();
			socket.disconnect();
		};
	}, [qc, slugOrId, eventId]);
}
