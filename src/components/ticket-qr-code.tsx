import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { ticketCheckUrl } from "#/lib/ticket-code";

type TicketQrCodeProps = {
	publicCode: string;
	size?: number;
	alt: string;
	className?: string;
};

export function TicketQrCode({
	publicCode,
	size = 140,
	alt,
	className,
}: TicketQrCodeProps) {
	const [dataUrl, setDataUrl] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		const url = ticketCheckUrl(publicCode);

		void QRCode.toDataURL(url, {
			width: size,
			margin: 1,
			errorCorrectionLevel: "M",
		}).then((value) => {
			if (!cancelled) setDataUrl(value);
		});

		return () => {
			cancelled = true;
		};
	}, [publicCode, size]);

	if (!dataUrl) {
		return (
			<div
				className={className}
				style={{ width: size, height: size }}
				aria-hidden
			/>
		);
	}

	return (
		<img
			src={dataUrl}
			alt={alt}
			width={size}
			height={size}
			className={className}
		/>
	);
}
