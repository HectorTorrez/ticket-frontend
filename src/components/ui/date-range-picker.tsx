"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "#/components/ui/button";
import { Calendar } from "#/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { cn } from "#/lib/utils";

type DateRangePickerProps = {
	id?: string;
	value?: DateRange;
	onChange?: (range: DateRange | undefined) => void;
	onClear?: () => void;
	className?: string;
	placeholder?: string;
};

function DateRangePicker({
	id,
	value,
	onChange,
	onClear,
	className,
	placeholder = "Seleccionar fechas",
}: DateRangePickerProps) {
	const hasSelection = Boolean(value?.from);

	const handleClear = () => {
		onChange?.(undefined);
		onClear?.();
	};

	return (
		<div className={cn("flex gap-1", className)}>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						id={id}
						type="button"
						variant="outline"
						className={cn(
							"min-w-0 flex-1 justify-start text-left font-normal md:w-[280px]",
							!hasSelection && "text-muted-foreground",
						)}
					>
						<CalendarIcon className="size-4 shrink-0" />
						<span className="truncate">
							{value?.from ? (
								value.to ? (
									<>
										{format(value.from, "d MMM yyyy", { locale: es })} –{" "}
										{format(value.to, "d MMM yyyy", { locale: es })}
									</>
								) : (
									format(value.from, "d MMM yyyy", { locale: es })
								)
							) : (
								placeholder
							)}
						</span>
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						mode="range"
						defaultMonth={value?.from}
						selected={value}
						onSelect={onChange}
						numberOfMonths={2}
						locale={es}
					/>
					{hasSelection ? (
						<div className="border-t p-3">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="w-full"
								onClick={handleClear}
							>
								Limpiar fechas
							</Button>
						</div>
					) : null}
				</PopoverContent>
			</Popover>
			{hasSelection ? (
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="shrink-0"
					aria-label="Limpiar fechas"
					onClick={handleClear}
				>
					<X className="size-4" />
				</Button>
			) : null}
		</div>
	);
}

export { DateRangePicker, type DateRangePickerProps };
