import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";

type QrCameraScannerProps = {
	onScan: (decoded: string) => void;
	disabled?: boolean;
};

/** Minimal surface used by this component; E2E can replace the ctor on `window`. */
type ScannerInstance = {
	start: (
		cameraIdOrConfig: string | MediaTrackConstraints,
		configuration: { fps: number; qrbox: { width: number; height: number } },
		qrCodeSuccessCallback: (decodedText: string) => void,
		qrCodeErrorCallback?: (errorMessage: string) => void,
	) => Promise<null>;
	stop: () => Promise<void>;
	clear: () => void;
};

type ScannerCtor = new (elementId: string) => ScannerInstance;

function resolveScannerCtor(): ScannerCtor {
	const override = (
		window as Window & { __E2E_Html5Qrcode?: ScannerCtor }
	).__E2E_Html5Qrcode;
	return override ?? (Html5Qrcode as unknown as ScannerCtor);
}

export function QrCameraScanner({ onScan, disabled = false }: QrCameraScannerProps) {
	const regionId = useId().replace(/:/g, "");
	const scannerRef = useRef<ScannerInstance | null>(null);
	const lastScanRef = useRef("");
	const [active, setActive] = useState(false);

	useEffect(() => {
		if (!active || disabled) return;

		const scanner = new (resolveScannerCtor())(regionId);
		scannerRef.current = scanner;
		let cancelled = false;

		void scanner
			.start(
				{ facingMode: "environment" },
				{ fps: 10, qrbox: { width: 220, height: 220 } },
				(decoded) => {
					if (cancelled || decoded === lastScanRef.current) return;
					lastScanRef.current = decoded;
					onScan(decoded);
				},
				() => {
					// Ignore per-frame scan misses.
				},
			)
			.catch((e: unknown) => {
				if (!cancelled) {
					toast.error(
						e instanceof Error
							? e.message
							: "No se pudo acceder a la cámara",
					);
					setActive(false);
				}
			});

		return () => {
			cancelled = true;
			const instance = scannerRef.current;
			scannerRef.current = null;
			if (!instance) return;
			void instance.stop().then(() => instance.clear()).catch(() => {});
		};
	}, [active, disabled, onScan, regionId]);

	useEffect(() => {
		if (disabled && active) setActive(false);
	}, [disabled, active]);

	return (
		<div className="space-y-3">
			<div className="overflow-hidden rounded-lg border bg-muted/30">
				{active ? (
					<div id={regionId} className="min-h-[220px] w-full" />
				) : (
					<div className="flex min-h-[220px] flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
						<CameraOff className="size-8 opacity-40" />
						<p>Activa la cámara para escanear el QR de la entrada.</p>
					</div>
				)}
			</div>
			<Button
				type="button"
				variant={active ? "outline" : "default"}
				className="w-full"
				disabled={disabled}
				onClick={() => {
					lastScanRef.current = "";
					setActive((prev) => !prev);
				}}
			>
				<Camera className="size-4" />
				{active ? "Detener cámara" : "Escanear con cámara"}
			</Button>
		</div>
	);
}
