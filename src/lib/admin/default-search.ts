export const adminEventsDefaultSearch = {
	page: 1,
	limit: 10,
	sortBy: "startsAt" as const,
	sortDirection: "default" as const,
};

export const adminEventsSortDefaults = {
	sortBy: "startsAt" as const,
	sortOrder: "asc" as const,
};

export const adminOrdersDefaultSearch = {
	page: 1,
	limit: 20,
	sortBy: "createdAt" as const,
	sortDirection: "default" as const,
};

export const adminOrdersSortDefaults = {
	sortBy: "createdAt" as const,
	sortOrder: "desc" as const,
};
