import { useMutation } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/ui/collapsible";
import { ApiError } from "#/lib/api/errors";
import type { TicketTier } from "#/lib/api/schemas";
import { patchTicketType } from "#/lib/api/ticket-api";
import { labelFor, ticketTierLabel } from "#/lib/labels";
import { cn } from "#/lib/utils";

import { TicketTypeFields } from "./ticket-type-fields";

export type EditableTicketType = {
	id: string;
	tier: TicketTier;
	name: string;
	price: string;
	quantityRemaining: number;
	quantityTotal?: number;
};

type TicketTypeEditorProps = {
	ticketType: EditableTicketType;
	onUpdated: () => void;
	onDelete: () => void;
	isDeleting: boolean;
	defaultOpen?: boolean;
};

function formatUsd(value: string | number) {
	const n = typeof value === "string" ? Number(value) : value;
	if (Number.isNaN(n)) return "—";
	return new Intl.NumberFormat("es", {
		style: "currency",
		currency: "USD",
	}).format(n);
}

export function TicketTypeEditor({
	ticketType,
	onUpdated,
	onDelete,
	isDeleting,
	defaultOpen = false,
}: TicketTypeEditorProps) {
	const total = ticketType.quantityTotal ?? ticketType.quantityRemaining;
	const sold = total - ticketType.quantityRemaining;

	const [open, setOpen] = useState(defaultOpen);
	const [tier, setTier] = useState(ticketType.tier);
	const [name, setName] = useState(ticketType.name);
	const [price, setPrice] = useState(ticketType.price);
	const [quantity, setQuantity] = useState(String(total));

	useEffect(() => {
		setTier(ticketType.tier);
		setName(ticketType.name);
		setPrice(ticketType.price);
		setQuantity(String(ticketType.quantityTotal ?? ticketType.quantityRemaining));
	}, [ticketType]);

	const isDirty = useMemo(
		() =>
			tier !== ticketType.tier ||
			name !== ticketType.name ||
			price !== ticketType.price ||
			quantity !== String(ticketType.quantityTotal ?? ticketType.quantityRemaining),
		[tier, name, price, quantity, ticketType],
	);

	useEffect(() => {
		if (isDirty) setOpen(true);
	}, [isDirty]);

	const save = useMutation({
		mutationFn: () =>
			patchTicketType(ticketType.id, {
				tier,
				name: name.trim(),
				price: Number(price),
				quantity: Number(quantity),
			}),
		onSuccess: () => {
			onUpdated();
			toast.success("Categoría actualizada");
		},
		onError: (e) =>
			toast.error(
				e instanceof ApiError ? e.message : "No se pudo guardar la categoría",
			),
	});

	const qtyNum = Number(quantity);
	const isValid =
		name.trim().length > 0 &&
		!Number.isNaN(qtyNum) &&
		qtyNum >= Math.max(1, sold) &&
		!Number.isNaN(Number(price)) &&
		Number(price) >= 0;

	const soldHint =
		sold > 0
			? `${sold} vendida${sold === 1 ? "" : "s"} · la cantidad total no puede ser menor que ${sold}.`
			: `${ticketType.quantityRemaining} disponibles de ${total}.`;

	const summaryTitle = name.trim() || labelFor(ticketTierLabel, tier);

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<article className="ticket-edge island-shell overflow-hidden rounded-xl">
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40"
					>
						<ChevronDown
							className={cn(
								"mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200",
								open && "rotate-180",
							)}
							aria-hidden
						/>
						<span className="min-w-0 flex-1 space-y-1">
							<span className="flex flex-wrap items-center gap-2">
								<span className="font-medium">{summaryTitle}</span>
								<Badge variant="outline" className="font-normal">
									{labelFor(ticketTierLabel, tier)}
								</Badge>
								{isDirty ? (
									<Badge variant="secondary">Sin guardar</Badge>
								) : null}
							</span>
							<span className="block text-xs text-muted-foreground">
								{formatUsd(price)} · {ticketType.quantityRemaining} de {total}{" "}
								disponibles
							</span>
						</span>
					</button>
				</CollapsibleTrigger>
				<CollapsibleContent className="border-t">
					<div className="space-y-4 px-5 py-4">
						<TicketTypeFields
							idPrefix={`edit-${ticketType.id}`}
							tier={tier}
							name={name}
							price={price}
							quantity={quantity}
							minQuantity={Math.max(1, sold)}
							soldHint={soldHint}
							onTierChange={setTier}
							onNameChange={setName}
							onPriceChange={setPrice}
							onQuantityChange={setQuantity}
						/>
						<div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="text-destructive hover:text-destructive"
								disabled={isDeleting}
								onClick={onDelete}
							>
								Eliminar
							</Button>
							<Button
								type="button"
								size="sm"
								disabled={!isDirty || !isValid || save.isPending}
								onClick={() => save.mutate()}
							>
								{save.isPending ? "Guardando…" : "Guardar categoría"}
							</Button>
						</div>
					</div>
				</CollapsibleContent>
			</article>
		</Collapsible>
	);
}
