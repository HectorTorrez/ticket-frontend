import { ChevronDown, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/ui/collapsible";
import type { TicketTier } from "#/lib/api/schemas";
import { cn } from "#/lib/utils";

import { TicketTypeFields } from "./ticket-type-fields";

type AddTicketTypeCollapsibleProps = {
	tier: TicketTier;
	name: string;
	price: string;
	quantity: string;
	onTierChange: (tier: TicketTier) => void;
	onNameChange: (name: string) => void;
	onPriceChange: (price: string) => void;
	onQuantityChange: (quantity: string) => void;
	onSubmit: () => void;
	canSubmit: boolean;
	isPending: boolean;
	defaultOpen?: boolean;
};

export function AddTicketTypeCollapsible({
	tier,
	name,
	price,
	quantity,
	onTierChange,
	onNameChange,
	onPriceChange,
	onQuantityChange,
	onSubmit,
	canSubmit,
	isPending,
	defaultOpen = false,
}: AddTicketTypeCollapsibleProps) {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<div className="island-shell overflow-hidden rounded-xl border border-dashed">
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40"
					>
						<ChevronDown
							className={cn(
								"size-4 shrink-0 text-muted-foreground transition-transform duration-200",
								open && "rotate-180",
							)}
							aria-hidden
						/>
						<span className="flex min-w-0 flex-1 items-center gap-2">
							<Plus className="size-4 shrink-0 text-muted-foreground" />
							<span className="font-medium">Añadir categoría</span>
						</span>
						<span className="text-xs text-muted-foreground">
							{open ? "Ocultar formulario" : "Expandir formulario"}
						</span>
					</button>
				</CollapsibleTrigger>
				<CollapsibleContent className="border-t border-dashed">
					<div className="space-y-4 px-5 py-4">
						<TicketTypeFields
							idPrefix="new-tt"
							tier={tier}
							name={name}
							price={price}
							quantity={quantity}
							onTierChange={onTierChange}
							onNameChange={onNameChange}
							onPriceChange={onPriceChange}
							onQuantityChange={onQuantityChange}
						/>
						<Button
							type="button"
							className="w-full sm:w-auto"
							onClick={onSubmit}
							disabled={!canSubmit || isPending}
						>
							{isPending ? "Añadiendo…" : "Añadir categoría"}
						</Button>
					</div>
				</CollapsibleContent>
			</div>
		</Collapsible>
	);
}
