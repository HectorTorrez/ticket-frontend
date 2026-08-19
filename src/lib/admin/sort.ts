export type SortOrder = "asc" | "desc";
export type SortDirection = SortOrder | "default";

export type TableSortDefaults<T extends string> = {
	sortBy: T;
	sortOrder: SortOrder;
};

export function resolveTableSort<T extends string>(
	sortBy: T,
	sortDirection: SortDirection,
	defaults: TableSortDefaults<T>,
): TableSortDefaults<T> {
	if (sortDirection === "default") return defaults;
	return { sortBy, sortOrder: sortDirection };
}

export function cycleSort<T extends string>(
	current: { sortBy: T; sortDirection: SortDirection },
	column: T,
	defaults: TableSortDefaults<T>,
): { sortBy: T; sortDirection: SortDirection } {
	const isDefault = current.sortDirection === "default";
	const isActiveColumn = !isDefault && current.sortBy === column;

	if (isDefault || !isActiveColumn) {
		return { sortBy: column, sortDirection: "asc" };
	}

	if (current.sortDirection === "asc") {
		return { sortBy: column, sortDirection: "desc" };
	}

	return { sortBy: defaults.sortBy, sortDirection: "default" };
}
