 import { useState } from 'react';
 import * as XLSX from 'xlsx';
 import { ParsedBomRow } from '@/types/rfq';
 
 export const useBomUpload = () => {
   const [isProcessing, setIsProcessing] = useState(false);
   const [error, setError] = useState<string | null>(null);
 
   const parseFile = async (file: File): Promise<ParsedBomRow[]> => {
     setIsProcessing(true);
     setError(null);
 
     try {
       const extension = file.name.split('.').pop()?.toLowerCase();
       
       if (extension === 'csv') {
         return await parseCsv(file);
       } else if (extension === 'xlsx' || extension === 'xls') {
         return await parseExcel(file);
       } else {
         throw new Error('Unsupported file format. Please upload .xlsx, .xls, or .csv');
       }
     } catch (err) {
       const message = err instanceof Error ? err.message : 'Failed to parse file';
       setError(message);
       throw err;
     } finally {
       setIsProcessing(false);
     }
   };
 
   const parseCsv = async (file: File): Promise<ParsedBomRow[]> => {
     const text = await file.text();
     const lines = text.split('\n').filter(line => line.trim());
     
     if (lines.length < 2) {
       throw new Error('CSV file must have a header row and at least one data row');
     }
 
     const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
     const rows: ParsedBomRow[] = [];
 
     for (let i = 1; i < lines.length; i++) {
       const values = lines[i].split(',').map(v => v.trim());
       const row = mapRowToStruct(headers, values, i);
       if (row) rows.push(row);
     }
 
     return rows;
   };
 
   const parseExcel = async (file: File): Promise<ParsedBomRow[]> => {
     const buffer = await file.arrayBuffer();
     const workbook = XLSX.read(buffer, { type: 'array' });
     const sheetName = workbook.SheetNames[0];
     const sheet = workbook.Sheets[sheetName];
     const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
 
     if (data.length < 2) {
       throw new Error('Excel file must have a header row and at least one data row');
     }
 
     const headerRow = data[0] || [];
     const headers = headerRow.map(h => String(h || '').trim().toLowerCase());
     const rows: ParsedBomRow[] = [];
 
     for (let i = 1; i < data.length; i++) {
       const rowData = data[i] || [];
       const values = rowData.map(v => String(v ?? '').trim());
       const row = mapRowToStruct(headers, values, i);
       if (row) rows.push(row);
     }
 
     return rows;
   };
 
   const mapRowToStruct = (headers: string[], values: string[], lineNumber: number): ParsedBomRow | null => {
     const getValue = (possibleNames: string[]): string => {
       for (const name of possibleNames) {
         const idx = headers.findIndex(h => h.includes(name));
         if (idx !== -1 && values[idx]) return values[idx];
       }
       return '';
     };
 
     const description = getValue(['description', 'item', 'product', 'material', 'name']);
     const quantityStr = getValue(['quantity', 'qty', 'nos', 'units', 'pcs']);
     
     if (!description) return null;
 
     const quantity = parseFloat(quantityStr) || 1;
     const unit = getValue(['unit', 'uom']) || 'Nos';
     const preferredBrand = getValue(['brand', 'make', 'manufacturer']);
     const ratingSpecs = getValue(['rating', 'spec', 'specification', 'size', 'capacity']);
     const targetPriceStr = getValue(['price', 'rate', 'target', 'budget']);
     const targetPrice = targetPriceStr ? parseFloat(targetPriceStr.replace(/[^0-9.]/g, '')) : undefined;
 
     return {
       lineNumber,
       description,
       quantity,
       unit,
       preferredBrand: preferredBrand || undefined,
       ratingSpecs: ratingSpecs || undefined,
       targetPrice: targetPrice && !isNaN(targetPrice) ? targetPrice : undefined,
     };
   };
 
   return {
     parseFile,
     isProcessing,
     error,
   };
 };