const API_BASE =
	process.env.PLAYWRIGHT_API_URL ?? "http://localhost:3001";
const API_V1 = `${API_BASE}/api/v1`;

export const ADMIN_EMAIL =
	process.env.SEED_ADMIN_EMAIL ?? "admin@ticket-api.local";
export const ADMIN_PASSWORD =
	process.env.SEED_ADMIN_PASSWORD ?? "Admin123!ChangeMe";

export type AuthPayload = {
	accessToken: string;
	refreshToken: string;
	user: { id: string; email: string; role: "ADMIN" | "CUSTOMER" };
};

async function api<T>(
	path: string,
	init: RequestInit = {},
): Promise<{ status: number; body: T }> {
	const res = await fetch(`${API_V1}${path}`, {
		...init,
		headers: {
			"Content-Type": "application/json",
			...(init.headers ?? {}),
		},
	});
	const text = await res.text();
	const body = text ? (JSON.parse(text) as T) : (null as T);
	return { status: res.status, body };
}

export async function login(
	email: string,
	password: string,
): Promise<AuthPayload> {
	const { status, body } = await api<AuthPayload>("/auth/login", {
		method: "POST",
		body: JSON.stringify({ email, password }),
	});
	if (status >= 400) {
		throw new Error(`Login failed (${status}): ${JSON.stringify(body)}`);
	}
	return body;
}

export async function registerCustomer(
	email: string,
	password = "password123!",
): Promise<AuthPayload> {
	const { status, body } = await api<AuthPayload>("/auth/register", {
		method: "POST",
		body: JSON.stringify({ email, password }),
	});
	if (status >= 400) {
		throw new Error(`Register failed (${status}): ${JSON.stringify(body)}`);
	}
	return body;
}

export async function createPublishedEventWithTickets(adminToken: string) {
	const slug = `pw-${Date.now()}`;
	const title = `Playwright Event ${Date.now()}`;

	const created = await api<{ id: string; slug: string }>("/events", {
		method: "POST",
		headers: { Authorization: `Bearer ${adminToken}` },
		body: JSON.stringify({
			title,
			slug,
			description: "Evento de prueba E2E",
			venue: "Arena Playwright",
			startsAt: new Date(Date.now() + 864e5).toISOString(),
			endsAt: new Date(Date.now() + 2 * 864e5).toISOString(),
		}),
	});
	if (created.status >= 400) {
		throw new Error(`Create event failed: ${JSON.stringify(created.body)}`);
	}

	const eventId = created.body.id;
	const finalSlug = created.body.slug;

	const pub = await api(`/events/${eventId}/publish`, {
		method: "POST",
		headers: { Authorization: `Bearer ${adminToken}` },
	});
	if (pub.status >= 400) {
		throw new Error(`Publish failed: ${JSON.stringify(pub.body)}`);
	}

	const tt = await api<{ id: string; name: string }>(
		`/events/${eventId}/ticket-types`,
		{
			method: "POST",
			headers: { Authorization: `Bearer ${adminToken}` },
			body: JSON.stringify({
				tier: "GENERAL",
				name: "General",
				price: 15,
				quantity: 20,
			}),
		},
	);
	if (tt.status >= 400) {
		throw new Error(`Ticket type failed: ${JSON.stringify(tt.body)}`);
	}

	return {
		eventId,
		slug: finalSlug,
		title,
		ticketTypeId: tt.body.id,
		ticketTypeName: tt.body.name,
	};
}

export async function purchaseTicket(
	customerToken: string,
	ticketTypeId: string,
) {
	const order = await api<{ id: string; status: string }>("/orders", {
		method: "POST",
		headers: { Authorization: `Bearer ${customerToken}` },
		body: JSON.stringify({
			lines: [{ ticketTypeId, quantity: 1 }],
		}),
	});
	if (order.status >= 400) {
		throw new Error(`Order failed: ${JSON.stringify(order.body)}`);
	}

	const paid = await api<{ id: string; status: string }>(
		`/orders/${order.body.id}/mock-pay`,
		{
			method: "POST",
			headers: { Authorization: `Bearer ${customerToken}` },
			body: JSON.stringify({ outcome: "SUCCESS" }),
		},
	);
	if (paid.status >= 400 || paid.body.status !== "PAID") {
		throw new Error(`Pay failed: ${JSON.stringify(paid.body)}`);
	}

	const tickets = await api<{
		items: Array<{ publicCode: string }>;
	}>("/me/tickets", {
		headers: { Authorization: `Bearer ${customerToken}` },
	});
	if (tickets.status >= 400 || !tickets.body.items[0]?.publicCode) {
		throw new Error(`Tickets failed: ${JSON.stringify(tickets.body)}`);
	}

	return {
		orderId: paid.body.id,
		publicCode: tickets.body.items[0].publicCode,
	};
}
