export class ApiError extends Error {
	readonly statusCode: number;
	readonly code: string;
	readonly path?: string;
	readonly timestamp?: string;

	constructor(opts: {
		message: string;
		statusCode: number;
		code: string;
		path?: string;
		timestamp?: string;
	}) {
		super(opts.message);
		this.name = "ApiError";
		this.statusCode = opts.statusCode;
		this.code = opts.code;
		this.path = opts.path;
		this.timestamp = opts.timestamp;
	}
}

export type ApiErrorBody = {
	statusCode?: number;
	message?: string | string[];
	code?: string;
	path?: string;
	timestamp?: string;
};

const GENERIC_SERVER =
	"Algo salió mal en el servidor. Inténtalo de nuevo más tarde.";
const GENERIC_UNKNOWN = "Algo salió mal. Por favor, inténtalo de nuevo.";
const GENERIC_NETWORK =
	"No pudimos conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo en unos instantes.";

function isNetworkErrorMessage(message: string): boolean {
	const lower = message.toLowerCase();
	return (
		message === "Failed to fetch" ||
		lower.includes("failed to fetch") ||
		lower.includes("networkerror") ||
		lower.includes("load failed") ||
		message === "NetworkError when attempting to fetch resource."
	);
}

/** Detects messages that should never appear in UI toasts. */
export function looksTechnicalMessage(message: string): boolean {
	const trimmed = message.trim();
	if (!trimmed) return true;
	return (
		/https?:\/\//i.test(trimmed) ||
		/vite_[a-z0-9_]+/i.test(trimmed) ||
		/\.env\b/i.test(trimmed) ||
		/localhost:\d+/i.test(trimmed) ||
		/invalid api response/i.test(trimmed) ||
		/^http \d{3}$/i.test(trimmed) ||
		/\/api\/v\d+/i.test(trimmed) ||
		/\b(prisma|postgres|sql|stack trace|exception|econnrefused|enotfound|eai_again)\b/i.test(
			trimmed,
		) ||
		/\bat\s+\S+\.(tsx?|jsx?|mjs|cjs):\d+:\d+\b/.test(trimmed)
	);
}

function sanitizeApiErrorMessage(error: ApiError, fallback: string): string {
	if (error.statusCode >= 500) {
		return GENERIC_SERVER;
	}
	const msg = error.message.trim();
	if (looksTechnicalMessage(msg)) {
		return fallback;
	}
	return msg || fallback;
}

export function parseApiErrorBody(body: unknown): ApiErrorBody | null {
	if (!body || typeof body !== "object") return null;
	const b = body as Record<string, unknown>;
	if (typeof b.statusCode !== "number") return null;
	return {
		statusCode: b.statusCode,
		message: b.message as string | string[] | undefined,
		code: b.code as string | undefined,
		path: b.path as string | undefined,
		timestamp: b.timestamp as string | undefined,
	};
}

export function errorMessageFromBody(body: ApiErrorBody): string {
	const m = body.message;
	if (Array.isArray(m)) return m.join(", ");
	if (typeof m === "string") return m;
	return "La solicitud falló";
}

export function toApiError(status: number, body: unknown): ApiError {
	const parsed = parseApiErrorBody(body);
	if (parsed) {
		return new ApiError({
			message: errorMessageFromBody(parsed),
			statusCode: parsed.statusCode ?? status,
			code: parsed.code ?? "Error",
			path: parsed.path,
			timestamp: parsed.timestamp,
		});
	}
	return new ApiError({
		message: `HTTP ${status}`,
		statusCode: status,
		code: "Desconocido",
	});
}

/** Safe messages for toasts and inline UI — never exposes URLs, env vars, or server internals. */
export function getUserFacingErrorMessage(
	error: unknown,
	fallback: string = GENERIC_UNKNOWN,
): string {
	if (error instanceof ApiError) {
		return sanitizeApiErrorMessage(error, fallback);
	}
	if (error instanceof Error) {
		const msg = error.message;
		if (isNetworkErrorMessage(msg)) {
			if (import.meta.env.DEV) {
				console.error("[api] Network error:", error);
			}
			return GENERIC_NETWORK;
		}
		if (error.name === "AbortError") {
			return "La solicitud fue cancelada.";
		}
		if (looksTechnicalMessage(msg)) {
			if (import.meta.env.DEV) {
				console.error("[api] Technical error hidden from UI:", error);
			}
			return fallback;
		}
		return msg || fallback;
	}
	return fallback;
}
