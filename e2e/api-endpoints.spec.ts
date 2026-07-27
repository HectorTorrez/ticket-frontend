import { expect, test } from "@playwright/test";
import {
	ADMIN_EMAIL,
	ADMIN_PASSWORD,
	createPublishedEventWithTickets,
	login,
	purchaseTicket,
	registerCustomer,
} from "./helpers/api";

const API_BASE = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:3001";
const API_V1 = `${API_BASE}/api/v1`;

async function api(
	path: string,
	init: RequestInit = {},
): Promise<{ status: number; body: unknown }> {
	const res = await fetch(`${API_V1}${path}`, {
		...init,
		headers: {
			"Content-Type": "application/json",
			...(init.headers ?? {}),
		},
	});
	const text = await res.text();
	return { status: res.status, body: text ? JSON.parse(text) : null };
}

test.describe("API endpoints", () => {
	test("health y ready responden ok", async () => {
		const health = await api("/health");
		expect(health.status).toBe(200);
		expect(health.body).toMatchObject({ status: "ok" });

		const ready = await api("/health/ready");
		expect(ready.status).toBe(200);
	});

	test("auth: register, login, refresh, logout y denegaciones", async () => {
		const email = `api_auth_${Date.now()}@e2e.local`;
		const password = "password123!";

		const registered = await api("/auth/register", {
			method: "POST",
			body: JSON.stringify({ email, password }),
		});
		expect(registered.status).toBeLessThan(400);
		const regBody = registered.body as {
			accessToken: string;
			refreshToken: string;
			user: { role: string; email: string };
		};
		expect(regBody.user.role).toBe("CUSTOMER");
		expect(regBody.user.email).toBe(email);

		const badLogin = await api("/auth/login", {
			method: "POST",
			body: JSON.stringify({ email, password: "wrong-password!" }),
		});
		expect(badLogin.status).toBeGreaterThanOrEqual(400);

		const loggedIn = await api("/auth/login", {
			method: "POST",
			body: JSON.stringify({ email, password }),
		});
		expect(loggedIn.status).toBeLessThan(400);
		const tokens = loggedIn.body as {
			accessToken: string;
			refreshToken: string;
		};

		const refreshed = await api("/auth/refresh", {
			method: "POST",
			body: JSON.stringify({ refreshToken: tokens.refreshToken }),
		});
		expect(refreshed.status).toBeLessThan(400);

		const logout = await api("/auth/logout", {
			method: "POST",
			body: JSON.stringify({ refreshToken: tokens.refreshToken }),
		});
		expect(logout.status).toBeLessThan(400);
	});

	test("público: catálogo y detalle de evento publicado", async () => {
		const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
		const event = await createPublishedEventWithTickets(admin.accessToken);

		const catalog = await api(
			`/events?publishedOnly=true&q=${encodeURIComponent(event.slug)}`,
		);
		expect(catalog.status).toBe(200);
		const items = (catalog.body as { items: Array<{ slug: string }> }).items;
		expect(items.some((e) => e.slug === event.slug)).toBe(true);

		const detail = await api(`/events/${event.slug}`);
		expect(detail.status).toBe(200);
		expect(detail.body).toMatchObject({ slug: event.slug, title: event.title });

		const unauthCreate = await api("/events", {
			method: "POST",
			body: JSON.stringify({
				title: "No debería crearse",
				slug: `deny-${Date.now()}`,
				startsAt: new Date(Date.now() + 864e5).toISOString(),
			}),
		});
		expect(unauthCreate.status).toBe(401);
	});

	test("admin: dashboard, eventos, pedidos y ticket types", async () => {
		const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
		const auth = { Authorization: `Bearer ${admin.accessToken}` };

		const summary = await api("/dashboard/summary", { headers: auth });
		expect(summary.status).toBe(200);

		const adminEvents = await api("/admin/events", { headers: auth });
		expect(adminEvents.status).toBe(200);

		const event = await createPublishedEventWithTickets(admin.accessToken);
		const one = await api(`/admin/events/${event.eventId}`, { headers: auth });
		expect(one.status).toBe(200);

		const orders = await api("/admin/orders", { headers: auth });
		expect(orders.status).toBe(200);

		const unpublish = await api(`/events/${event.eventId}/unpublish`, {
			method: "POST",
			headers: auth,
		});
		expect(unpublish.status).toBeLessThan(400);

		const publish = await api(`/events/${event.eventId}/publish`, {
			method: "POST",
			headers: auth,
		});
		expect(publish.status).toBeLessThan(400);
	});

	test("cliente: pedido, pago, mis tickets/órdenes y check público", async () => {
		const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
		const event = await createPublishedEventWithTickets(admin.accessToken);
		const customer = await registerCustomer(`api_buy_${Date.now()}@e2e.local`);
		const auth = { Authorization: `Bearer ${customer.accessToken}` };

		const anonymousOrder = await api("/orders", {
			method: "POST",
			body: JSON.stringify({
				lines: [{ ticketTypeId: event.ticketTypeId, quantity: 1 }],
			}),
		});
		expect(anonymousOrder.status).toBe(401);

		const order = await api("/orders", {
			method: "POST",
			headers: auth,
			body: JSON.stringify({
				lines: [{ ticketTypeId: event.ticketTypeId, quantity: 1 }],
			}),
		});
		expect(order.status).toBeLessThan(400);
		const orderId = (order.body as { id: string; status: string }).id;
		expect((order.body as { status: string }).status).toBe("PENDING");

		const paid = await api(`/orders/${orderId}/mock-pay`, {
			method: "POST",
			headers: auth,
			body: JSON.stringify({ outcome: "SUCCESS" }),
		});
		expect(paid.status).toBeLessThan(400);
		expect((paid.body as { status: string }).status).toBe("PAID");

		const myOrders = await api("/me/orders", { headers: auth });
		expect(myOrders.status).toBe(200);

		const myOrder = await api(`/me/orders/${orderId}`, { headers: auth });
		expect(myOrder.status).toBe(200);

		const tickets = await api("/me/tickets", { headers: auth });
		expect(tickets.status).toBe(200);
		const list = tickets.body as Array<{ publicCode: string }>;
		expect(list.length).toBeGreaterThan(0);
		const code = list[0].publicCode;

		const publicTicket = await api(`/tickets/${code}`);
		expect(publicTicket.status).toBe(200);

		const qrRes = await fetch(`${API_V1}/tickets/${code}/qr`);
		expect(qrRes.status).toBe(200);
		expect(qrRes.headers.get("content-type")).toMatch(/image\/png/);
	});

	test("QR validate: válida → ya usada; customer no puede validar", async () => {
		const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
		const event = await createPublishedEventWithTickets(admin.accessToken);
		const customer = await registerCustomer(`api_qr_${Date.now()}@e2e.local`);
		const { publicCode } = await purchaseTicket(
			customer.accessToken,
			event.ticketTypeId,
		);

		const denyCustomer = await api("/qr/validate", {
			method: "POST",
			headers: { Authorization: `Bearer ${customer.accessToken}` },
			body: JSON.stringify({ code: publicCode }),
		});
		expect(denyCustomer.status).toBe(403);

		const denyAnon = await api("/qr/validate", {
			method: "POST",
			body: JSON.stringify({ code: publicCode }),
		});
		expect(denyAnon.status).toBe(401);

		const first = await api("/qr/validate", {
			method: "POST",
			headers: { Authorization: `Bearer ${admin.accessToken}` },
			body: JSON.stringify({ code: publicCode }),
		});
		expect(first.status).toBeLessThan(300);
		expect(first.body).toMatchObject({ result: "VALID" });

		const second = await api("/qr/validate", {
			method: "POST",
			headers: { Authorization: `Bearer ${admin.accessToken}` },
			body: JSON.stringify({ code: publicCode }),
		});
		expect(second.status).toBeLessThan(300);
		expect(second.body).toMatchObject({ result: "ALREADY_USED" });
	});

	test("autorización: customer no accede a admin", async () => {
		const customer = await registerCustomer(`api_deny_${Date.now()}@e2e.local`);
		const auth = { Authorization: `Bearer ${customer.accessToken}` };

		const summary = await api("/dashboard/summary", { headers: auth });
		expect(summary.status).toBe(403);

		const adminEvents = await api("/admin/events", { headers: auth });
		expect(adminEvents.status).toBe(403);

		const adminOrders = await api("/admin/orders", { headers: auth });
		expect(adminOrders.status).toBe(403);
	});
});
