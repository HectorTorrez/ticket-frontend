import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { QrCameraScanner } from "#/components/qr-camera-scanner";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { ApiError } from "#/lib/api/errors";
import { validateQrCode } from "#/lib/api/ticket-api";
import { labelFor, qrResultLabel } from "#/lib/labels";
import { normalizeTicketCode } from "#/lib/ticket-code";

export const Route = createFileRoute("/dashboard/scanner/")({
	component: ScannerPage,
});

function ScannerPage() {
	const [code, setCode] = useState("");
	const [last, setLast] = useState<string | null>(null);

	const { mutate, isPending } = useMutation({
		mutationFn: (raw: string) => validateQrCode(normalizeTicketCode(raw)),
		onSuccess: (r) => {
			setLast(r.result);
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
				toast.error("Código de entrada no reconocido");
				return;
			}
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
				<h1 className="display-title text-2xl font-semibold">Control QR</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Escanea el QR del asistente o pega el código / URL de verificación (
					<code className="text-xs">/check/…</code>).
				</p>
			</div>
			<div className="island-shell space-y-6 rounded-xl p-8">
				<QrCameraScanner onScan={handleScan} disabled={isPending} />
				<div className="space-y-2">
					<Label htmlFor="code">Código de entrada</Label>
					<Input
						id="code"
						value={code}
						onChange={(e) => setCode(e.target.value)}
						placeholder="escanear o pegar publicCode"
						className="font-mono text-sm"
						autoComplete="off"
					/>
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
						className="block text-center text-lg font-semibold"
						aria-live="polite"
					>
						Resultado: {labelFor(qrResultLabel, last)}
					</output>
				) : null}
			</div>
		</div>
	);
}
