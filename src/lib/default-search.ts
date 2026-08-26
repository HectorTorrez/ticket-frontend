/** Default URL search for `/events` list links and navigations. */
export const eventsListDefaultSearch = {
	page: 1,
	limit: 10,
} as const;

/** Default URL search for `/my-orders` list links and navigations. */
export const myOrdersDefaultSearch = {
	page: 1,
	limit: 20,
} as const;

/** Default URL search for `/my-tickets` list links and navigations. */
export const myTicketsDefaultSearch = {
	page: 1,
	limit: 20,
	when: "upcoming" as const,
};
