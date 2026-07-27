import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
	resolve: {
		alias: [
			{ find: /^#\/(.*)$/, replacement: `${resolve(__dirname, "src")}/$1` },
			{ find: /^#lib\/(.*)$/, replacement: `${resolve(__dirname, "src/lib")}/$1` },
			{ find: "#lib", replacement: resolve(__dirname, "src/lib") },
			{ find: "#", replacement: resolve(__dirname, "src") },
		],
	},
	test: {
		environment: "jsdom",
		setupFiles: ["./src/test/setup.ts"],
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
	},
});
