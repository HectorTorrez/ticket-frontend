import { expect, test } from "@playwright/test";
import {
	ADMIN_EMAIL,
	ADMIN_PASSWORD,
	createPublishedEventWithTickets,
	login,
	registerCustomer,
} from "./helpers/api";
import { injectSession } from "./helpers/auth";

test.describe("Cliente — compra de entradas", () => {
	test("flujo completo: ver evento → reservar → pagar → ver pedido y pase", async ({
		page,
	}) => {
		const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
		const event = await createPublishedEventWithTickets(admin.accessToken);
		const email = `buyer_${Date.now()}@e2e.local`;
		const customer = await registerCustomer(email);

		await injectSession(page, customer);
		await page.goto(`/events/${event.slug}/`);
		await expect(
			page.getByRole("heading", { name: event.title }),
		).toBeVisible({ timeout: 20_000 });
		await page
			.getByRole("button", { name: /aumentar cantidad de general/i })
			.click();
		await page.getByRole("button", { name: /continuar al pago/i }).click();

		await expect(page).toHaveURL(new RegExp(`/events/${event.slug}/checkout`));
		await expect(page.getByText(/reserva confirmada|reservando/i)).toBeVisible({
			timeout: 20_000,
		});
		await expect(
			page.getByRole("button", { name: /completar pago/i }),
		).toBeVisible({ timeout: 20_000 });
		await page.getByRole("button", { name: /completar pago/i }).click();

		await expect(page).toHaveURL(/\/my-orders\//, { timeout: 20_000 });
		await expect(page.getByText(/pagad|paid|complet/i).first()).toBeVisible({
			timeout: 15_000,
		});

		await page.goto("/my-tickets/");
		await expect(page.getByText(event.title)).toBeVisible({ timeout: 20_000 });
		await expect(
			page.getByRole("img", { name: new RegExp(`código qr.*${event.title}`, "i") }),
		).toBeVisible({ timeout: 15_000 });
		await expect(
			page.getByRole("link", { name: /ver pase completo/i }),
		).toBeVisible();

		await page.goto("/my-orders/");
		await expect(
			page.getByText(event.title).or(page.getByText(/pedido|orden|pagado/i)).first(),
		).toBeVisible();
	});

	test("checkout sin sesión redirige a login", async ({ page }) => {
		const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
		const event = await createPublishedEventWithTickets(admin.accessToken);

		await page.goto(`/events/${event.slug}/`);
		await page
			.getByRole("button", { name: /aumentar cantidad de general/i })
			.click();
		await page.getByRole("button", { name: /continuar al pago/i }).click();
		await expect(page).toHaveURL(/\/login/);
	});

	test("enlace Ver pase completo abre /check/:code", async ({ page }) => {
		const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
		const event = await createPublishedEventWithTickets(admin.accessToken);
		const customer = await registerCustomer(`pub_${Date.now()}@e2e.local`);

		await injectSession(page, customer);
		await page.goto(`/events/${event.slug}/`);
		await page
			.getByRole("button", { name: /aumentar cantidad de general/i })
			.click();
		await page.getByRole("button", { name: /continuar al pago/i }).click();
		await expect(
			page.getByRole("button", { name: /completar pago/i }),
		).toBeVisible({ timeout: 25_000 });
		await page.getByRole("button", { name: /completar pago/i }).click();
		await expect(page).toHaveURL(/\/my-orders\//, { timeout: 25_000 });

		await page.goto("/my-tickets/");
		await page.getByRole("link", { name: /ver pase completo/i }).click();
		await expect(page).toHaveURL(/\/check\//);
		await expect(page.getByText(event.title)).toBeVisible({ timeout: 15_000 });
	});
});
