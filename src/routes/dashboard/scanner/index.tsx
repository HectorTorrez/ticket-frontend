import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { ApiError } from "#/lib/api/errors";
import { validateQrCode } from "#/lib/api/ticket-api";

export const Route = createFileRoute("/dashboard/scanner/")({
	component: ScannerPage,
});

function ScannerPage() {
	const [code, setCode] = useState("");
	const [last, setLast] = useState<string | null>(null);

	const validate = useMutation({
		mutationFn: () => validateQrCode(code.trim()),
		onSuccess: (r) => {
			setLast(r.result);
			if (r.result === "VALID") toast.success("Valid — ticket marked used");
			else if (r.result === "ALREADY_USED") toast.message("Already used");
			else toast.error("Invalid ticket");
		},
		onError: (e) =>
			toast.error(e instanceof ApiError ? e.message : "Validation failed"),
	});

	return (
		<div className="mx-auto max-w-md space-y-8">
			<div>
				<h1 className="display-title text-2xl font-semibold">QR gate</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Enter the ticket public code (UUID). Camera scanning can be added
					later.
				</p>
			</div>
			<div className="island-shell space-y-4 rounded-xl p-8">
				<div className="space-y-2">
					<Label htmlFor="code">Ticket code</Label>
					<Input
						id="code"
						value={code}
						onChange={(e) => setCode(e.target.value)}
						placeholder="scan or paste publicCode"
						className="font-mono text-sm"
						autoComplete="off"
					/>
				</div>
				<Button
					type="button"
					className="w-full"
					disabled={code.trim().length < 8 || validate.isPending}
					onClick={() => validate.mutate()}
				>
					Validate
				</Button>
				{last ? (
					<output
						className="block text-center text-lg font-semibold"
						aria-live="polite"
					>
						Result: {last}
					</output>
				) : null}
			</div>
		</div>
	);
}
