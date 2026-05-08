import { AlertTriangle } from "lucide-react";

import { getUserFacingErrorMessage } from "#/lib/api/errors";
import { cn } from "#/lib/utils";

type QueryErrorAlertProps = {
	title: string;
	error: unknown;
	className?: string;
};

export function QueryErrorAlert({
	title,
	error,
	className = "",
}: QueryErrorAlertProps) {
	return (
		<div
			role="alert"
			className={cn(
				"island-shell rounded-xl border-destructive/30 bg-destructive/5 p-6",
				className,
			)}
		>
			<div className="flex gap-3">
				<AlertTriangle
					className="mt-0.5 size-5 shrink-0 text-destructive"
					aria-hidden
				/>
				<div className="min-w-0 space-y-2">
					<h2 className="font-semibold text-foreground">{title}</h2>
					<p className="text-sm leading-relaxed text-muted-foreground">
						{getUserFacingErrorMessage(error)}
					</p>
				</div>
			</div>
		</div>
	);
}
