import * as XLSX from 'xlsx';

const normalizeHeader = (value) =>
    String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

export const parseSpreadsheetFile = async (file) => {
    if (!file) {
        throw new Error('Please choose a file to import.');
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx'].includes(extension)) {
        throw new Error('Only CSV and XLSX files are supported.');
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
        throw new Error('The uploaded file does not contain any readable sheet.');
    }

    const rawRows = XLSX.utils.sheet_to_json(worksheet, {
        defval: '',
        raw: false
    });

    return rawRows.map((row) =>
        Object.fromEntries(
            Object.entries(row).map(([key, value]) => [normalizeHeader(key), value])
        )
    );
};

export const validateImportedRows = (rows, requiredFields = []) => {
    if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('The uploaded file is empty.');
    }

    const normalizedRequiredFields = requiredFields.map(normalizeHeader);
    const firstRow = rows[0] || {};
    const missingColumns = normalizedRequiredFields.filter((field) => !(field in firstRow));

    if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    const invalidRowIndex = rows.findIndex((row) =>
        normalizedRequiredFields.some((field) => String(row[field] || '').trim() === '')
    );

    if (invalidRowIndex >= 0) {
        throw new Error(`Row ${invalidRowIndex + 2} is missing one or more required values.`);
    }

    return rows;
};

