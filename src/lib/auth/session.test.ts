import { afterEach, describe, expect, it } from "vitest";
import {
	clearSession,
	getSession,
	isAdmin,
	isCustomer,
	setSession,
	type PersistedSession,
} from "./session";

const sample: PersistedSession = {
	accessToken: "access",
	refreshToken: "refresh",
	user: {
		id: "u1",
		email: "a@b.com",
		role: "CUSTOMER",
	},
};

describe("auth session", () => {
	afterEach(() => {
		clearSession();
	});

	it("round-trips session in localStorage", () => {
		expect(getSession()).toBeNull();
		setSession(sample);
		expect(getSession()).toEqual(sample);
		clearSession();
		expect(getSession()).toBeNull();
	});

	it("rejects malformed payloads", () => {
		localStorage.setItem("ticket-platform-auth-v1", "{not-json");
		expect(getSession()).toBeNull();
		localStorage.setItem(
			"ticket-platform-auth-v1",
			JSON.stringify({ accessToken: "x" }),
		);
		expect(getSession()).toBeNull();
	});

	it("role helpers", () => {
		expect(isCustomer(sample)).toBe(true);
		expect(isAdmin(sample)).toBe(false);
		expect(
			isAdmin({
				...sample,
				user: { ...sample.user, role: "ADMIN" },
			}),
		).toBe(true);
		expect(isAdmin(null)).toBe(false);
	});
});
