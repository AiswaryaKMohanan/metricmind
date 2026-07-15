"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function MetricsPage() {
  const queryClient = useQueryClient();

  const [date, setDate] = useState("");
  const [revenue, setRevenue] = useState("");
  const [users, setUsers] = useState("");
  const [conversions, setConversions] = useState("");

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["metrics"],
    queryFn: async () => {
      const res = await fetch("/api/metrics");
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, revenue, users, conversions }),
      });

      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Metric added 🚀");
      setDate("");
      setRevenue("");
      setUsers("");
      setConversions("");
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
    onError: () => {
      toast.error("Error adding metric");
    },
  });

  const chartData = (metrics ?? []).map((m: any) => ({
    date: new Date(m.date).toISOString().slice(0, 10),
    revenue: Number(m.revenue),
    users: Number(m.users),
    conversions: Number(m.conversions),
  }));

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h2 className="text-2xl font-bold">Metrics</h2>

      <div className="space-y-3 rounded-xl bg-white p-4 shadow">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />

        <input
          placeholder="Revenue"
          value={revenue}
          onChange={(e) => setRevenue(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />

        <input
          placeholder="Users"
          value={users}
          onChange={(e) => setUsers(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />

        <input
          placeholder="Conversions"
          value={conversions}
          onChange={(e) => setConversions(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />

        <button
          onClick={() => addMutation.mutate()}
          className="w-full rounded bg-indigo-600 py-2 text-white"
        >
          Add Metric
        </button>
      </div>

      <div className="rounded-xl bg-white p-4 shadow">
        <h3 className="mb-4 text-lg font-semibold">Revenue trend</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                fill="url(#revenueFill)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-3">
        {metrics?.map((m: any) => (
          <div
            key={m.id}
            className="flex items-center justify-between rounded-xl bg-white p-4 shadow"
          >
            <span>{new Date(m.date).toISOString().slice(0, 10)}</span>
            <span className="font-bold">{m.revenue}</span>
            <span>{m.users}</span>
            <span>{m.conversions}</span>
          </div>
        ))}
      </div>
    </div>
  );
}