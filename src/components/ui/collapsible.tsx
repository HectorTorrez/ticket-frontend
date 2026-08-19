import { Collapsible as CollapsiblePrimitive } from "radix-ui";

function Collapsible({
	...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
	return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger({
	...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
	return (
		<CollapsiblePrimitive.CollapsibleTrigger
			data-slot="collapsible-trigger"
			{...props}
		/>
	);
}

function CollapsibleContent({
	className,
	children,
	...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
	return (
		<CollapsiblePrimitive.CollapsibleContent
			data-slot="collapsible-content"
			className={className}
			{...props}
		>
			<div data-slot="collapsible-content-inner">{children}</div>
		</CollapsiblePrimitive.CollapsibleContent>
	);
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
