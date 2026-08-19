type Paginated<T> = {
	items: T[];
	total: number;
	page: number;
	limit: number;
};

export async function fetchAllPages<T>(
	fetchPage: (page: number, limit: number) => Promise<Paginated<T>>,
	limit = 100,
): Promise<T[]> {
	const all: T[] = [];
	let page = 1;

	for (;;) {
		const batch = await fetchPage(page, limit);
		all.push(...batch.items);
		if (page * limit >= batch.total) break;
		page += 1;
	}

	return all;
}
