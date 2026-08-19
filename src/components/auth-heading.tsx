import { Skeleton } from "#/components/ui/skeleton";
import { cn } from "#/lib/utils";

type AuthHeadingProps = {
	kicker: string;
	title: string;
	description: string;
	entranceClass?: string;
};

export function AuthHeading({
	kicker,
	title,
	description,
	entranceClass,
}: AuthHeadingProps) {
	return (
		<div className={cn("space-y-3", entranceClass)}>
			<p className="font-ticket-code text-[0.68rem] uppercase tracking-[0.16em] text-primary">
				{kicker}
			</p>
			<h1 className="display-title text-3xl font-semibold">{title}</h1>
			<p className="max-w-prose text-muted-foreground">{description}</p>
		</div>
	);
}

export function AuthFormSkeleton() {
	return (
		<div className="page-wrap flex justify-center py-16 md:py-20">
			<div className="w-full max-w-md space-y-8" aria-hidden>
				<div className="space-y-3">
					<Skeleton className="h-3 w-24" />
					<Skeleton className="h-9 w-56" />
					<Skeleton className="h-5 w-full" />
				</div>
				<Skeleton className="h-72 w-full rounded-lg" />
			</div>
			<p className="sr-only">Cargando formulario</p>
		</div>
	);
}
