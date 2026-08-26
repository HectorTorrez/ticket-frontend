import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2, TriangleAlert, XCircle } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { z } from "zod";
import { QrCameraScanner } from "#/components/qr-camera-scanner";
import type { StatusTone } from "#/components/status-indicator";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { FieldError } from "#/components/ui/field-message";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { getUserFacingErrorMessage } from "#/lib/api/errors";
import type { qrValidateResultSchema } from "#/lib/api/schemas";
import { validateQrCode } from "#/lib/api/ticket-api";
import { labelFor, qrResultLabel, ticketTierLabel } from "#/lib/labels";
import { normalizeTicketCode } from "#/lib/ticket-code";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/dashboard/scanner/")({
	component: ScannerPage,
});

type ScanResult = "VALID" | "ALREADY_USED" | "INVALID";

type QrTicketContext = NonNullable<
	z.infer<typeof qrValidateResultSchema>["ticket"]
>;

type ScanPhase =
	| { status: "idle" }
	| { status: "validating"; code: string }
	| {
			status: "result";
			result: ScanResult;
			code: string;
			ticket?: QrTicketContext;
	  }
	| { status: "error"; message: string; code?: string };

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
	const [phase, setPhase] = useState<ScanPhase>({ status: "idle" });
	const [scanSession, setScanSession] = useState(0);
	const pendingCodeRef = useRef<string | null>(null);

	const scanLocked = phase.status !== "idle";

	const { mutate, isPending } = useMutation({
		mutationFn: (raw: string) => validateQrCode(normalizeTicketCode(raw)),
		onSuccess: (r) => {
			setCodeError(undefined);
			const validatedCode = pendingCodeRef.current ?? code;
			setPhase({
				status: "result",
				result: r.result,
				code: validatedCode,
				ticket: r.ticket,
			});
		},
		onError: (e) => {
			setPhase({
				status: "error",
				message: getUserFacingErrorMessage(e),
				code: pendingCodeRef.current ?? undefined,
			});
		},
		onSettled: () => {
			pendingCodeRef.current = null;
		},
	});

	const runValidate = useCallback(
		(raw: string) => {
			if (scanLocked || isPending) return;

			const normalized = normalizeTicketCode(raw);
			if (normalized.length < 8) {
				setCodeError("El código del pase tiene al menos 8 caracteres.");
				return;
			}

			setCodeError(undefined);
			setCode(normalized);
			pendingCodeRef.current = normalized;
			setPhase({ status: "validating", code: normalized });
			mutate(raw);
		},
		[isPending, mutate, scanLocked],
	);

	const handleScan = useCallback(
		(decoded: string) => {
			runValidate(decoded);
		},
		[runValidate],
	);

	const dismissScanResult = useCallback(() => {
		setPhase({ status: "idle" });
		setScanSession((n) => n + 1);
	}, []);

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
				<QrCameraScanner
					onScan={handleScan}
					busy={scanLocked}
					scanSession={scanSession}
				/>
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
							disabled={scanLocked}
							aria-invalid={codeError ? true : undefined}
						/>
						<FieldError>{codeError}</FieldError>
					</div>
					<Button
						type="submit"
						className="w-full"
						disabled={code.trim().length < 8 || scanLocked}
					>
						{isPending ? "Validando…" : "Validar"}
					</Button>
				</form>
			</div>

			<ScanResultDialog phase={phase} onDismiss={dismissScanResult} />
		</div>
	);
}

