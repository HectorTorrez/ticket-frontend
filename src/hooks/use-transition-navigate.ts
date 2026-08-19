import { useNavigate } from "@tanstack/react-router";
import type { MouseEvent } from "react";
import {
	runViewTransition,
	type ViewTransitionDirection,
} from "#/lib/view-transition";

type NavigateOptions = Parameters<ReturnType<typeof useNavigate>>[0];

export function useTransitionNavigate() {
	const navigate = useNavigate();

	return (
		options: NavigateOptions,
		direction: ViewTransitionDirection = "forward",
	) => {
		runViewTransition(() => navigate(options), direction);
	};
}

export function useTransitionClick(
	options: NavigateOptions,
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
