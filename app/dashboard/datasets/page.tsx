"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MetricRecord = {
  id: string;
  date: string;
  revenue: number;
  users: number;
  conversions: number;
  createdAt: string;
};

export default function DatasetsPage() {
  const { data: metrics = [], isLoading } = useQuery({
    queryKey: ["metrics"],
    queryFn: async () => {
      const res = await fetch("/api/metrics");
      if (!res.ok) throw new Error("Failed to fetch datasets");
      return res.json();
    },
  });

  const datasets = useMemo(() => {
    const groups = new Map<string, {
      createdAt: string;
      rows: MetricRecord[];
      totalRevenue: number;
      totalUsers: number;
      totalConversions: number;
    }>();

    for (const metric of metrics as MetricRecord[]) {
      const createdAt = new Date(metric.createdAt).toISOString().slice(0, 10);

      const existing = groups.get(createdAt);
      if (existing) {
        existing.rows.push(metric);
        existing.totalRevenue += Number(metric.revenue);
        existing.totalUsers += Number(metric.users);
        existing.totalConversions += Number(metric.conversions);
      } else {
        groups.set(createdAt, {
          createdAt,
          rows: [metric],
          totalRevenue: Number(metric.revenue),
          totalUsers: Number(metric.users),
          totalConversions: Number(metric.conversions),
        });
      }
    }

    return Array.from(groups.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [metrics]);

  const chartData = useMemo(() => {
    return datasets.map((dataset) => ({
      name: dataset.createdAt,
      revenue: dataset.totalRevenue,
      users: dataset.totalUsers,
      conversions: dataset.totalConversions,
    }));
  }, [datasets]);

  if (isLoading) {
    return <p>Loading datasets...</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Dataset listing</h1>
        <p className="text-slate-600">
          View the uploaded metric batches and their summary totals.
        </p>
      </div>

      {chartData.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Upload trend</h2>
            <span className="text-sm text-slate-500">
              Revenue by dataset batch
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="datasetRevenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  fill="url(#datasetRevenueFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {datasets.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            No datasets uploaded yet.
          </div>
        ) : (
          datasets.map((dataset) => (
            <Link
              key={dataset.createdAt}
              href={`/dashboard/datasets/${encodeURIComponent(dataset.createdAt)}`}
              className="block rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Upload batch: {dataset.createdAt}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {dataset.rows.length} rows imported
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <div className="text-slate-500">Revenue</div>
                    <div className="font-semibold">{dataset.totalRevenue}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <div className="text-slate-500">Users</div>
                    <div className="font-semibold">{dataset.totalUsers}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <div className="text-slate-500">Conversions</div>
                    <div className="font-semibold">{dataset.totalConversions}</div>
                  </div>
                </div>
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
                    {dataset.rows.slice(0, 5).map((row) => (
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
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
