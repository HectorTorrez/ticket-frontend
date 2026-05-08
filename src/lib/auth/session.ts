import type { User } from "#lib/api/schemas";

const STORAGE_KEY = "ticket-platform-auth-v1";

export type PersistedSession = {
	accessToken: string;
	refreshToken: string;
	user: User;
};

function canUseStorage(): boolean {
	return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function getSession(): PersistedSession | null {
	if (!canUseStorage()) return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const data = JSON.parse(raw) as PersistedSession;
		if (
			data &&
			typeof data.accessToken === "string" &&
			typeof data.refreshToken === "string" &&
			data.user &&
			typeof data.user.id === "string"
		) {
			return data;
		}
		return null;
	} catch {
		return null;
	}
}

export function setSession(session: PersistedSession): void {
	if (!canUseStorage()) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
	if (!canUseStorage()) return;
	localStorage.removeItem(STORAGE_KEY);
}

export function isAdmin(session: PersistedSession | null): boolean {
	return session?.user.role === "ADMIN";
}

export function isCustomer(session: PersistedSession | null): boolean {
	return session?.user.role === "CUSTOMER";
}
