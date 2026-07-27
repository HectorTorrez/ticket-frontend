import {
	AlertCircle,
	CheckCircle2,
	Clock,
	HelpCircle,
	XCircle,
} from "lucide-react";

import { cn } from "#/lib/utils";

type StatusTone = "success" | "warning" | "error" | "info" | "neutral";

const toneStyles: Record<
	StatusTone,
	{ className: string; icon: typeof CheckCircle2 }
> = {
	success: {
		className: "text-success",
		icon: CheckCircle2,
	},
	warning: {
		className: "text-warning",
		icon: AlertCircle,
	},
	error: {
		className: "text-destructive",
		icon: XCircle,
	},
	info: {
		className: "text-primary",
		icon: Clock,
	},
	neutral: {
		className: "text-muted-foreground",
		icon: HelpCircle,
	},
};

export function orderStatusTone(status: string): StatusTone {
	switch (status) {
		case "PAID":
			return "success";
		case "PENDING":
			return "info";
		case "FAILED":
		case "CANCELLED":
			return "error";
		case "EXPIRED":
			return "warning";
		default:
			return "neutral";
	}
}

export function ticketStatusTone(status: string): StatusTone {
	switch (status) {
		case "ACTIVE":
			return "success";
		case "USED":
			return "warning";
		case "CANCELLED":
			return "error";
		default:
			return "neutral";
	}
}

export function qrResultTone(result: string): StatusTone {
	switch (result) {
		case "VALID":
			return "success";
		case "ALREADY_USED":
			return "warning";
		case "INVALID":
			return "error";
		default:
			return "neutral";
	}
}

type StatusIndicatorProps = {
	label: string;
	tone: StatusTone;
	className?: string;
	iconClassName?: string;
};

export function StatusIndicator({
	label,
	tone,
	className,
	iconClassName,
}: StatusIndicatorProps) {
	const { className: toneClass, icon: Icon } = toneStyles[tone];

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 font-medium",
				toneClass,
				className,
			)}
		>
			<Icon className={cn("size-4 shrink-0", iconClassName)} aria-hidden />
			<span>{label}</span>
		</span>
	);
}
