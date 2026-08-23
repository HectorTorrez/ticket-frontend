import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2, TriangleAlert, XCircle } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { QrCameraScanner } from "#/components/qr-camera-scanner";
import type { StatusTone } from "#/components/status-indicator";
import { Button } from "#/components/ui/button";
import { FieldError } from "#/components/ui/field-message";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { getUserFacingErrorMessage } from "#/lib/api/errors";
import { validateQrCode } from "#/lib/api/ticket-api";
import { labelFor, qrResultLabel } from "#/lib/labels";
import { normalizeTicketCode } from "#/lib/ticket-code";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/dashboard/scanner/")({
	component: ScannerPage,
});

type ScanResult = "VALID" | "ALREADY_USED" | "INVALID";

type ScanFeedback =
	| { type: "validating" }
	| { type: "result"; result: ScanResult; id: number }
	| { type: "error"; message: string };

const resultCopy: Record<
	ScanResult,
	{ title: string; detail: string; tone: StatusTone }
> = {
	VALID: {
		title: "Pase válido",
		detail: "Marcado como usado. Puede entrar.",
		tone: "success",
	},
	ALREADY_USED: {
		title: "Ya fue usada",
		detail: "Este pase ya se registró. No dejes pasar.",
		tone: "warning",
	},
	INVALID: {
		title: "Pase no válido",
		detail: "Este código no corresponde a un pase activo.",
		tone: "error",
	},
};

function ScannerPage() {
	const [code, setCode] = useState("");
	const [codeError, setCodeError] = useState<string | undefined>();
	const [feedback, setFeedback] = useState<ScanFeedback | null>(null);
	const scanSeqRef = useRef(0);

	const { mutate, isPending } = useMutation({
		mutationFn: (raw: string) => validateQrCode(normalizeTicketCode(raw)),
		onSuccess: (r) => {
			setCodeError(undefined);
			scanSeqRef.current += 1;
			setFeedback({
				type: "result",
				result: r.result,
				id: scanSeqRef.current,
			});
		},
		onError: (e) => {
			setFeedback({
				type: "error",
				message: getUserFacingErrorMessage(e),
			});
		},
	});

	const runValidate = useCallback(
		(raw: string) => {
			const normalized = normalizeTicketCode(raw);
			if (normalized.length < 8) {
				setCodeError("El código del pase tiene al menos 8 caracteres.");
				setFeedback(null);
				return;
			}
			setCodeError(undefined);
			setCode(normalized);
			setFeedback({ type: "validating" });
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
		<div className="mx-auto max-w-md space-y-6">
			<div>
				<h1 className="display-title text-2xl font-semibold">
					Control de acceso
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Escanea el QR del asistente o escribe el código del pase.
				</p>
			</div>
			<div className="island-shell space-y-5 rounded-xl p-4 sm:p-6">
				<QrCameraScanner onScan={handleScan} busy={isPending}>
					<ScanFeedbackPanel feedback={feedback} />
				</QrCameraScanner>
				<form
					className="space-y-3"
					onSubmit={(e) => {
						e.preventDefault();
						runValidate(code);
					}}
				>
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
							enterKeyHint="done"
							spellCheck={false}
							aria-invalid={codeError ? true : undefined}
						/>
						<FieldError>{codeError}</FieldError>
					</div>
					<Button
						type="submit"
						className="w-full"
						disabled={code.trim().length < 8 || isPending}
					>
						{isPending ? "Validando…" : "Validar"}
					</Button>
				</form>
			</div>
		</div>
	);
}

function ScanFeedbackPanel({ feedback }: { feedback: ScanFeedback | null }) {
	if (!feedback) return null;

	if (feedback.type === "validating") {
		return (
			<output
				className="state-reveal flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-4 py-4 text-sm text-muted-foreground"
				aria-live="polite"
			>
				<Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
				Validando pase…
			</output>
		);
	}

	if (feedback.type === "error") {
		return (
			<output
				className="state-reveal block rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-4 text-center"
				aria-live="assertive"
			>
				<p className="text-base font-semibold text-destructive">
					No se pudo validar
				</p>
				<p className="mt-1 text-sm text-destructive/90">{feedback.message}</p>
			</output>
		);
	}

	const copy = resultCopy[feedback.result];
	const Icon =
		feedback.result === "VALID"
			? CheckCircle2
			: feedback.result === "ALREADY_USED"
				? TriangleAlert
				: XCircle;

	return (
		<output
			key={feedback.id}
			className={cn(
				"state-reveal block rounded-lg px-4 py-4 text-center",
				feedback.result === "VALID" && "bg-success text-success-foreground",
				feedback.result === "ALREADY_USED" &&
					"bg-warning text-warning-foreground",
				feedback.result === "INVALID" &&
					"bg-destructive text-destructive-foreground",
			)}
			aria-live="polite"
			aria-label={`Resultado: ${labelFor(qrResultLabel, feedback.result)}`}
		>
			<p className="inline-flex items-center justify-center gap-2 text-lg font-semibold">
				<Icon className="size-5 shrink-0" aria-hidden />
				{copy.title}
			</p>
			<p className="mt-1 text-sm">{copy.detail}</p>
		</output>
	);
}
