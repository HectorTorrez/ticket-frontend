import { describe, expect, it } from "vitest";
import { normalizeTicketCode, ticketCheckUrl } from "./ticket-code";

describe("normalizeTicketCode", () => {
	it("returns trimmed raw codes", () => {
		expect(normalizeTicketCode("  ABC12345  ")).toBe("ABC12345");
	});

	it("extracts code from /check/:code URLs", () => {
		expect(
			normalizeTicketCode("http://localhost:3000/check/my-code-99"),
		).toBe("my-code-99");
		expect(
			normalizeTicketCode("https://tickets.example/check/enc%20oded/"),
		).toBe("enc oded");
	});

	it("leaves unrelated URLs unchanged", () => {
		expect(normalizeTicketCode("https://example.com/other/path")).toBe(
			"https://example.com/other/path",
		);
	});
});

describe("ticketCheckUrl", () => {
	it("builds check URL with encoded code", () => {
		expect(ticketCheckUrl("a/b", "http://localhost:3000/")).toBe(
			"http://localhost:3000/check/a%2Fb",
		);
	});
});
