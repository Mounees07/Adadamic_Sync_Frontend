import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const sanitizeFileName = (fileName) =>
    String(fileName || 'export')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'export';

const downloadBlob = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
};

const normalizeColumns = (columns = []) =>
    columns.map((column) =>
        typeof column === 'string'
            ? { header: column, key: column }
            : column
    );

const getCellValue = (row, column) => {
    if (typeof column.accessor === 'function') {
        return column.accessor(row);
    }
    return row?.[column.key] ?? '';
};

const buildExportMatrix = (rows = [], columns = []) => {
    const normalizedColumns = normalizeColumns(columns);
    return {
        headers: normalizedColumns.map((column) => column.header),
        body: rows.map((row) =>
            normalizedColumns.map((column) => {
                const value = getCellValue(row, column);
                return value == null ? '' : value;
            })
        )
    };
};

export const exportToCsv = ({ fileName, rows = [], columns = [] }) => {
    const { headers, body } = buildExportMatrix(rows, columns);
    const csv = [headers, ...body]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    downloadBlob(
        new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
        `${sanitizeFileName(fileName)}.csv`
    );
};

export const exportToXlsx = ({ fileName, rows = [], columns = [], sheetName = 'Data' }) => {
    const { headers, body } = buildExportMatrix(rows, columns);
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...body]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
    XLSX.writeFile(workbook, `${sanitizeFileName(fileName)}.xlsx`);
};

export const exportToPdf = ({ fileName, title, rows = [], columns = [] }) => {
    const { headers, body } = buildExportMatrix(rows, columns);
    const doc = new jsPDF({ orientation: headers.length > 6 ? 'landscape' : 'portrait' });

    doc.setFontSize(14);
    doc.text(title || fileName || 'Export', 14, 16);

    autoTable(doc, {
        head: [headers],
        body,
        startY: 24,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [37, 99, 235] },
        margin: { left: 14, right: 14 }
    });

    doc.save(`${sanitizeFileName(fileName)}.pdf`);
};

export const exportData = ({ format, ...config }) => {
    if (format === 'xlsx') {
        exportToXlsx(config);
        return;
    }
    if (format === 'pdf') {
        exportToPdf(config);
        return;
    }
    exportToCsv(config);
};

