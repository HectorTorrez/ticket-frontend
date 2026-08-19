import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { getUserFacingErrorMessage } from "#/lib/api/errors";

/** Shows a Sonner toast once when `error` becomes truthy. */
export function useErrorToast(error: unknown, title?: string) {
	const shownRef = useRef<unknown>(null);
	const toastId = title ? `query-error:${title}` : "query-error:default";

	useEffect(() => {
		if (!error || error === shownRef.current) return;
		shownRef.current = error;
		const description = getUserFacingErrorMessage(error);
		if (title) toast.error(title, { description, id: toastId });
		else toast.error(description, { id: toastId });
	}, [error, title, toastId]);
}
