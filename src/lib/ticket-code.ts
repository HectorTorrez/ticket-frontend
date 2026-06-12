/** Extract publicCode from a check-in URL or return the raw code. */
export function normalizeTicketCode(input: string): string {
	const trimmed = input.trim();
	try {
		const url = new URL(trimmed);
		const match = url.pathname.match(/\/check\/([^/]+)\/?$/);
		if (match?.[1]) return decodeURIComponent(match[1]);
	} catch {
		// Not a URL.
	}
	return trimmed;
}

/** Build the public check-in URL for a ticket (used in QR payloads). */
export function ticketCheckUrl(
	publicCode: string,
	origin = typeof window !== "undefined" ? window.location.origin : "",
): string {
	const base = origin.replace(/\/$/, "");
	return `${base}/check/${encodeURIComponent(publicCode)}`;
}
