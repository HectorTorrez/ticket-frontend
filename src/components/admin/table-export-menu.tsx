import { DownloadIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
	type ExportColumn,
	type ExportFormat,
	exportFilename,
	exportTable,
} from "#/lib/export/table-export";

type TableExportMenuProps<T> = {
	title: string;
	filenameBase: string;
	columns: ExportColumn<T>[];
	pageRows: T[];
	pageCount: number;
	totalCount: number;
	fetchAllRows: () => Promise<T[]>;
	disabled?: boolean;
};

const FORMAT_LABELS: Record<ExportFormat, string> = {
	csv: "CSV",
	xlsx: "Excel (XLSX)",
	pdf: "PDF",
};

export function TableExportMenu<T>({
	title,
	filenameBase,
	columns,
	pageRows,
	pageCount,
	totalCount,
	fetchAllRows,
	disabled,
}: TableExportMenuProps<T>) {
	const [loading, setLoading] = useState(false);

	async function handleExport(format: ExportFormat, scope: "page" | "all") {
		setLoading(true);
		try {
			const rows = scope === "page" ? pageRows : await fetchAllRows();
			if (rows.length === 0) {
				toast.info("No hay datos para exportar");
				return;
			}
			const suffix = scope === "page" ? "pagina" : "todos";
			exportTable(
				format,
				rows,
				columns,
				exportFilename(`${filenameBase}-${suffix}`),
				title,
			);
			toast.success(
				scope === "page"
					? `Exportados ${rows.length} registros de la página`
					: `Exportados ${rows.length} registros en total`,
			);
		} catch {
			toast.error("No se pudo exportar los datos");
		} finally {
			setLoading(false);
		}
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={disabled || loading || totalCount === 0}
				>
					{loading ? (
						<Loader2Icon className="size-4 animate-spin" />
					) : (
						<DownloadIcon className="size-4" />
					)}
					Exportar
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel>Página actual ({pageCount})</DropdownMenuLabel>
				<DropdownMenuGroup>
					{(["csv", "xlsx", "pdf"] as const).map((format) => (
						<DropdownMenuItem
							key={`page-${format}`}
							disabled={loading || pageCount === 0}
							onSelect={() => void handleExport(format, "page")}
						>
							{FORMAT_LABELS[format]}
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuLabel>Todos los datos ({totalCount})</DropdownMenuLabel>
				<DropdownMenuGroup>
					{(["csv", "xlsx", "pdf"] as const).map((format) => (
						<DropdownMenuItem
							key={`all-${format}`}
							disabled={loading || totalCount === 0}
							onSelect={() => void handleExport(format, "all")}
						>
							{FORMAT_LABELS[format]}
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
