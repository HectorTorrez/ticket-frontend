/**
 * HTTP paths are relative to `/api/v1` (`getApiV1Prefix()`). OpenAPI UI: `GET /docs` on the API host (no `/api/v1`).
 *
 * **Public (no JWT)** — `POST` `/auth/register|login|refresh|logout`, `GET` `/health`, `/health/ready`,
 * `/events`, `/events/:slugOrId`, `/tickets/:publicCode`, `/tickets/:publicCode/qr`. Catalog `GET /events*`
 * ignores `Authorization` (still published-only on `:slugOrId`).
 *
 * **Customer (`CUSTOMER` + Bearer)** — `GET` `/me/orders`, `/me/orders/:id`, `/me/tickets`; `POST` `/orders`,
 * `/orders/:id/mock-pay`, `/orders/:id/cancel`. No `/me/events`; use public `/events` routes to browse.
 *
 * **Admin (`ADMIN` + Bearer)** — `GET` `/admin/events` (drafts + published); `POST` `/events`; `PATCH|DELETE` `/events/:id`;
 * `POST` publish/unpublish/banner; `POST` `/events/:eventId/ticket-types`; `PATCH|DELETE` `/ticket-types/:id`;
 * `GET` `/admin/orders`, `/dashboard/summary`; `POST` `/qr/validate`.
 *
 * **Token refresh** is implemented in `client.ts` (`POST /auth/refresh`).
 *
 * **WebSocket** — Socket.IO namespace `/inventory`; any valid JWT role may connect (`inventory-socket.ts`).
 */
import { z } from "zod";
import { ApiError } from "#/lib/api/errors";
import { apiRequest } from "#lib/api/client";
import {
	authResponseSchema,
	cancelOrderResponseSchema,
	dashboardSummarySchema,
	deleteResponseSchema,
	eventDetailSchema,
	healthOkSchema,
	healthReadySchema,
	eventListItemSchema,
	logoutResponseSchema,
	myTicketSchema,
	orderDetailSchema,
	paginatedAdminOrdersSchema,
	paginatedCustomerOrdersSchema,
	paginatedEventsSchema,
	publicTicketSchema,
	qrValidateResultSchema,
	type TicketTier,
	ticketTypeFullSchema,
} from "#lib/api/schemas";
import { clearSession, getSession } from "#lib/auth/session";
import { getApiV1Prefix } from "#lib/env";

type EventListRow = z.infer<typeof eventListItemSchema>;

export async function registerRequest(body: {
	email: string;
	password: string;
}) {
	return apiRequest("/auth/register", authResponseSchema, {
		method: "POST",
		body,
		skipAuth: true,
	});
}

export async function loginRequest(body: { email: string; password: string }) {
	return apiRequest("/auth/login", authResponseSchema, {
		method: "POST",
		body,
		skipAuth: true,
	});
}

export async function logoutRequest() {
	const session = getSession();
	if (!session?.refreshToken) {
		clearSession();
		return;
	}
	try {
		await apiRequest("/auth/logout", logoutResponseSchema, {
			method: "POST",
			body: { refreshToken: session.refreshToken },
			skipAuth: true,
		});
	} finally {
		clearSession();
	}
}

export async function fetchHealth() {
	return apiRequest("/health", healthOkSchema, { skipAuth: true });
}

export async function fetchHealthReady() {
	return apiRequest("/health/ready", healthReadySchema, { skipAuth: true });
}

export type EventsListParams = {
	page?: number;
	limit?: number;
	publishedOnly?: boolean;
	q?: string;
	from?: string;
	to?: string;
};

export async function fetchEventsList(params: EventsListParams) {
	const sp = new URLSearchParams();
	if (params.page != null) sp.set("page", String(params.page));
	if (params.limit != null) sp.set("limit", String(params.limit));
	if (params.publishedOnly != null)
		sp.set("publishedOnly", String(params.publishedOnly));
	if (params.q) sp.set("q", params.q);
	if (params.from) sp.set("from", params.from);
	if (params.to) sp.set("to", params.to);
	const qs = sp.toString();
	return apiRequest(`/events${qs ? `?${qs}` : ""}`, paginatedEventsSchema);
}

