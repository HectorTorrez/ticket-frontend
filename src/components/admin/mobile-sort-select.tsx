import type { SortDirection } from "#/lib/admin/sort";

type SortOption<T extends string> = {
	sortBy: T;
	sortDirection: SortDirection;
	label: string;
};

type MobileSortSelectProps<T extends string> = {
	id: string;
	sortBy: T;
	sortDirection: SortDirection;
	options: SortOption<T>[];
	onChange: (next: { sortBy: T; sortDirection: SortDirection }) => void;
};

export function MobileSortSelect<T extends string>({
	id,
	sortBy,
	sortDirection,
	options,
	onChange,
}: MobileSortSelectProps<T>) {
	const value = `${sortBy}:${sortDirection}`;
	const known = options.some(
		(option) =>
			option.sortBy === sortBy && option.sortDirection === sortDirection,
	);

	return (
		<div className="space-y-1 md:hidden">
			<label className="text-xs text-muted-foreground" htmlFor={id}>
				Ordenar
			</label>
			<select
				id={id}
				value={value}
				onChange={(event) => {
					const [nextSortBy, nextDirection] = event.target.value.split(":");
					onChange({
						sortBy: nextSortBy as T,
						sortDirection: nextDirection as SortDirection,
					});
				}}
				className="h-12 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm"
			>
				{known ? null : <option value={value}>Orden actual</option>}
				{options.map((option) => (
					<option
						key={`${option.sortBy}:${option.sortDirection}`}
						value={`${option.sortBy}:${option.sortDirection}`}
					>
						{option.label}
					</option>
				))}
			</select>
		</div>
	);
}
