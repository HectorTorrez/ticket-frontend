import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export type ExportColumn<T> = {
	header: string;
	value: (row: T) => string | number;
};

export type ExportFormat = "csv" | "xlsx" | "pdf";

function rowsToMatrix<T>(rows: T[], columns: ExportColumn<T>[]) {
	return rows.map((row) => columns.map((col) => col.value(row)));
}

function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}

export function exportTableCsv<T>(
	rows: T[],
	columns: ExportColumn<T>[],
	filename: string,
) {
	const data = rowsToMatrix(rows, columns);
	const csv = Papa.unparse({
		fields: columns.map((c) => c.header),
		data,
	});
	const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
	downloadBlob(blob, `${filename}.csv`);
}

export function exportTableXlsx<T>(
	rows: T[],
	columns: ExportColumn<T>[],
	filename: string,
) {
	const data = rowsToMatrix(rows, columns);
	const sheet = XLSX.utils.aoa_to_sheet([
		columns.map((c) => c.header),
		...data,
	]);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, sheet, "Datos");
	XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportTablePdf<T>(
	rows: T[],
	columns: ExportColumn<T>[],
	filename: string,
	title: string,
) {
	const doc = new jsPDF({ orientation: "landscape" });
	doc.setFontSize(14);
	doc.text(title, 14, 16);
	autoTable(doc, {
		head: [columns.map((c) => c.header)],
		body: rowsToMatrix(rows, columns),
		startY: 22,
		styles: { fontSize: 9, cellPadding: 2 },
		headStyles: { fillColor: [55, 65, 81] },
	});
	doc.save(`${filename}.pdf`);
}

export function exportTable<T>(
	format: ExportFormat,
	rows: T[],
	columns: ExportColumn<T>[],
	filename: string,
	title: string,
) {
	switch (format) {
		case "csv":
			exportTableCsv(rows, columns, filename);
			break;
		case "xlsx":
			exportTableXlsx(rows, columns, filename);
			break;
		case "pdf":
			exportTablePdf(rows, columns, filename, title);
			break;
	}
}

export function exportFilename(base: string) {
	const date = new Date().toISOString().slice(0, 10);
	return `${base}-${date}`;
}
