import type { ReactNode } from "react";

import { Button } from "#/components/ui/button";

type ListPaginationProps = {
	page: number;
	total: number;
	limit: number;
	label: ReactNode;
	onPrev: () => void;
	onNext: () => void;
};

export function ListPagination({
	page,
	total,
	limit,
	label,
	onPrev,
	onNext,
}: ListPaginationProps) {
	return (
		<div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
			<p className="text-center text-sm text-muted-foreground sm:text-left">
				{label}
			</p>
			<div className="grid grid-cols-2 gap-2 sm:flex">
				<Button
					type="button"
					variant="outline"
					className="w-full sm:w-auto"
					disabled={page <= 1}
					onClick={onPrev}
				>
					Anterior
				</Button>
				<Button
					type="button"
					variant="outline"
					className="w-full sm:w-auto"
					disabled={page * limit >= total}
					onClick={onNext}
				>
					Siguiente
				</Button>
			</div>
		</div>
	);
}
