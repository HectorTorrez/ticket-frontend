import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "#/lib/utils";

const posterSurfaceVariants = cva("overflow-hidden border", {
	variants: {
		variant: {
			poster: "poster-frame rounded-lg",
			flow: "island-shell rounded-lg",
			pass: "pass-card rounded-lg",
			receipt: "stub-shell ticket-edge rounded-lg",
		},
		padding: {
			none: "",
			default: "p-6",
			large: "p-8 md:p-10",
		},
	},
	defaultVariants: {
		variant: "flow",
		padding: "default",
	},
});

type PosterSurfaceProps = ComponentProps<"div"> &
	VariantProps<typeof posterSurfaceVariants>;

export function PosterSurface({
	variant,
	padding,
	className,
	...props
}: PosterSurfaceProps) {
	return (
		<div
			data-slot="poster-surface"
			className={cn(posterSurfaceVariants({ variant, padding }), className)}
			{...props}
		/>
	);
}
