import { labelFor, ticketTierLabel } from "#/lib/labels";

type TicketDateStubProps = {
	startsAt: string;
	tier: string;
};

export function TicketDateStub({ startsAt, tier }: TicketDateStubProps) {
	const date = new Date(startsAt);

	return (
		<div className="flex w-full min-w-0 flex-col items-center gap-1 text-center">
			<span className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-primary">
				{new Intl.DateTimeFormat("es", { month: "short" })
					.format(date)
					.toUpperCase()}
			</span>
			<span className="display-title text-2xl font-bold leading-none">
				{date.getDate()}
			</span>
			<span className="max-w-full wrap-break-word font-ticket-code text-[0.62rem] uppercase tracking-wider text-muted-foreground">
				{labelFor(ticketTierLabel, tier)}
			</span>
		</div>
	);
}
