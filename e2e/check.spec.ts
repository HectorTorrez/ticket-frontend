import { expect, test } from "@playwright/test";
import {
	ADMIN_EMAIL,
	ADMIN_PASSWORD,
	createPublishedEventWithTickets,
	login,
	purchaseTicket,
	registerCustomer,
} from "./helpers/api";
import { injectSession } from "./helpers/auth";

test.describe("Página /check — acceso de organizador", () => {
	test("guest: enlace lleva a login con redirect al pase", async ({ page }) => {
		const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
		const event = await createPublishedEventWithTickets(admin.accessToken);
		const customer = await registerCustomer(`chk_anon_${Date.now()}@e2e.local`);
		const { publicCode } = await purchaseTicket(
			customer.accessToken,
			event.ticketTypeId,
		);

		await page.goto(`/check/${publicCode}`);
		await expect(
			page.getByRole("heading", { name: /verificación de entrada/i }),
		).toBeVisible({ timeout: 15_000 });

		await page
			.getByRole("link", { name: /inicia sesión como organizador/i })
			.click();

		await expect(page).toHaveURL(/\/login/);
		await expect(page).toHaveURL(new RegExp(`redirect=.*${publicCode}`));
		await expect(
			page.getByRole("heading", { name: /bienvenido de nuevo/i }),
		).toBeVisible();
	});

	test("cliente logueado: no muestra enlace de organizador", async ({
		page,
	}) => {
		const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
		const event = await createPublishedEventWithTickets(admin.accessToken);
		const customer = await registerCustomer(`chk_cust_${Date.now()}@e2e.local`);
		const { publicCode } = await purchaseTicket(
			customer.accessToken,
			event.ticketTypeId,
		);

		await injectSession(page, customer);
		await page.goto(`/check/${publicCode}`);
		await expect(
			page.getByRole("heading", { name: /verificación de entrada/i }),
		).toBeVisible({ timeout: 15_000 });
		await expect(
			page.getByText(/presenta este pase en la entrada/i),
		).toBeVisible();
		await expect(
			page.getByRole("link", { name: /inicia sesión como organizador/i }),
		).toHaveCount(0);
		await expect(page.getByText(/personal del evento/i)).toHaveCount(0);
	});

	test("admin: no muestra enlace; sí panel de validación", async ({ page }) => {
		const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
		const event = await createPublishedEventWithTickets(admin.accessToken);
		const customer = await registerCustomer(`chk_adm_${Date.now()}@e2e.local`);
		const { publicCode } = await purchaseTicket(
			customer.accessToken,
			event.ticketTypeId,
		);

		await injectSession(page, admin);
		await page.goto(`/check/${publicCode}`);
		await expect(
			page.getByRole("heading", { name: /verificación de entrada/i }),
		).toBeVisible({ timeout: 15_000 });
		await expect(page.getByText(/personal autorizado/i)).toBeVisible();
		await expect(
			page.getByRole("button", { name: /confirmar entrada/i }),
		).toBeVisible();
		await expect(
			page.getByRole("link", { name: /inicia sesión como organizador/i }),
		).toHaveCount(0);
		await expect(page.getByText(/personal del evento/i)).toHaveCount(0);
	});
});
