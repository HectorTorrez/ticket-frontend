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
		sortBy?: string;
		sortDirection?: "asc" | "desc" | "default";
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
		q?: string;
		sortBy?: string;
		sortDirection?: "asc" | "desc" | "default";
	}) => [...adminOrdersKeys.all, "list", params] as const,
	detail: (id: string) => [...adminOrdersKeys.all, "detail", id] as const,
};

export const ticketsKeys = {
	all: ["tickets"] as const,
	mine: (params: {
		when: "upcoming" | "past" | "all";
		page: number;
		limit: number;
	}) => [...ticketsKeys.all, "mine", params] as const,
	public: (publicCode: string) =>
		[...ticketsKeys.all, "public", publicCode] as const,
};

export const dashboardKeys = {
	summary: () => ["dashboard", "summary"] as const,
};

export const adminUsersKeys = {
	all: ["admin-users"] as const,
	list: (params: {
		page: number;
		limit: number;
		q?: string;
		role?: string;
		status?: string;
		sortBy?: string;
		sortDirection?: "asc" | "desc" | "default";
	}) => [...adminUsersKeys.all, "list", params] as const,
};
