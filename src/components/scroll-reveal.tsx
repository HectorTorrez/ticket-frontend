import { useEffect, useRef, useState } from "react";
import { cn } from "#/lib/utils";

type ScrollRevealProps = {
	children: React.ReactNode;
	className?: string;
	delayMs?: number;
	as?: "div" | "section" | "li" | "article";
	/** Reveal on mount instead of waiting for scroll into view. */
	revealOnMount?: boolean;
};

function isInViewport(node: HTMLElement) {
	const rect = node.getBoundingClientRect();
	const viewportHeight = window.innerHeight;
	return (
		rect.top < viewportHeight * 0.92 &&
		rect.bottom > viewportHeight * 0.08 &&
		rect.width > 0
	);
}

export function ScrollReveal({
	children,
	className,
	delayMs = 0,
	as: Tag = "div",
	revealOnMount = false,
}: ScrollRevealProps) {
	const ref = useRef<HTMLElement>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const node = ref.current;
		if (!node) return;

		const reduced =
			typeof window !== "undefined" &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		if (reduced || revealOnMount) {
			setVisible(true);
			return;
		}

		if (isInViewport(node)) {
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
			{ rootMargin: "0px 0px 8% 0px", threshold: 0.05 },
		);

		observer.observe(node);
		return () => observer.disconnect();
	}, [revealOnMount]);

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
