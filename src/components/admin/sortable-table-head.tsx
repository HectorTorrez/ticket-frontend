import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";

import { TableHead } from "#/components/ui/table";
import type { SortDirection } from "#/lib/admin/sort";
import { cn } from "#/lib/utils.ts";

type SortableTableHeadProps<T extends string> = {
	label: string;
	column: T;
	sortBy: T;
	sortDirection: SortDirection;
	onSort: (column: T) => void;
	className?: string;
};

export function SortableTableHead<T extends string>({
	label,
	column,
	sortBy,
	sortDirection,
	onSort,
	className,
}: SortableTableHeadProps<T>) {
	const active = sortDirection !== "default" && sortBy === column;

	return (
		<TableHead
			className={className}
			aria-sort={
				active ? (sortDirection === "asc" ? "ascending" : "descending") : "none"
			}
		>
			<button
				type="button"
				className={cn(
					"inline-flex cursor-pointer items-center gap-1 font-medium transition-colors hover:text-foreground",
					active ? "text-foreground" : "text-muted-foreground",
				)}
				onClick={() => onSort(column)}
			>
				{label}
				{active && sortDirection === "asc" ? (
					<ArrowUpIcon className="size-3.5" aria-hidden />
				) : active && sortDirection === "desc" ? (
					<ArrowDownIcon className="size-3.5" aria-hidden />
				) : (
					<ArrowUpDownIcon className="size-3.5 opacity-50" aria-hidden />
				)}
			</button>
		</TableHead>
	);
}
