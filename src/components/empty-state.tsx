import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { PosterSurface } from "#/components/poster-surface";
import { cn } from "#/lib/utils";

type EmptyStateProps = {
	icon: LucideIcon;
	title: string;
	description: string;
	action?: ReactNode;
	className?: string;
};

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	className,
}: EmptyStateProps) {
	return (
		<PosterSurface
			variant="flow"
			padding="large"
			className={cn("text-center", className)}
		>
			<Icon className="mx-auto size-8 text-primary" aria-hidden />
			<h2 className="display-title mt-4 text-2xl font-semibold">{title}</h2>
			<p className="mx-auto mt-2 max-w-md text-muted-foreground">
				{description}
			</p>
			{action ? <div className="mt-6">{action}</div> : null}
		</PosterSurface>
	);
}
