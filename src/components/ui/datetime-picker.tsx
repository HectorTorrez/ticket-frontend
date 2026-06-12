"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/ui/button";
import { Calendar } from "#/components/ui/calendar";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import {
	parseLocalDateTime,
	toLocalDateTimeInput,
} from "#/lib/dates";
import { cn } from "#/lib/utils";

type DateTimePickerProps = {
	id?: string;
	value: string;
	onChange: (value: string) => void;
	className?: string;
	placeholder?: string;
};

function DateTimePicker({
	id,
	value,
	onChange,
	className,
	placeholder = "Seleccionar fecha y hora",
}: DateTimePickerProps) {
	const [open, setOpen] = useState(false);
	const selected = parseLocalDateTime(value);
	const timeValue = selected
		? `${String(selected.getHours()).padStart(2, "0")}:${String(selected.getMinutes()).padStart(2, "0")}`
		: "12:00";

	const updateDateTime = (date: Date, time: string) => {
		const [hours, minutes] = time.split(":").map(Number);
		const next = new Date(date);
		next.setHours(hours, minutes, 0, 0);
		onChange(toLocalDateTimeInput(next));
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					id={id}
					type="button"
					variant="outline"
					className={cn(
						"w-full justify-start text-left font-normal",
						!selected && "text-muted-foreground",
						className,
					)}
				>
					<CalendarIcon className="size-4 shrink-0" />
					<span className="truncate">
						{selected
							? format(selected, "d MMM yyyy 'a las' HH:mm", { locale: es })
							: placeholder}
					</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={selected}
					onSelect={(date) => {
						if (date) updateDateTime(date, timeValue);
					}}
					defaultMonth={selected}
					locale={es}
				/>
				<div className="space-y-2 border-t p-3">
					<Label htmlFor={`${id ?? "datetime"}-time`} className="text-xs">
						Hora
					</Label>
					<Input
						id={`${id ?? "datetime"}-time`}
						type="time"
						value={timeValue}
						onChange={(e) => {
							const base = selected ?? new Date();
							updateDateTime(base, e.target.value);
						}}
					/>
				</div>
			</PopoverContent>
		</Popover>
	);
}

export { DateTimePicker, type DateTimePickerProps };