/** Admin panel list — non-deleted events. Omit `published` for drafts + published. */
export type AdminEventsListParams = {
	page?: number;
	limit?: number;
	/** Omit = both; `true` = published only; `false` = drafts only */
	published?: boolean;
	from?: string;
	to?: string;
	q?: string;
};

export async function fetchAdminEventsList(params: AdminEventsListParams) {
	const sp = new URLSearchParams();
	if (params.page != null) sp.set("page", String(params.page));
	if (params.limit != null) sp.set("limit", String(params.limit));
	if (params.published != null) sp.set("published", String(params.published));
	if (params.q) sp.set("q", params.q);
	if (params.from) sp.set("from", params.from);
	if (params.to) sp.set("to", params.to);
	const qs = sp.toString();
	return apiRequest(
		`/admin/events${qs ? `?${qs}` : ""}`,
		paginatedEventsSchema,
	);
}

export async function fetchEventDetail(slugOrId: string) {
	const enc = encodeURIComponent(slugOrId);
	return apiRequest(`/events/${enc}`, eventDetailSchema);
}

/**
 * Event detail for **ADMIN** dashboard (drafts are not on public `GET /events/:slugOrId`).
 * Try catalog GET first (works when published); else **`GET /admin/events/:id`** (includes ticket types).
 */
export async function fetchOrganizerEventDetail(id: string) {
	try {
		return await fetchEventDetail(id);
	} catch (e) {
		if (!(e instanceof ApiError) || ![404, 403].includes(e.statusCode)) {
			throw e;
		}
	}

	try {
		return await apiRequest(`/admin/events/${id}`, eventDetailSchema);
	} catch (e) {
		if (!(e instanceof ApiError) || e.statusCode !== 404) {
			throw e;
		}
	}

	const pageLimit = 100;
	let page = 1;
	for (;;) {
		let batch: Awaited<ReturnType<typeof fetchAdminEventsList>>;
		try {
			batch = await fetchAdminEventsList({
				page,
				limit: pageLimit,
			});
		} catch (e) {
			if (e instanceof ApiError && e.statusCode === 403) {
				throw new ApiError({
					message:
						"No tienes permiso para ver este evento. Inicia sesión como organizador.",
					statusCode: 403,
					code: "Prohibido",
				});
			}
			throw e;
		}
		const hit = batch.items.find((eventRow: EventListRow) => eventRow.id === id);
		if (hit) {
			const parsed = eventDetailSchema.safeParse(hit);
			if (!parsed.success) {
				throw new Error(
					`Event list row for ${id} did not match detail schema: ${parsed.error.message}`,
				);
			}
			return parsed.data;
		}
		if (page * pageLimit >= batch.total) {
			break;
		}
		page += 1;
	}

	throw new ApiError({
		message: "Evento no encontrado",
		statusCode: 404,
		code: "No encontrado",
	});
}

export type CreateEventBody = {
	title: string;
	slug?: string;
	description?: string;
	startsAt: string;
	endsAt: string;
	venue?: string;
};

export async function createEvent(body: CreateEventBody) {
	return apiRequest("/events", eventDetailSchema, { method: "POST", body });
}

export async function patchEvent(id: string, body: Partial<CreateEventBody>) {
	return apiRequest(`/events/${id}`, eventDetailSchema, {
		method: "PATCH",
		body,
	});
}

export async function deleteEvent(id: string) {
	return apiRequest(`/events/${id}`, deleteResponseSchema, {
		method: "DELETE",
	});
}

export async function publishEvent(id: string) {
	return apiRequest(`/events/${id}/publish`, eventDetailSchema, {
		method: "POST",
	});
}

