"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

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

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
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