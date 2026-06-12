/** Etiquetas en español para valores devueltos por el servidor */
export const orderStatusLabel: Record<string, string> = {
	PENDING: "Pendiente",
	PAID: "Pagado",
	FAILED: "Fallido",
	EXPIRED: "Expirado",
	CANCELLED: "Cancelado",
};

export const ticketStatusLabel: Record<string, string> = {
	ACTIVE: "Activa",
	USED: "Usada",
	CANCELLED: "Cancelada",
};

export const ticketTierLabel: Record<string, string> = {
	GENERAL: "General",
	VIP: "VIP",
	EARLY_BIRD: "Preventa",
};

export const qrResultLabel: Record<string, string> = {
	VALID: "Válida",
	INVALID: "Inválida",
	ALREADY_USED: "Ya usada",
};

/** Referencia corta legible para pedidos (sin mostrar UUID completo). */
export function formatOrderRef(id: string): string {
	const compact = id.replace(/-/g, "").slice(-8).toUpperCase();
	return `#${compact}`;
}

/** Código de pase abreviado para pantallas de asistente. */
export function formatTicketCode(code: string): string {
	if (code.length <= 14) return code;
	return `${code.slice(0, 6)}···${code.slice(-4)}`;
}

export function labelFor(
	map: Record<string, string>,
	value: string,
): string {
	if (map[value]) return map[value];
	return value
		.split("_")
		.map((word) => word.charAt(0) + word.slice(1).toLowerCase())
		.join(" ");
}
