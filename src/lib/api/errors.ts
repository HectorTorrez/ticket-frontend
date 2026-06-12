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

/** Mensajes visibles para el usuario en fallos de TanStack Query / fetch. */
export function getUserFacingErrorMessage(error: unknown): string {
	if (error instanceof ApiError) {
		return error.message;
	}
	if (error instanceof Error) {
		const msg = error.message;
		const lower = msg.toLowerCase();
		if (
			msg === "Failed to fetch" ||
			lower.includes("failed to fetch") ||
			lower.includes("networkerror") ||
			lower.includes("load failed") ||
			msg === "NetworkError when attempting to fetch resource."
		) {
			if (import.meta.env.DEV) {
				return "No pudimos conectar con el servidor. Comprueba que el backend esté en ejecución y que VITE_API_BASE_URL en .env apunte a la URL correcta.";
			}
			return "No pudimos conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo en unos instantes.";
		}
		if (error.name === "AbortError") {
			return "La solicitud fue cancelada.";
		}
		return msg;
	}
	return "Algo salió mal. Por favor, inténtalo de nuevo.";
}
