import { describe, expect, it } from "vitest";
import {
	parseLocalDateTime,
	parseSearchDate,
	toFilterFromDate,
	toFilterToDate,
	toLocalDateTimeInput,
} from "./dates";

describe("dates helpers", () => {
	it("parseSearchDate / parseLocalDateTime handle empty and invalid", () => {
		expect(parseSearchDate()).toBeUndefined();
		expect(parseSearchDate("not-a-date")).toBeUndefined();
		expect(parseLocalDateTime("")).toBeUndefined();
		expect(parseLocalDateTime("2026-07-27T18:30")).toBeInstanceOf(Date);
	});

	it("toLocalDateTimeInput formats without seconds", () => {
		const d = new Date(2026, 6, 27, 9, 5, 0);
		expect(toLocalDateTimeInput(d)).toBe("2026-07-27T09:05");
	});

	it("filter helpers set start/end of day", () => {
		const d = new Date(2026, 6, 27, 15, 0, 0);
		const from = new Date(toFilterFromDate(d));
		const to = new Date(toFilterToDate(d));
		expect(from.getHours()).toBe(0);
		expect(from.getMinutes()).toBe(0);
		expect(to.getHours()).toBe(23);
		expect(to.getMinutes()).toBe(59);
	});
});
