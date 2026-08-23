import { expect, test } from "@playwright/test";
import {
	ADMIN_EMAIL,
	ADMIN_PASSWORD,
	createPublishedEventWithTickets,
	login,
	purchaseTicket,
	registerCustomer,
} from "./helpers/api";
import { injectSession, loginViaUi, mockQrCameraScan } from "./helpers/auth";

test.describe("Admin", () => {
	test("dashboard, eventos y pedidos son visibles", async ({ page }) => {
		const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
		await injectSession(page, admin);
		await page.goto("/dashboard/");
		await expect(page).toHaveURL(/\/dashboard/);

		await page.goto("/dashboard/events/");
		await expect(
			page.getByRole("heading", { name: /eventos/i }),
		).toBeVisible();

		await page.goto("/dashboard/orders/");
		await expect(
			page.getByRole("heading", { name: /pedidos|órdenes|orders/i }),
		).toBeVisible();

		await page.goto("/dashboard/scanner/");
		await expect(
			page.getByRole("heading", { name: /control de acceso/i }),
		).toBeVisible();
		await expect(page.getByLabel(/código del pase/i)).toBeVisible();

		await page.goto("/dashboard/users/");
		await expect(
			page.getByRole("heading", { name: /usuarios/i }),
		).toBeVisible();
		await expect(page.getByText(ADMIN_EMAIL)).toBeVisible();
	});

	test("lista un cliente y restablece su contraseña", async ({ page }) => {
		const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
		const email = `users_${Date.now()}@e2e.local`;
		await registerCustomer(email);
		await injectSession(page, admin);

		await page.goto("/dashboard/users/");
		await page.getByLabel(/^correo$/i).fill(email);
		await page.getByRole("button", { name: /aplicar/i }).click();
		await expect(page.getByText(email).first()).toBeVisible();

		await page
			.getByRole("button", { name: new RegExp(`acciones para ${email}`, "i") })
			.first()
			.click();
		await page.getByRole("menuitem", { name: /restablecer contraseña/i }).click();
		await expect(
			page.getByRole("heading", { name: /contraseña temporal/i }),
		).toBeVisible({ timeout: 15_000 });
		await expect(page.getByText(email)).toBeVisible();
	});

	test("crea un administrador y muestra la contraseña temporal", async ({
		page,
	}) => {
		const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
		const email = `admin_${Date.now()}@e2e.local`;
		await injectSession(page, admin);

		await page.goto("/dashboard/users/");
		await page.getByRole("button", { name: /nuevo administrador/i }).click();
		await page.getByLabel(/correo del administrador/i).fill(email);
		await page.getByRole("button", { name: /^crear administrador$/i }).click();
		await expect(
			page.getByRole("heading", { name: /administrador creado/i }),
		).toBeVisible({ timeout: 15_000 });
		await expect(page.getByText(email)).toBeVisible();
	});

	test("edita el evento publicado creado vía API", async ({ page }) => {
		const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
		const event = await createPublishedEventWithTickets(admin.accessToken);
		await injectSession(page, admin);

		await page.goto(`/dashboard/events/${event.eventId}/edit`);
		await expect(
			page.getByRole("heading", { name: /editar evento/i }),
		).toBeVisible();
		await expect(page.getByText("Visible en el catálogo")).toBeVisible();
		await expect(
			page.getByRole("button", { name: new RegExp(event.ticketTypeName, "i") }),
		).toBeVisible();
		await expect(page.getByLabel(/título/i)).toHaveValue(event.title);
	});

	test("escáner valida un código de entrada comprada", async ({ page }) => {
		const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
		const event = await createPublishedEventWithTickets(admin.accessToken);
		const customer = await registerCustomer(`scan_${Date.now()}@e2e.local`);
		const { publicCode } = await purchaseTicket(
			customer.accessToken,
			event.ticketTypeId,
		);

		await injectSession(page, admin);
		await page.goto("/dashboard/scanner/");
		await page.getByLabel(/código del pase/i).fill(publicCode);
		await page.getByRole("button", { name: /^validar$/i }).click();
		await expect(page.getByText(/pase válido/i)).toBeVisible({
			timeout: 15_000,
		});

		await page
			.getByRole("button", { name: /escanear siguiente pase/i })
			.click();
		await page.getByRole("button", { name: /^validar$/i }).click();
		await expect(page.getByText(/ya fue usada/i)).toBeVisible({
			timeout: 15_000,
		});
	});

	test("escáner con cámara valida el enlace del QR", async ({ page, baseURL }) => {
		const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
		const event = await createPublishedEventWithTickets(admin.accessToken);
		const customer = await registerCustomer(`cam_${Date.now()}@e2e.local`);
		const { publicCode } = await purchaseTicket(
			customer.accessToken,
			event.ticketTypeId,
		);
		const origin = (baseURL ?? "http://localhost:3000").replace(/\/$/, "");
		const qrPayload = `${origin}/check/${publicCode}`;

		await injectSession(page, admin);
		await mockQrCameraScan(page, qrPayload);
		await page.goto("/dashboard/scanner/");
		await page.getByRole("button", { name: /escanear con cámara/i }).click();
		await expect(page.getByText(/pase válido/i)).toBeVisible({
			timeout: 15_000,
		});
		await expect(page.getByLabel(/código del pase/i)).toHaveValue(publicCode);
	});

	test("admin puede abrir formulario de crear evento", async ({ page }) => {
		await loginViaUi(page, ADMIN_EMAIL, ADMIN_PASSWORD);
		await expect(page).toHaveURL(/\/dashboard/);
		await page.goto("/dashboard/events/create");
		await expect(
			page.getByRole("heading", { name: /crear evento/i }),
		).toBeVisible();
		await expect(page.getByText(/título/i).first()).toBeVisible();
	});
});
