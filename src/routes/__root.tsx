import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "next-themes";
import { AppErrorBoundary } from "#/components/app-error-boundary";
import { JsonLd } from "#/components/json-ld";
import { Toaster } from "#/components/ui/sonner";
import { buildSiteMeta, organizationJsonLd, websiteJsonLd } from "#/lib/seo";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

const defaultMeta = buildSiteMeta();

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: defaultMeta.meta,
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			...defaultMeta.links,
			{
				rel: "manifest",
				href: "/manifest.json",
			},
		],
	}),
	shellComponent: RootDocument,
	component: RootLayout,
});

function RootLayout() {
	const { queryClient } = Route.useRouteContext();
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider
				attribute="class"
				defaultTheme="system"
				enableSystem
				disableTransitionOnChange
			>
				<AppErrorBoundary>
					<Outlet />
				</AppErrorBoundary>
				<Toaster richColors position="top-center" />
			</ThemeProvider>
		</QueryClientProvider>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="es" suppressHydrationWarning>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<HeadContent />
				<JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
			</head>
			<body>
				{children}
				{import.meta.env.DEV ? (
					<TanStackDevtools
						config={{
							position: "bottom-right",
						}}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
							TanStackQueryDevtools,
						]}
					/>
				) : null}
				<Scripts />
			</body>
		</html>
	);
}
