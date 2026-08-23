import type { ReactNode } from "react";

import { cn } from "#/lib/utils";

type MobileRecordListProps = {
	children: ReactNode;
	className?: string;
};

export function MobileRecordList({
	children,
	className,
}: MobileRecordListProps) {
	return <ul className={cn("space-y-3 md:hidden", className)}>{children}</ul>;
}

type MobileRecordCardProps = {
	children: ReactNode;
	className?: string;
};

export function MobileRecordCard({
	children,
	className,
}: MobileRecordCardProps) {
	return (
		<li>
			<article
				className={cn("island-shell space-y-3 rounded-xl p-4", className)}
			>
				{children}
			</article>
		</li>
	);
}
