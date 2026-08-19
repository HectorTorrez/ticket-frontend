import { useEffect, useRef, useState } from "react";
import { cn } from "#/lib/utils";

type ScrollRevealProps = {
	children: React.ReactNode;
	className?: string;
	delayMs?: number;
	as?: "div" | "section" | "li" | "article";
};

export function ScrollReveal({
	children,
	className,
	delayMs = 0,
	as: Tag = "div",
}: ScrollRevealProps) {
	const ref = useRef<HTMLElement>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const node = ref.current;
		if (!node) return;

		const reduced =
			typeof window !== "undefined" &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		if (reduced) {
			setVisible(true);
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					setVisible(true);
					observer.disconnect();
				}
			},
			{ rootMargin: "-8% 0px -4% 0px", threshold: 0.12 },
		);

		observer.observe(node);
		return () => observer.disconnect();
	}, []);

	return (
		<Tag
			ref={ref as never}
			className={cn("scroll-reveal", visible && "is-visible", className)}
			style={delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
		>
			{children}
		</Tag>
	);
}
