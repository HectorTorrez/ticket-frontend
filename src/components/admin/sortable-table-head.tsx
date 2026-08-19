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
					"flex w-full min-w-0 cursor-pointer items-center gap-1 font-medium transition-colors hover:text-foreground",
					active ? "text-foreground" : "text-muted-foreground",
					className?.includes("text-right") && "justify-end",
				)}
				onClick={() => onSort(column)}
			>
				<span className="truncate">{label}</span>
				<span
					className="inline-flex size-3.5 shrink-0 items-center justify-center"
					aria-hidden
				>
					{active && sortDirection === "asc" ? (
						<ArrowUpIcon className="size-3.5" />
					) : active && sortDirection === "desc" ? (
						<ArrowDownIcon className="size-3.5" />
					) : (
						<ArrowUpDownIcon className="size-3.5 opacity-50" />
					)}
				</span>
			</button>
		</TableHead>
	);
}
