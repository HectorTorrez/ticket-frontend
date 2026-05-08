import type { ZodError, z } from "zod";
import { toApiError } from "#lib/api/errors";
import { authResponseSchema } from "#lib/api/schemas";
import { clearSession, getSession, setSession } from "#lib/auth/session";
import { getApiV1Prefix } from "#lib/env";

export type RequestOptions = Omit<RequestInit, "body"> & {
	body?: unknown;
	/** Skip Authorization header (auth endpoints, public GETs) */
	skipAuth?: boolean;
	/** Do not attempt refresh on 401 */
	noRefresh?: boolean;
	/** Expect binary response */
	parse?: "json" | "void" | "raw";
};

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
	if (refreshInFlight) return refreshInFlight;
	const session = getSession();
	if (!session?.refreshToken) return false;

	refreshInFlight = (async () => {
		try {
			const res = await fetch(`${getApiV1Prefix()}/auth/refresh`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ refreshToken: session.refreshToken }),
			});
			const text = await res.text();
			if (!res.ok) {
				clearSession();
				return false;
			}
			const json: unknown = text ? JSON.parse(text) : null;
			const parsed = authResponseSchema.safeParse(json);
			if (!parsed.success) {
				clearSession();
				return false;
			}
			setSession(parsed.data);
			return true;
		} catch {
			clearSession();
			return false;
		} finally {
			refreshInFlight = null;
		}
	})();

	return refreshInFlight;
}

function buildHeaders(opts: RequestOptions): Headers {
	const h = new Headers(opts.headers);
	if (
		!h.has("Content-Type") &&
		opts.body !== undefined &&
		!(opts.body instanceof FormData)
	) {
		h.set("Content-Type", "application/json");
	}
	if (!opts.skipAuth) {
		const session = getSession();
		if (session?.accessToken) {
			h.set("Authorization", `Bearer ${session.accessToken}`);
		}
	}
	return h;
}

function serializeBody(body: unknown): BodyInit | undefined {
	if (body === undefined) return undefined;
	if (body instanceof FormData) return body;
	if (
		typeof body === "string" ||
		body instanceof Blob ||
		body instanceof ArrayBuffer
	) {
		return body as BodyInit;
	}
	return JSON.stringify(body);
}

/** Many Nest APIs wrap entities as `{ data: T }`; public list routes may return `T` at the root. */
function unwrapResponseBody(body: unknown): unknown {
	if (body === null || body === undefined) return body;
	if (typeof body !== "object" || Array.isArray(body)) return body;
	const o = body as Record<string, unknown>;
	if ("data" in o) {
		return o.data;
	}
	return body;
}

function formatZodIssuesForError(err: ZodError, path: string): string {
	const detail = err.issues
		.map((i) => `${i.path.length ? i.path.join(".") : "(root)"}: ${i.message}`)
		.join("; ");
	return `Invalid API response for ${path} (${detail})`;
}

export async function apiRequest<T>(
	path: string,
	schema: z.ZodType<T>,
	opts: RequestOptions = {},
): Promise<T> {
	const parseMode = opts.parse ?? "json";
	const url = `${getApiV1Prefix()}${path.startsWith("/") ? path : `/${path}`}`;

	const exec = async (): Promise<T> => {
		const res = await fetch(url, {
			...opts,
			headers: buildHeaders(opts),
			body: serializeBody(opts.body),
		});

		if (parseMode === "raw") {
			return schema.parse(await res.blob()) as T;
		}

		if (parseMode === "void") {
			const text = await res.text();
			if (!res.ok) {
				let bodyJson: unknown = null;
				try {
					bodyJson = text ? JSON.parse(text) : null;
				} catch {
					bodyJson = null;
				}
				throw toApiError(res.status, bodyJson);
			}
			return schema.parse(text ? JSON.parse(text) : undefined) as T;
		}

		const text = await res.text();
		const bodyJson: unknown = text ? JSON.parse(text) : null;

		if (res.status === 401 && !opts.noRefresh && !opts.skipAuth) {
			const refreshed = await tryRefresh();
			if (refreshed) {
				return apiRequest(path, schema, { ...opts, noRefresh: true });
			}
		}

		if (!res.ok) {
			throw toApiError(res.status, bodyJson);
		}

		const toValidate = unwrapResponseBody(bodyJson);
		const parsed = schema.safeParse(toValidate);
		if (!parsed.success) {
			throw new Error(formatZodIssuesForError(parsed.error, path));
		}
		return parsed.data;
	};

	return exec();
}

export async function apiRequestUnsafe(
	path: string,
	opts: RequestOptions = {},
): Promise<Response> {
	return fetch(
		`${getApiV1Prefix()}${path.startsWith("/") ? path : `/${path}`}`,
		{
			...opts,
			headers: buildHeaders(opts),
			body: serializeBody(opts.body),
		},
	);
}
