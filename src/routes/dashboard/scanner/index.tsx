import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { QrCameraScanner } from "#/components/qr-camera-scanner";
import {
	StatusIndicator,
	qrResultTone,
} from "#/components/status-indicator";
import { Button } from "#/components/ui/button";
import { FieldError } from "#/components/ui/field-message";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { ApiError } from "#/lib/api/errors";
import { validateQrCode } from "#/lib/api/ticket-api";
import { labelFor, qrResultLabel } from "#/lib/labels";
import { normalizeTicketCode } from "#/lib/ticket-code";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/dashboard/scanner/")({
	component: ScannerPage,
});

function ScannerPage() {
	const [code, setCode] = useState("");
	const [last, setLast] = useState<string | null>(null);
	const [codeError, setCodeError] = useState<string | undefined>();

	const { mutate, isPending } = useMutation({
		mutationFn: (raw: string) => validateQrCode(normalizeTicketCode(raw)),
		onSuccess: (r) => {
			setLast(r.result);
			setCodeError(undefined);
			if (r.result === "VALID")
				toast.success("Válida — entrada marcada como usada");
			else if (r.result === "ALREADY_USED") toast.message("Ya usada");
			else toast.error("Entrada inválida");
		},
		onError: (e) =>
			toast.error(e instanceof ApiError ? e.message : "Error al validar"),
	});

	const runValidate = useCallback(
		(raw: string) => {
			const normalized = normalizeTicketCode(raw);
			if (normalized.length < 8) {
				setCodeError("Introduce un código de al menos 8 caracteres");
				setLast(null);
				return;
			}
			setCodeError(undefined);
			setCode(normalized);
			mutate(raw);
		},
		[mutate],
	);

	const handleScan = useCallback(
		(decoded: string) => {
			runValidate(decoded);
		},
		[runValidate],
	);

	return (
		<div className="mx-auto max-w-md space-y-8">
			<div>
				<h1 className="display-title text-2xl font-semibold">Control de acceso</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Escanea el código QR del asistente o introduce el código del pase manualmente.
				</p>
			</div>
			<div className="island-shell space-y-6 rounded-xl p-8">
				<QrCameraScanner onScan={handleScan} disabled={isPending} />
				<div className="space-y-2">
					<Label htmlFor="code" required>
						Código del pase
					</Label>
					<Input
						id="code"
						value={code}
						onChange={(e) => {
							setCode(e.target.value);
							if (codeError) setCodeError(undefined);
						}}
						placeholder="Pega el código o el enlace del pase"
						className="font-mono text-sm"
						autoComplete="off"
						aria-invalid={codeError ? true : undefined}
					/>
					<FieldError>{codeError}</FieldError>
				</div>
				<Button
					type="button"
					className="w-full"
					disabled={code.trim().length < 8 || isPending}
					onClick={() => runValidate(code)}
				>
					Validar
				</Button>
				{last ? (
					<output
						className={cn(
							"block rounded-lg border px-4 py-3 text-center",
							last === "VALID" &&
								"border-green-600/30 bg-green-50 dark:bg-green-950/30",
							last === "ALREADY_USED" &&
								"border-amber-600/30 bg-amber-50 dark:bg-amber-950/30",
							last === "INVALID" &&
								"border-destructive/30 bg-destructive/5",
						)}
						aria-live="polite"
					>
						<StatusIndicator
							label={`Resultado: ${labelFor(qrResultLabel, last)}`}
							tone={qrResultTone(last)}
							className="text-base"
						/>
					</output>
				) : null}
			</div>
		</div>
	);
}
