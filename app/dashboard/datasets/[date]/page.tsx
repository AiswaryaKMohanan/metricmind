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

  const { data: metrics = [], isLoading } = useQuery({
    queryKey: ["metrics"],
    queryFn: async () => {
      const res = await fetch("/api/metrics");
      if (!res.ok) throw new Error("Failed to fetch dataset details");
      return res.json();
    },
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

    return {
      rows,
      totalRevenue,
      totalUsers,
      totalConversions,
    };
  }, [batchDate, metrics]);

  if (isLoading) {
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
