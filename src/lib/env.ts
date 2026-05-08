export function getApiBaseUrl(): string {
	const raw = import.meta.env.VITE_API_BASE_URL;
	if (!raw || typeof raw !== "string") {
		return "http://localhost:3001";
	}
	return raw.replace(/\/$/, "");
}

export function getApiV1Prefix(): string {
	return `${getApiBaseUrl()}/api/v1`;
}

export function getSocketPath(): string {
	const p = import.meta.env.VITE_SOCKET_PATH;
	return typeof p === "string" && p.length > 0 ? p : "/socket.io";
}
