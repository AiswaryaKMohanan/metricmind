"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

type PreviewRow = {
  date: string;
  revenue: number;
  users: number;
  conversions: number;
};

function parseDateValue(value: unknown): Date {
  if (value === null || value === undefined) {
    throw new Error("Date value is missing.");
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "number") {
    const excelEpoch = new Date((value - 25569) * 86400 * 1000);
    return excelEpoch;
  }

  const stringValue = String(value).trim();

  if (!stringValue) {
    throw new Error("Date value is missing.");
  }

  const normalizedValue = stringValue.replace(/\//g, "-");
  const parsedDate = new Date(normalizedValue);

  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  const alternateParsedDate = new Date(`${normalizedValue}T00:00:00`);

  if (!Number.isNaN(alternateParsedDate.getTime())) {
    return alternateParsedDate;
  }

  throw new Error(`Invalid date value: ${stringValue}`);
}

const REQUIRED_HEADERS = [
  "date",
  "revenue",
  "users",
  "conversions",
] as const;

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const previewCount = useMemo(() => previewRows.length, [previewRows]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      setPreviewRows([]);
      return;
    }

    const extension = selectedFile.name.split(".").pop()?.toLowerCase();

    if (!extension || !["csv", "xlsx", "xls"].includes(extension)) {
      toast.error("Please upload a CSV or Excel file.");
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });

      if (!rows.length) {
        throw new Error("The uploaded file does not contain any rows.");
      }

      const normalizedRows = rows.map((row) =>
        Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            String(key).trim().toLowerCase(),
            value,
          ])
        )
      );

      const firstRow = normalizedRows[0];
      const missingHeaders = REQUIRED_HEADERS.filter(
        (header) => !(header in firstRow)
      );

      if (missingHeaders.length > 0) {
        throw new Error(
          `Missing required columns: ${missingHeaders.join(", ")}`
        );
      }

      const parsedRows: PreviewRow[] = normalizedRows.map((row) => {
        const dateValue = row.date;
        const revenueValue = Number(row.revenue);
        const usersValue = Number(row.users);
        const conversionsValue = Number(row.conversions);

        const parsedDate = parseDateValue(dateValue);

        if ([revenueValue, usersValue, conversionsValue].some(Number.isNaN)) {
          throw new Error(
            "One of the rows has invalid revenue, users, or conversions values."
          );
        }

        return {
          date: parsedDate.toISOString().slice(0, 10),
          revenue: revenueValue,
          users: usersValue,
          conversions: conversionsValue,
        };
      });

      setPreviewRows(parsedRows.slice(0, 5));
      toast.success("File parsed successfully. Review the preview below.");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "The file could not be parsed."
      );
      setPreviewRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/metrics/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed.");
      }

      toast.success(`Imported ${data.count} metric rows successfully.`);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong while uploading the file."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Upload CSV / Excel</h1>
        <p className="text-slate-600">
          Upload a CSV, XLS, or XLSX file to import your business metrics.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-8 text-center transition hover:border-indigo-500 hover:bg-slate-50">
          <span className="text-sm font-semibold text-slate-700">
            {file ? file.name : "Choose a CSV or Excel file"}
          </span>
          <span className="mt-2 text-xs text-slate-500">
            Supported formats: CSV, XLS, XLSX
          </span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || isUploading || isParsing}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isUploading ? "Uploading..." : "Upload & Save"}
          </button>

          {isParsing && (
            <span className="text-sm text-slate-500">Parsing file...</span>
          )}
        </div>
      </div>

      {previewRows.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Preview</h2>
            <span className="text-sm text-slate-500">
              Showing {previewCount} sample rows
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-900">
                <tr>
                  <th className="px-3 py-2 font-semibold">Date</th>
                  <th className="px-3 py-2 font-semibold">Revenue</th>
                  <th className="px-3 py-2 font-semibold">Users</th>
                  <th className="px-3 py-2 font-semibold">Conversions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-slate-900">
                {previewRows.map((row, index) => (
                  <tr key={`${row.date}-${index}`}>
                    <td className="px-3 py-2">{row.date}</td>
                    <td className="px-3 py-2">{row.revenue}</td>
                    <td className="px-3 py-2">{row.users}</td>
                    <td className="px-3 py-2">{row.conversions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}