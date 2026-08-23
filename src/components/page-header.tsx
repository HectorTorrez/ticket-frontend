import type { ReactNode } from "react";

import { cn } from "#/lib/utils";

type PageHeaderProps = {
	eyebrow: string;
	title: ReactNode;
	description?: ReactNode;
	action?: ReactNode;
	className?: string;
	size?: "default" | "large";
	headingLevel?: 1 | 2;
};

export function PageHeader({
	eyebrow,
	title,
	description,
	action,
	className,
	size = "default",
	headingLevel = 1,
}: PageHeaderProps) {
	const Heading = headingLevel === 1 ? "h1" : "h2";

	return (
		<header
			className={cn(
				"flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
				className,
			)}
		>
			<div className="max-w-2xl">
				<p className="island-kicker">{eyebrow}</p>
				<Heading
					className={cn(
						"display-title mt-2 font-semibold leading-[1.04]",
						size === "large"
							? "text-4xl md:text-5xl lg:text-6xl"
							: "text-3xl md:text-4xl",
					)}
				>
					{title}
				</Heading>
				{description ? (
					<div className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
						{description}
					</div>
				) : null}
			</div>
			{action ? (
				<div className="w-full shrink-0 sm:w-auto">{action}</div>
			) : null}
		</header>
	);
}
