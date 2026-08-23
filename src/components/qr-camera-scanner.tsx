import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";

import { Button } from "#/components/ui/button";

type QrCameraScannerProps = {
	onScan: (decoded: string) => void;
	/** Pause new reads without tearing down the camera stream. */
	busy?: boolean;
	children?: ReactNode;
};

/** Minimal surface used by this component; E2E can replace the ctor on `window`. */
type ScannerInstance = {
	start: (
		cameraIdOrConfig: string | MediaTrackConstraints,
		configuration: {
			fps: number;
			qrbox:
				| { width: number; height: number }
				| ((
						viewfinderWidth: number,
						viewfinderHeight: number,
				  ) => {
						width: number;
						height: number;
				  });
			aspectRatio?: number;
		},
		qrCodeSuccessCallback: (decodedText: string) => void,
		qrCodeErrorCallback?: (errorMessage: string) => void,
	) => Promise<null>;
	stop: () => Promise<void>;
	clear: () => void;
};

type ScannerCtor = new (elementId: string) => ScannerInstance;

function resolveScannerCtor(): ScannerCtor {
	const override = (window as Window & { __E2E_Html5Qrcode?: ScannerCtor })
		.__E2E_Html5Qrcode;
	return override ?? (Html5Qrcode as unknown as ScannerCtor);
}

function cameraErrorMessage(error: unknown): string {
	const raw = error instanceof Error ? error.message : String(error ?? "");
	const lower = raw.toLowerCase();
	if (
		lower.includes("notallowed") ||
		lower.includes("permission") ||
		lower.includes("denied")
	) {
		return "El navegador bloqueó la cámara. Concede el permiso y pulsa de nuevo.";
	}
	if (
		lower.includes("notfound") ||
		lower.includes("requested device not found") ||
		lower.includes("no camera")
	) {
		return "No encontramos una cámara en este dispositivo.";
	}
	if (
		lower.includes("notreadable") ||
		lower.includes("trackstart") ||
		lower.includes("in use")
	) {
		return "La cámara está ocupada por otra aplicación. Ciérrala y vuelve a intentar.";
	}
	if (lower.includes("secure") || lower.includes("https")) {
		return "La cámara solo funciona en una conexión segura (HTTPS).";
	}
	return "No se pudo abrir la cámara. Comprueba el permiso e inténtalo de nuevo.";
}

function viewfinderBox(viewfinderWidth: number, viewfinderHeight: number) {
	const edge = Math.min(viewfinderWidth, viewfinderHeight);
	const size = Math.max(180, Math.floor(edge * 0.72));
	return { width: size, height: size };
}

export function QrCameraScanner({
	onScan,
	busy = false,
	children,
}: QrCameraScannerProps) {
	const regionId = useId().replace(/:/g, "");
	const scannerRef = useRef<ScannerInstance | null>(null);
	const lastScanRef = useRef("");
	const busyRef = useRef(busy);
	const onScanRef = useRef(onScan);
	const [active, setActive] = useState(false);
	const [cameraError, setCameraError] = useState<string | null>(null);

	busyRef.current = busy;
	onScanRef.current = onScan;

	useEffect(() => {
		if (!active) return;

		const scanner = new (resolveScannerCtor())(regionId);
		scannerRef.current = scanner;
		let cancelled = false;

		void scanner
			.start(
				{ facingMode: "environment" },
				{ fps: 10, qrbox: viewfinderBox, aspectRatio: 1.333 },
				(decoded) => {
					if (cancelled || busyRef.current) return;
					if (decoded === lastScanRef.current) return;
					lastScanRef.current = decoded;
					onScanRef.current(decoded);
				},
				() => {
					// Ignore per-frame scan misses.
				},
			)
			.catch((e: unknown) => {
				if (!cancelled) {
					setCameraError(cameraErrorMessage(e));
					setActive(false);
				}
			});

		return () => {
			cancelled = true;
			const instance = scannerRef.current;
			scannerRef.current = null;
			if (!instance) return;
			void instance
				.stop()
				.then(() => instance.clear())
				.catch(() => {});
		};
	}, [active, regionId]);

	return (
		<div className="space-y-3">
			<div className="qr-stage overflow-hidden rounded-lg border bg-muted/30">
				{active ? (
					<div className="relative">
						<div id={regionId} className="qr-stage__viewport" />
						<div className="qr-viewfinder" aria-hidden>
							<span className="qr-viewfinder__corner qr-viewfinder__corner--tl" />
							<span className="qr-viewfinder__corner qr-viewfinder__corner--tr" />
							<span className="qr-viewfinder__corner qr-viewfinder__corner--bl" />
							<span className="qr-viewfinder__corner qr-viewfinder__corner--br" />
						</div>
					</div>
				) : (
					<div className="flex min-h-[min(68vw,22rem)] flex-col items-center justify-center gap-2 px-5 py-8 text-center sm:min-h-[220px]">
						<CameraOff className="size-8 opacity-40" aria-hidden />
						{cameraError ? (
							<p className="max-w-xs text-sm text-destructive" role="alert">
								{cameraError}
							</p>
						) : (
							<p className="max-w-xs text-sm text-muted-foreground">
								Apunta la cámara al código QR del pase.
							</p>
						)}
					</div>
				)}
			</div>
			{children}
			<Button
				type="button"
				variant={active ? "outline" : "default"}
				className="w-full"
				onClick={() => {
					lastScanRef.current = "";
					setCameraError(null);
					setActive((prev) => !prev);
				}}
			>
				<Camera className="size-4" />
				{active ? "Detener cámara" : "Escanear con cámara"}
			</Button>
		</div>
	);
}
