import { redirect } from "@tanstack/react-router";

import { getSession, isAdmin, isCustomer } from "#lib/auth/session";

function isBrowser(): boolean {
	return typeof window !== "undefined";
}

export function requireAuthRedirect(loginTo = "/login" as const) {
	if (!isBrowser()) return;
	const s = getSession();
	if (!s) {
		throw redirect({
			to: loginTo,
			search: { redirect: window.location.pathname + window.location.search },
		});
	}
}

export function requireCustomer() {
	if (!isBrowser()) return;
	const s = getSession();
	if (!s || !isCustomer(s)) {
		throw redirect({
			to: "/login",
			search: { redirect: window.location.pathname },
		});
	}
}

export function requireAdmin() {
	if (!isBrowser()) return;
	const s = getSession();
	if (!s || !isAdmin(s)) {
		throw redirect({ to: "/" });
	}
}
