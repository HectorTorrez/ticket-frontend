import { labelFor, ticketTierLabel } from "#/lib/labels"

type TicketDateStubProps = {
	startsAt: string
	tier: string
}

export function TicketDateStub({ startsAt, tier }: TicketDateStubProps) {
	const date = new Date(startsAt)

	return (
		<>
			<span className="text-xs font-bold uppercase tracking-wide text-primary">
				{new Intl.DateTimeFormat("es", { month: "short" })
					.format(date)
					.toUpperCase()}
			</span>
			<span className="display-title text-2xl font-bold leading-none">
				{date.getDate()}
			</span>
			<span className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
				{labelFor(ticketTierLabel, tier)}
			</span>
		</>
	)
}
