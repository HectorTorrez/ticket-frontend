import { startTransition } from "react";

export type ViewTransitionDirection = "forward" | "back";

export function supportsViewTransitions() {
	return typeof document !== "undefined" && "startViewTransition" in document;
}

export function setViewTransitionDirection(direction: ViewTransitionDirection) {
	document.documentElement.dataset.vtDirection = direction;
}

export function clearViewTransitionDirection() {
	delete document.documentElement.dataset.vtDirection;
}

export function runViewTransition(
	update: () => void | Promise<void>,
	direction: ViewTransitionDirection = "forward",
) {
	if (typeof document === "undefined") {
		void update();
		return;
	}

	setViewTransitionDirection(direction);

	const finish = () => {
		window.setTimeout(clearViewTransitionDirection, 300);
	};

	if (!supportsViewTransitions()) {
		void update();
		finish();
		return;
	}

	document
		.startViewTransition(() => {
			startTransition(() => {
				void update();
			});
		})
		.finished.finally(finish);
}

export function eventBannerTransitionName(eventId: string) {
	return `event-banner-${eventId}`;
}
