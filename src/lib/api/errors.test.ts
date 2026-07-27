import { describe, expect, it } from "vitest";
import {
	ApiError,
	errorMessageFromBody,
	getUserFacingErrorMessage,
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

	it("getUserFacingErrorMessage prefers ApiError message", () => {
		expect(
			getUserFacingErrorMessage(
				new ApiError({
					message: "No autorizado",
					statusCode: 401,
					code: "Unauthorized",
				}),
			),
		).toBe("No autorizado");
		expect(getUserFacingErrorMessage("weird")).toBe(
			"Algo salió mal. Por favor, inténtalo de nuevo.",
		);
	});
});
