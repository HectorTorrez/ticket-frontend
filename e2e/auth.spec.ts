import { expect, test } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, registerCustomer } from "./helpers/api";
import { loginViaUi } from "./helpers/auth";

test.describe("Autenticación", () => {
	test("admin inicia sesión y llega al dashboard", async ({ page }) => {
		await loginViaUi(page, ADMIN_EMAIL, ADMIN_PASSWORD);
		await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
		await expect(
			page.getByRole("heading", { name: /resumen|dashboard|panel/i }).or(
				page.getByText(/eventos|pedidos|escáner|scanner|control/i),
			).first(),
		).toBeVisible({ timeout: 20_000 });
	});

	test("cliente se registra por UI y llega al home", async ({ page }) => {
		const email = `ui_reg_${Date.now()}@e2e.local`;
		await page.goto("/register/");
		await page.getByLabel(/correo electrónico/i).fill(email);
		await page.getByLabel(/contraseña/i).fill("password123!");
		await page.getByRole("button", { name: /crear cuenta|registr/i }).click();
		await expect(page).toHaveURL(/\/($|\?)/, { timeout: 20_000 });
	});

	test("credenciales inválidas muestran error", async ({ page }) => {
		await loginViaUi(page, "nobody@e2e.local", "wrongpass1");
		await expect(page.getByText(/incorrect|inválid|no se pudo|credencial|unauthorized|401/i).or(
			page.locator("[data-sonner-toast]"),
		).first()).toBeVisible({ timeout: 15_000 });
		await expect(page).toHaveURL(/\/login/);
	});

	test("cliente no puede entrar al dashboard", async ({ page }) => {
		const email = `deny_${Date.now()}@e2e.local`;
		const auth = await registerCustomer(email);
		await page.addInitScript(
			([key, session]) => {
				localStorage.setItem(key, JSON.stringify(session));
			},
			["ticket-platform-auth-v1", auth] as const,
		);
		await page.goto("/dashboard/");
		await expect(page).not.toHaveURL(/\/dashboard/);
	});
});
