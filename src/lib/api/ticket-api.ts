import { z } from "zod";

import { apiRequest } from "#lib/api/client";
import {
	authResponseSchema,
	cancelOrderResponseSchema,
	dashboardSummarySchema,
	deleteResponseSchema,
	eventDetailSchema,
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

export async function fetchEventDetail(slugOrId: string) {
	const enc = encodeURIComponent(slugOrId);
	return apiRequest(`/events/${enc}`, eventDetailSchema);
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

export async function patchEvent(
	id: string,
	body: Partial<CreateEventBody> & { published?: boolean },
) {
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

export function ticketQrImageUrl(publicCode: string): string {
	const enc = encodeURIComponent(publicCode);
	return `${getApiV1Prefix()}/tickets/${enc}/qr`;
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
