import { useNavigate } from "@tanstack/react-router";
import type { MouseEvent } from "react";
import {
	runViewTransition,
	type ViewTransitionDirection,
} from "#/lib/view-transition";

export type TransitionNavigateOptions = {
	to: string;
	params?: Record<string, string>;
	search?: Record<string, unknown>;
	hash?: string;
	replace?: boolean;
	state?: unknown;
};

export function useTransitionNavigate() {
	const navigate = useNavigate();

	return (
		options: TransitionNavigateOptions,
		direction: ViewTransitionDirection = "forward",
	) => {
		runViewTransition(() => navigate(options as never), direction);
	};
}

export function useTransitionClick(
	options: TransitionNavigateOptions,
	direction: ViewTransitionDirection = "forward",
) {
	const transitionNavigate = useTransitionNavigate();

	return (event: MouseEvent<HTMLAnchorElement>) => {
		if (event.defaultPrevented) return;
		if (
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey ||
			event.currentTarget.target === "_blank"
		) {
			return;
		}

		event.preventDefault();
		transitionNavigate(options, direction);
	};
}
