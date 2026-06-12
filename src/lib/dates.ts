export function parseSearchDate(value?: string): Date | undefined {
	if (!value) return undefined;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : date;
}

export function parseLocalDateTime(value: string): Date | undefined {
	if (!value) return undefined;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : date;
}

export function toLocalDateTimeInput(date: Date): string {
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toFilterFromDate(date: Date): string {
	const copy = new Date(date);
	copy.setHours(0, 0, 0, 0);
	return copy.toISOString();
}

export function toFilterToDate(date: Date): string {
	const copy = new Date(date);
	copy.setHours(23, 59, 59, 999);
	return copy.toISOString();
}
