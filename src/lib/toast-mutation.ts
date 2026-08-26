import { toast } from "sonner";

import { getUserFacingErrorMessage } from "#/lib/api/errors";

export function apiErrorMessage(error: unknown, fallback: string) {
	return getUserFacingErrorMessage(error, fallback);
}

type ToastMutationMessages<T> = {
	loading: string;
	success: string | ((data: T) => string);
	error?: string | ((error: unknown) => string);
};

/** Wrap an async mutation with Sonner loading → success/error feedback. */
export function toastMutation<T>(
	promise: Promise<T>,
	messages: ToastMutationMessages<T>,
): Promise<T> {
	toast.promise(promise, {
		loading: messages.loading,
		success: messages.success,
		error: messages.error ?? ((error) => apiErrorMessage(error, "Error")),
	});
	return promise;
}
