import {
	AlertCircle,
	CheckCircle2,
	Clock3,
	Info,
	type LucideIcon,
	XCircle,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "#/lib/utils";

export type StatusPanelTone =
	| "success"
	| "warning"
	| "error"
	| "info"
	| "neutral";

const toneStyles: Record<
	StatusPanelTone,
	{ className: string; icon: LucideIcon }
> = {
	success: {
		className: "border-success/30 bg-success/10 text-success",
		icon: CheckCircle2,
	},
	warning: {
		className: "border-warning/30 bg-warning/10 text-warning",
		icon: AlertCircle,
	},
	error: {
		className: "border-destructive/30 bg-destructive/10 text-destructive",
		icon: XCircle,
	},
	info: {
		className: "border-primary/30 bg-primary-fill text-primary",
		icon: Clock3,
	},
	neutral: {
		className: "border-border bg-muted/50 text-foreground",
		icon: Info,
	},
};

type StatusPanelProps = {
	tone?: StatusPanelTone;
	title: ReactNode;
	description?: ReactNode;
	action?: ReactNode;
	className?: string;
};

export function StatusPanel({
	tone = "neutral",
	title,
	description,
	action,
	className,
}: StatusPanelProps) {
	const { className: toneClassName, icon: Icon } = toneStyles[tone];

	return (
		<div
			role={tone === "error" ? "alert" : "status"}
			className={cn(
				"flex items-start gap-3 rounded-lg border p-4",
				toneClassName,
				className,
			)}
		>
			<Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
			<div className="min-w-0 flex-1">
				<p className="font-semibold text-current">{title}</p>
				{description ? (
					<div className="mt-1 text-sm leading-relaxed text-foreground/75">
						{description}
					</div>
				) : null}
				{action ? <div className="mt-3">{action}</div> : null}
			</div>
		</div>
	);
}
