"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

type MetricRecord = {
  id: string;
  date: string;
  revenue: number;
  users: number;
  conversions: number;
  createdAt: string;
};

export default function DatasetDetailPage() {
  const params = useParams<{ date: string }>();
  const batchDate = decodeURIComponent(params.date ?? "");

  const { data: metrics = [], isLoading: isMetricsLoading } = useQuery({
    queryKey: ["metrics"],
    queryFn: async () => {
      const res = await fetch("/api/metrics");
      if (!res.ok) throw new Error("Failed to fetch dataset details");
      return res.json();
    },
  });

  const { data: insights, isLoading: isInsightsLoading } = useQuery({
    queryKey: ["dataset-insights", batchDate],
    queryFn: async () => {
      const res = await fetch(`/api/metrics/insights?date=${encodeURIComponent(batchDate)}`);
      if (!res.ok) throw new Error("Failed to fetch insights");
      return res.json();
    },
    enabled: Boolean(batchDate),
  });

  const dataset = useMemo(() => {
    const rows = (metrics as MetricRecord[]).filter((metric) => {
      const createdDate = new Date(metric.createdAt).toISOString().slice(0, 10);
      return createdDate === batchDate;
    });

    const totalRevenue = rows.reduce((sum, row) => sum + Number(row.revenue), 0);
    const totalUsers = rows.reduce((sum, row) => sum + Number(row.users), 0);
    const totalConversions = rows.reduce(
      (sum, row) => sum + Number(row.conversions),
      0
    );
    const averageRevenue = rows.length ? totalRevenue / rows.length : 0;
    const averageUsers = rows.length ? totalUsers / rows.length : 0;

    return {
      rows,
      totalRevenue,
      totalUsers,
      totalConversions,
      averageRevenue,
      averageUsers,
    };
  }, [batchDate, metrics]);

  const exportCsv = () => {
    if (!dataset.rows.length) return;

    const headers = ["date", "revenue", "users", "conversions"];
    const csvRows = dataset.rows.map((row) => [
      row.date,
      row.revenue,
      row.users,
      row.conversions,
    ]);

    const csvContent = [headers, ...csvRows]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dataset-${batchDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportReport = () => {
    if (!dataset.rows.length) return;

    const reportHtml = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { margin-bottom: 8px; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0; }
            .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
            th { background: #f9fafb; }
          </style>
        </head>
        <body>
          <h1>MetricMind Report</h1>
          <p><strong>Dataset:</strong> ${batchDate}</p>
          <div class="summary">
            <div class="card"><strong>Rows</strong><br />${dataset.rows.length}</div>
            <div class="card"><strong>Total Revenue</strong><br />${dataset.totalRevenue.toFixed(2)}</div>
            <div class="card"><strong>Total Users</strong><br />${dataset.totalUsers}</div>
          </div>
          <p><strong>Insight:</strong> ${insights?.insightText ?? "No insight available."}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Revenue</th>
                <th>Users</th>
                <th>Conversions</th>
              </tr>
            </thead>
            <tbody>
              ${dataset.rows
                .map(
                  (row) => `
                    <tr>
                      <td>${new Date(row.date).toISOString().slice(0, 10)}</td>
                      <td>${row.revenue}</td>
                      <td>${row.users}</td>
                      <td>${row.conversions}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([reportHtml], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `report-${batchDate}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isMetricsLoading || isInsightsLoading) {
    return <p>Loading dataset details...</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-2">
        <Link href="/dashboard/datasets" className="text-sm font-medium text-indigo-600">
          ← Back to datasets
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">
          Dataset detail: {batchDate}
        </h1>
        <p className="text-slate-600">
          Review the exact metrics that were imported in this batch.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm text-slate-500">Rows</div>
          <div className="text-2xl font-semibold">{dataset.rows.length}</div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm text-slate-500">Total revenue</div>
          <div className="text-2xl font-semibold">{dataset.totalRevenue}</div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm text-slate-500">Total users</div>
          <div className="text-2xl font-semibold">{dataset.totalUsers}</div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">AI insight</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportCsv}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Export CSV
            </button>
            <button
              onClick={exportReport}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
            >
              Download Full Report
            </button>
          </div>
        </div>
        <p className="mt-3 text-slate-700">{insights?.insightText ?? "No insight generated yet."}</p>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-600">Trend</div>
            <p className="mt-1 text-sm text-slate-700">
              {insights?.trendNarrative ?? "No trend summary available."}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-600">Recommendation</div>
            <p className="mt-1 text-sm text-slate-700">
              {insights?.recommendation ?? "No recommendation available."}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-semibold text-slate-900">Report summary</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Avg revenue</div>
            <div className="text-lg font-semibold">{dataset.averageRevenue.toFixed(2)}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Avg users</div>
            <div className="text-lg font-semibold">{dataset.averageUsers.toFixed(2)}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Conversions</div>
            <div className="text-lg font-semibold">{dataset.totalConversions}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Batch records</h2>
          <span className="text-sm text-slate-500">
            Conversions: {dataset.totalConversions}
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
              {dataset.rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2">
                    {new Date(row.date).toISOString().slice(0, 10)}
                  </td>
                  <td className="px-3 py-2">{row.revenue}</td>
                  <td className="px-3 py-2">{row.users}</td>
                  <td className="px-3 py-2">{row.conversions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
