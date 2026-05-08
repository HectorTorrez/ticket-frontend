import { QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "#lib/api/errors";

function shouldRetry(failureCount: number, error: unknown): boolean {
	if (failureCount >= 2) return false;
	if (error instanceof ApiError) {
		if (error.statusCode === 401 || error.statusCode === 403) return false;
		if (error.statusCode >= 500) return true;
		return false;
	}
	return false;
}

export function createQueryClient(): QueryClient {
	return new QueryClient({
		queryCache: new QueryCache({
			onError: (err) => {
				if (import.meta.env.DEV) console.error("[query]", err);
			},
		}),
		defaultOptions: {
			queries: {
				staleTime: 30_000,
				retry: shouldRetry,
				refetchOnWindowFocus: true,
			},
			mutations: {
				retry: false,
			},
		},
	});
}

export function getContext() {
	const queryClient = createQueryClient();

	return {
		queryClient,
	};
}
