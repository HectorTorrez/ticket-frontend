export const eventsKeys = {
	all: ["events"] as const,
	list: (params: {
		page: number;
		limit: number;
		publishedOnly: boolean;
		q?: string;
		from?: string;
		to?: string;
	}) => [...eventsKeys.all, "list", params] as const,
	/** Dashboard table: `GET /admin/events`. */
	adminList: (params: {
		page: number;
		limit: number;
		published?: boolean;
		q?: string;
		from?: string;
		to?: string;
	}) => [...eventsKeys.all, "admin", "list", params] as const,
	detail: (slugOrId: string) =>
		[...eventsKeys.all, "detail", slugOrId] as const,
	/** Dashboard edit: published via `GET /events/:id`, drafts via `GET /admin/events` / PATCH. */
	adminDetail: (id: string) =>
		[...eventsKeys.all, "admin", "detail", id] as const,
};

export const ordersKeys = {
	all: ["orders"] as const,
	meList: (params: { page: number; limit: number; status?: string }) =>
		[...ordersKeys.all, "me", "list", params] as const,
	meDetail: (id: string) => [...ordersKeys.all, "me", "detail", id] as const,
};

export const adminOrdersKeys = {
	all: ["admin-orders"] as const,
	list: (params: {
		page: number;
		limit: number;
		status?: string;
		userId?: string;
	}) => [...adminOrdersKeys.all, "list", params] as const,
};

export const ticketsKeys = {
	all: ["tickets"] as const,
	mine: () => [...ticketsKeys.all, "mine"] as const,
};

export const dashboardKeys = {
	summary: () => ["dashboard", "summary"] as const,
};
