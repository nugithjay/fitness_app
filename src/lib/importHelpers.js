import Papa from "papaparse";
import * as XLSX from "xlsx";

export const normHeader = (h) => String(h || "").toLowerCase().replace(/[^a-z]/g, "");

export function guessColumn(headers, keywords, excludeKeywords = []) {
  for (const h of headers) {
    const n = normHeader(h);
    if (keywords.some((k) => n.includes(k)) && !excludeKeywords.some((k) => n.includes(k))) return h;
  }
  return "";
}

export function parseFlexibleDate(str) {
  if (!str) return null;
  const d = new Date(String(str).trim());
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export async function parseSpreadsheetFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "xlsx" || ext === "xls") {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    return {
      sheetNames: wb.SheetNames,
      getSheet: (name) => {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" });
        const headers = rows.length ? Object.keys(rows[0]) : [];
        return { headers, rows };
      },
    };
  }
  const text = await file.text();
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  const headers = parsed.meta.fields || [];
  return { sheetNames: null, getSheet: () => ({ headers, rows: parsed.data }) };
}
