import { redirect } from "@tanstack/react-router";

import { getSession, isAdmin, isCustomer } from "#lib/auth/session";

/** Auth from localStorage — must run on the client (routes use `ssr: false`). */
export function requireAuthRedirect(loginTo = "/login" as const) {
	const s = getSession();
	if (!s) {
		throw redirect({
			to: loginTo,
			search: { redirect: window.location.pathname + window.location.search },
		});
	}
}

export function requireCustomer() {
	const s = getSession();
	if (!s || !isCustomer(s)) {
		throw redirect({
			to: "/login",
			search: { redirect: window.location.pathname },
		});
	}
}

export function requireAdmin() {
	const s = getSession();
	if (!s || !isAdmin(s)) {
		throw redirect({ to: "/" });
	}
}
