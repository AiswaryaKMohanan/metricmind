"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export default function MetricsPage() {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");

  // 📊 Fetch metrics
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["metrics"],
    queryFn: async () => {
      const res = await fetch("/api/metrics");
      return res.json();
    },
  });

  // ➕ Add metric
  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, value }),
      });

      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Metric added 🚀");
      setTitle("");
      setValue("");
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
    onError: () => {
      toast.error("Error adding metric");
    },
  });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Metrics</h2>

      {/* Add form */}
      <div className="bg-white p-4 rounded-xl shadow space-y-3">
        <input
          placeholder="Metric name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />

        <input
          placeholder="Value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />

        <button
          onClick={() => addMutation.mutate()}
          className="w-full bg-indigo-600 text-white py-2 rounded"
        >
          Add Metric
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {metrics?.map((m: any) => (
          <div
            key={m.id}
            className="bg-white p-4 rounded-xl shadow flex justify-between"
          >
            <span>{m.title}</span>
            <span className="font-bold">{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}