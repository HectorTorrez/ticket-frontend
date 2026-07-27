import type { Page } from "@playwright/test";
import type { AuthPayload } from "./api";

const STORAGE_KEY = "ticket-platform-auth-v1";

/** Inject auth session before navigating (avoids flaky login when testing other flows). */
export async function injectSession(page: Page, auth: AuthPayload) {
	await page.addInitScript(
		([key, session]) => {
			localStorage.setItem(key, JSON.stringify(session));
		},
		[STORAGE_KEY, auth] as const,
	);
}

export async function loginViaUi(
	page: Page,
	email: string,
	password: string,
) {
	await page.goto("/login/");
	await page.getByLabel(/correo electrónico/i).fill(email);
	await page.getByLabel(/contraseña/i).fill(password);
	await page.getByRole("button", { name: /iniciar sesión/i }).click();
}
