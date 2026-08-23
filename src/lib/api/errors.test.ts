import { describe, expect, it } from "vitest";
import {
	ApiError,
	errorMessageFromBody,
	getUserFacingErrorMessage,
	looksTechnicalMessage,
	parseApiErrorBody,
	toApiError,
} from "./errors";

describe("API error helpers", () => {
	it("parseApiErrorBody rejects non-objects", () => {
		expect(parseApiErrorBody(null)).toBeNull();
		expect(parseApiErrorBody("x")).toBeNull();
		expect(parseApiErrorBody({ message: "no status" })).toBeNull();
	});

	it("joins array messages", () => {
		expect(
			errorMessageFromBody({
				statusCode: 400,
				message: ["A", "B"],
			}),
		).toBe("A, B");
	});

	it("toApiError builds ApiError from body", () => {
		const err = toApiError(409, {
			statusCode: 409,
			message: "Conflict",
			code: "Conflict",
		});
		expect(err).toBeInstanceOf(ApiError);
		expect(err.statusCode).toBe(409);
		expect(err.message).toBe("Conflict");
	});

	it("getUserFacingErrorMessage shows safe 4xx ApiError messages", () => {
		expect(
			getUserFacingErrorMessage(
				new ApiError({
					message: "No autorizado",
					statusCode: 401,
					code: "Unauthorized",
				}),
			),
		).toBe("No autorizado");
	});

	it("getUserFacingErrorMessage hides 5xx details", () => {
		expect(
			getUserFacingErrorMessage(
				new ApiError({
					message: "PrismaClientKnownRequestError at /api/v1/events",
					statusCode: 500,
					code: "ERROR_INTERNO",
				}),
			),
		).toBe("Algo salió mal en el servidor. Inténtalo de nuevo más tarde.");
	});

	it("getUserFacingErrorMessage hides technical generic errors", () => {
		expect(
			getUserFacingErrorMessage(
				new Error("Invalid API response for /events (id: Required)"),
			),
		).toBe("Algo salió mal. Por favor, inténtalo de nuevo.");
		expect(getUserFacingErrorMessage(new Error("Failed to fetch"))).toBe(
			"No pudimos conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo en unos instantes.",
		);
	});

	it("getUserFacingErrorMessage uses fallback for unknown values", () => {
		expect(getUserFacingErrorMessage("weird")).toBe(
			"Algo salió mal. Por favor, inténtalo de nuevo.",
		);
		expect(getUserFacingErrorMessage("weird", "Custom")).toBe("Custom");
	});

	it("looksTechnicalMessage detects env and URL leaks", () => {
		expect(looksTechnicalMessage("Comprueba VITE_API_BASE_URL en .env")).toBe(
			true,
		);
		expect(looksTechnicalMessage("http://localhost:3001/api/v1")).toBe(true);
		expect(looksTechnicalMessage("Credenciales incorrectas")).toBe(false);
	});
});
