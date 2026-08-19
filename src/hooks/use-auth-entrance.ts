import { useEffect, useState } from "react";

const STORAGE_KEY = "ticket-auth-entrance-seen";

/** Skip rise-in stagger on repeat auth visits within the same browser session. */
export function useAuthEntrance() {
	const [animate, setAnimate] = useState(true);

	useEffect(() => {
		if (sessionStorage.getItem(STORAGE_KEY)) {
			setAnimate(false);
			return;
		}
		sessionStorage.setItem(STORAGE_KEY, "1");
	}, []);

	return {
		headingClass: animate ? "rise-in" : "",
		formClass: animate
			? "auth-shell rise-in stagger-1 space-y-6 p-8"
			: "auth-shell space-y-6 p-8",
	};
}

/** One-shot entrance for public utility pages (check-in, etc.). */
export function usePageEntrance(storageKey: string) {
	const [animate, setAnimate] = useState(true);

	useEffect(() => {
		if (sessionStorage.getItem(storageKey)) {
			setAnimate(false);
			return;
		}
		sessionStorage.setItem(storageKey, "1");
	}, [storageKey]);

	return animate ? "rise-in" : "";
}
