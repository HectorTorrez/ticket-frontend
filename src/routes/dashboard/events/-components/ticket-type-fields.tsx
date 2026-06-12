import type { TicketTier } from "#/lib/api/schemas";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { ticketTierLabel } from "#/lib/labels";

export const TIER_OPTIONS: { value: TicketTier; label: string }[] = [
	{ value: "GENERAL", label: ticketTierLabel.GENERAL },
	{ value: "VIP", label: ticketTierLabel.VIP },
	{ value: "EARLY_BIRD", label: ticketTierLabel.EARLY_BIRD },
];

type TicketTypeFieldsProps = {
	tier: TicketTier;
	name: string;
	price: string;
	quantity: string;
	onTierChange: (tier: TicketTier) => void;
	onNameChange: (name: string) => void;
	onPriceChange: (price: string) => void;
	onQuantityChange: (quantity: string) => void;
	minQuantity?: number;
	soldHint?: string;
	idPrefix?: string;
};

export function TicketTypeFields({
	tier,
	name,
	price,
	quantity,
	onTierChange,
	onNameChange,
	onPriceChange,
	onQuantityChange,
	minQuantity = 1,
	soldHint,
	idPrefix = "tt",
}: TicketTypeFieldsProps) {
	return (
		<div className="grid gap-3 sm:grid-cols-2">
			<div className="space-y-2 sm:col-span-2">
				<Label htmlFor={`${idPrefix}-tier`} required>
					Categoría
				</Label>
				<Select value={tier} onValueChange={(v) => onTierChange(v as TicketTier)}>
					<SelectTrigger id={`${idPrefix}-tier`}>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{TIER_OPTIONS.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="space-y-2">
				<Label htmlFor={`${idPrefix}-name`} required>
					Nombre
				</Label>
				<Input
					id={`${idPrefix}-name`}
					value={name}
					onChange={(e) => onNameChange(e.target.value)}
					placeholder="Entrada general"
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor={`${idPrefix}-price`} required>
					Precio (USD)
				</Label>
				<Input
					id={`${idPrefix}-price`}
					type="number"
					min={0}
					step="0.01"
					value={price}
					onChange={(e) => onPriceChange(e.target.value)}
				/>
			</div>
			<div className="space-y-2 sm:col-span-2">
				<Label htmlFor={`${idPrefix}-qty`} required>
					Cantidad total
				</Label>
				<Input
					id={`${idPrefix}-qty`}
					type="number"
					min={minQuantity}
					value={quantity}
					onChange={(e) => onQuantityChange(e.target.value)}
				/>
				{soldHint ? (
					<p className="text-xs text-muted-foreground">{soldHint}</p>
				) : null}
			</div>
		</div>
	);
}
