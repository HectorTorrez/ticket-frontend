import { expect, test } from "@playwright/test";

test.describe("Páginas públicas", () => {
	test("home carga y muestra navegación", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByRole("link", { name: /iniciar sesión|eventos|entradas/i }).first()).toBeVisible();
		await expect(page.locator("body")).toBeVisible();
	});

	test("catálogo de eventos carga", async ({ page }) => {
		await page.goto("/events/");
		await expect(
			page.getByRole("heading", { name: /eventos|próximos|catálogo/i }).or(
				page.getByText(/no hay eventos|próximos eventos|explorar/i),
			).first(),
		).toBeVisible({ timeout: 20_000 });
	});

	test("login y registro son accesibles", async ({ page }) => {
		await page.goto("/login/");
		await expect(page.getByRole("heading", { name: /bienvenido/i })).toBeVisible();
		await page.goto("/register/");
		await expect(
			page.getByRole("heading", { name: /crear|cuenta|registr/i }),
		).toBeVisible();
	});

	test("ruta admin sin sesión redirige fuera del dashboard", async ({
		page,
	}) => {
		await page.goto("/dashboard/");
		await expect(page).not.toHaveURL(/\/dashboard\/?$/);
	});

	test("mis entradas sin sesión redirige a login", async ({ page }) => {
		await page.goto("/my-tickets/");
		await expect(page).toHaveURL(/\/login/);
	});
});
