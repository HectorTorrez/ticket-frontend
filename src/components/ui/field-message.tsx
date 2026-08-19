import { cn } from "#/lib/utils.ts";

function FieldHint({ className, ...props }: React.ComponentProps<"p">) {
	return (
		<p
			data-slot="field-hint"
			className={cn("text-sm text-muted-foreground", className)}
			{...props}
		/>
	);
}

function FieldError({
	className,
	children,
	...props
}: React.ComponentProps<"p">) {
	if (!children) return null;

	return (
		<p
			data-slot="field-error"
			role="alert"
			className={cn("text-sm text-destructive", className)}
			{...props}
		>
			{children}
		</p>
	);
}

export { FieldHint, FieldError };
