"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
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
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState<DateRange | undefined>(value);
	const hasSelection = Boolean(value?.from);

	useEffect(() => {
		if (!open) setDraft(value);
	}, [value, open]);

	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		if (next) setDraft(value);
	};

	const handleAccept = () => {
		onChange?.(draft);
		setOpen(false);
	};

	const handleClear = () => {
		setDraft(undefined);
		onChange?.(undefined);
		onClear?.();
		setOpen(false);
	};

	return (
		<div className={cn("flex gap-1", className)}>
			<Popover open={open} onOpenChange={handleOpenChange}>
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
						defaultMonth={draft?.from ?? value?.from}
						selected={draft}
						onSelect={setDraft}
						numberOfMonths={2}
						locale={es}
					/>
					<div className="flex gap-2 border-t p-3">
						{draft?.from ? (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setDraft(undefined)}
							>
								Limpiar
							</Button>
						) : null}
						<Button
							type="button"
							size="sm"
							className="ml-auto"
							disabled={!draft?.from}
							onClick={handleAccept}
						>
							Aceptar
						</Button>
					</div>
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