export async function unpublishEvent(id: string) {
	return apiRequest(`/events/${id}/unpublish`, eventDetailSchema, {
		method: "POST",
	});
}

export async function uploadEventBanner(eventId: string, file: File) {
	const fd = new FormData();
	fd.append("file", file);
	return apiRequest(`/events/${eventId}/banner`, eventDetailSchema, {
		method: "POST",
		body: fd,
	});
}

export type CreateTicketTypeBody = {
	tier: TicketTier;
	name: string;
	price: number;
	quantity: number;
	saleStartsAt?: string;
	saleEndsAt?: string;
};

export async function createTicketType(
	eventId: string,
	body: CreateTicketTypeBody,
) {
	return apiRequest(`/events/${eventId}/ticket-types`, ticketTypeFullSchema, {
		method: "POST",
		body,
	});
}

export async function patchTicketType(
	id: string,
	body: Partial<CreateTicketTypeBody>,
) {
	return apiRequest(`/ticket-types/${id}`, ticketTypeFullSchema, {
		method: "PATCH",
		body,
	});
}

export async function deleteTicketType(id: string) {
	return apiRequest(`/ticket-types/${id}`, deleteResponseSchema, {
		method: "DELETE",
	});
}

export async function fetchMyOrders(params: {
	page?: number;
	limit?: number;
	status?: string;
}) {
	const sp = new URLSearchParams();
	if (params.page != null) sp.set("page", String(params.page));
	if (params.limit != null) sp.set("limit", String(params.limit));
	if (params.status) sp.set("status", params.status);
	const qs = sp.toString();
	return apiRequest(
		`/me/orders${qs ? `?${qs}` : ""}`,
		paginatedCustomerOrdersSchema,
	);
}

export async function fetchMyOrder(id: string) {
	return apiRequest(`/me/orders/${id}`, orderDetailSchema);
}

export async function createOrder(
	lines: { ticketTypeId: string; quantity: number }[],
) {
	return apiRequest("/orders", orderDetailSchema, {
		method: "POST",
		body: { lines },
	});
}

export async function mockPayOrder(id: string, outcome: "SUCCESS" | "FAILURE") {
	return apiRequest(`/orders/${id}/mock-pay`, orderDetailSchema, {
		method: "POST",
		body: { outcome },
	});
}

export async function cancelOrder(id: string) {
	return apiRequest(`/orders/${id}/cancel`, cancelOrderResponseSchema, {
		method: "POST",
	});
}

export async function fetchMyTickets() {
	return apiRequest("/me/tickets", z.array(myTicketSchema));
}

export async function fetchPublicTicket(publicCode: string) {
	const enc = encodeURIComponent(publicCode);
	return apiRequest(`/tickets/${enc}`, publicTicketSchema, { skipAuth: true });
}

export function ticketQrImageUrl(publicCode: string, origin?: string): string {
	const enc = encodeURIComponent(publicCode);
	const sp = new URLSearchParams();
	if (origin) sp.set("origin", origin.replace(/\/$/, ""));
	const qs = sp.toString();
	return `${getApiV1Prefix()}/tickets/${enc}/qr${qs ? `?${qs}` : ""}`;
}

export async function fetchAdminOrders(params: {
	page?: number;
	limit?: number;
	status?: string;
	userId?: string;
}) {
	const sp = new URLSearchParams();
	if (params.page != null) sp.set("page", String(params.page));
	if (params.limit != null) sp.set("limit", String(params.limit));
	if (params.status) sp.set("status", params.status);
	if (params.userId) sp.set("userId", params.userId);
	const qs = sp.toString();
	return apiRequest(
		`/admin/orders${qs ? `?${qs}` : ""}`,
		paginatedAdminOrdersSchema,
	);
}

export async function fetchDashboardSummary() {
	return apiRequest("/dashboard/summary", dashboardSummarySchema);
}

export async function validateQrCode(code: string) {
	return apiRequest("/qr/validate", qrValidateResultSchema, {
		method: "POST",
		body: { code },
	});
}
