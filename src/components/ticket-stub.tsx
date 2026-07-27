import type { ReactNode } from "react";

import { cn } from "#/lib/utils";

type TicketStubProps = {
	rail: ReactNode;
	children: ReactNode;
	aside?: ReactNode;
	className?: string;
};

export function TicketStub({
	rail,
	children,
	aside,
	className,
}: TicketStubProps) {
	return (
		<article
			className={cn(
				"stub-shell ticket-edge-left grid overflow-hidden rounded-lg sm:grid-cols-[5.5rem_1fr]",
				aside && "lg:grid-cols-[5.5rem_1fr_auto]",
				className,
			)}
		>
			<div className="poster-date-rail flex min-h-20 min-w-0 flex-col items-center justify-center gap-1 px-2 py-5 text-center">
				{rail}
			</div>
			<div className="min-w-0 p-5 md:p-6">{children}</div>
			{aside ? (
				<div className="border-t border-dashed border-border p-5 sm:col-span-2 lg:col-span-1 lg:border-l lg:border-t-0">
					{aside}
				</div>
			) : null}
		</article>
	);
}
