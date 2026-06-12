/** Etiquetas en español para valores de enum de la API */
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

export function labelFor(
	map: Record<string, string>,
	value: string,
): string {
	return map[value] ?? value;
}