function ScanResultDialog({
	phase,
	onDismiss,
}: {
	phase: ScanPhase;
	onDismiss: () => void;
}) {
	const open = phase.status !== "idle";

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next && phase.status !== "validating") onDismiss();
			}}
		>
			<DialogContent
				showCloseButton={phase.status !== "validating"}
				className={cn(
					phase.status === "result" &&
						phase.result === "VALID" &&
						"border-success/40",
					phase.status === "result" &&
						phase.result === "ALREADY_USED" &&
						"border-warning/40",
					phase.status === "result" &&
						phase.result === "INVALID" &&
						"border-destructive/40",
				)}
				onPointerDownOutside={(e) => {
					if (phase.status === "validating") e.preventDefault();
				}}
				onEscapeKeyDown={(e) => {
					if (phase.status === "validating") e.preventDefault();
				}}
			>
				{phase.status === "validating" ? (
					<DialogHeader className="items-center text-center">
						<Loader2
							className="mx-auto size-10 animate-spin text-muted-foreground"
							aria-hidden
						/>
						<DialogTitle>Validando pase</DialogTitle>
						<DialogDescription>
							Consultando el código{" "}
							<span className="font-mono">{phase.code}</span>…
						</DialogDescription>
					</DialogHeader>
				) : null}

				{phase.status === "error" ? (
					<>
						<DialogHeader className="items-center text-center">
							<XCircle
								className="mx-auto size-12 text-destructive"
								aria-hidden
							/>
							<DialogTitle>No se pudo validar</DialogTitle>
							<DialogDescription>{phase.message}</DialogDescription>
						</DialogHeader>
						<DialogFooter className="sm:justify-center">
							<Button
								type="button"
								className="w-full sm:w-auto"
								onClick={onDismiss}
							>
								Intentar de nuevo
							</Button>
						</DialogFooter>
					</>
				) : null}

				{phase.status === "result" ? (
					<ScanResultBody
						result={phase.result}
						ticket={phase.ticket}
						onDismiss={onDismiss}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

function ScanResultBody({
	result,
	ticket,
	onDismiss,
}: {
	result: ScanResult;
	ticket?: QrTicketContext;
	onDismiss: () => void;
}) {
	const copy = resultCopy[result];
	const Icon =
		result === "VALID"
			? CheckCircle2
			: result === "ALREADY_USED"
				? TriangleAlert
				: XCircle;

	return (
		<>
			<DialogHeader className="items-center text-center">
				<Icon
					className={cn(
						"mx-auto size-14",
						result === "VALID" && "text-success",
						result === "ALREADY_USED" && "text-warning",
						result === "INVALID" && "text-destructive",
					)}
					aria-hidden
				/>
				<DialogTitle
					className={cn(
						"text-xl",
						result === "VALID" && "text-success",
						result === "ALREADY_USED" && "text-warning",
						result === "INVALID" && "text-destructive",
					)}
				>
					{copy.title}
				</DialogTitle>
				<DialogDescription className="text-base text-foreground/80">
					{copy.detail}
				</DialogDescription>
			</DialogHeader>
			{ticket ? (
				<dl className="space-y-2 rounded-lg border border-border/80 bg-muted/30 px-4 py-3 text-sm">
					<div className="flex justify-between gap-3">
						<dt className="text-muted-foreground">Evento</dt>
						<dd className="text-right font-medium">{ticket.eventTitle}</dd>
					</div>
					<div className="flex justify-between gap-3">
						<dt className="text-muted-foreground">Entrada</dt>
						<dd className="text-right">
							{ticket.ticketTypeName} ({labelFor(ticketTierLabel, ticket.tier)})
						</dd>
					</div>
					<div className="flex justify-between gap-3">
						<dt className="text-muted-foreground">Titular</dt>
						<dd className="text-right break-all">{ticket.holderEmail}</dd>
					</div>
				</dl>
			) : null}
			<output
				className="sr-only"
				aria-live="polite"
				aria-label={`Resultado: ${labelFor(qrResultLabel, result)}`}
			>
				{copy.title}. {copy.detail}
			</output>
			<DialogFooter className="sm:justify-center">
				<Button type="button" className="w-full sm:w-auto" onClick={onDismiss}>
					Escanear siguiente pase
				</Button>
			</DialogFooter>
		</>
	);
}
