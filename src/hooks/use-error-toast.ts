import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { getUserFacingErrorMessage } from "#/lib/api/errors";

/** Shows a Sonner toast once when `error` becomes truthy. */
export function useErrorToast(error: unknown, title?: string) {
	const shownRef = useRef<unknown>(null);

	useEffect(() => {
		if (!error || error === shownRef.current) return;
		shownRef.current = error;
		const description = getUserFacingErrorMessage(error);
		if (title) toast.error(title, { description });
		else toast.error(description);
	}, [error, title]);
}
