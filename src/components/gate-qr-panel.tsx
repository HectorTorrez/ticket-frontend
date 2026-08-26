import { Maximize2, Minimize2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { TicketQrCode } from "#/components/ticket-qr-code";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

type GateQrPanelProps = {
	publicCode: string;
	alt: string;
	eventTitle?: string;
	size?: number;
	className?: string;
};

export function GateQrPanel({
	publicCode,
	alt,
	eventTitle,
	size = 180,
	className,
}: GateQrPanelProps) {
	const panelRef = useRef<HTMLDivElement>(null);
	const [isFullscreen, setIsFullscreen] = useState(false);

	useEffect(() => {
		const onChange = () => {
			setIsFullscreen(document.fullscreenElement === panelRef.current);
		};
		document.addEventListener("fullscreenchange", onChange);
		return () => document.removeEventListener("fullscreenchange", onChange);
	}, []);

	const toggleFullscreen = useCallback(async () => {
		const node = panelRef.current;
		if (!node) return;
		if (document.fullscreenElement === node) {
			await document.exitFullscreen();
			return;
		}
		await node.requestFullscreen();
	}, []);

	const qrSize = isFullscreen ? Math.min(320, window.innerWidth - 48) : size;

	return (
		<div
			ref={panelRef}
			className={cn(
				"flex flex-col items-center gap-3",
				isFullscreen &&
					"min-h-dvh justify-center bg-white px-6 py-10 text-foreground dark:bg-zinc-950",
				className,
			)}
		>
			{isFullscreen && eventTitle ? (
				<p className="display-title max-w-md text-center text-xl font-semibold">
					{eventTitle}
				</p>
			) : null}
			<div
				className={cn(
					"rounded-lg border border-border bg-white p-3 shadow-sm",
					isFullscreen && "border-0 p-4 shadow-none",
				)}
			>
				<TicketQrCode
					publicCode={publicCode}
					size={qrSize}
					alt={alt}
					className="rounded"
				/>
			</div>
			<Button
				type="button"
				variant={isFullscreen ? "default" : "outline"}
				size="sm"
				className="gap-2"
				onClick={() => void toggleFullscreen()}
			>
				{isFullscreen ? (
					<>
						<Minimize2 className="size-4" aria-hidden />
						Salir de pantalla completa
					</>
				) : (
					<>
						<Maximize2 className="size-4" aria-hidden />
						Mostrar en puerta
					</>
				)}
			</Button>
		</div>
	);
}
