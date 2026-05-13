"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await fetch("/api/user");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const [name, setName] = useState("");

  // Set initial name
//   useEffect(() => {
//     if (data?.name) {
//       setName(data.name);
//     }
//   }, [data]);

  // Update mutation
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },

     onSuccess: () => {
    toast.success("Profile updated successfully 🎉");
    queryClient.invalidateQueries({ queryKey: ["user"] });
  },
  onError: () => {
    toast.error("Something went wrong ❌");
  },
  });

  if (isLoading) return <p>Loading profile...</p>;

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Profile</h2>

      <div className="bg-white p-6 rounded-2xl shadow space-y-4">
        <div>
          <label className="block text-gray-600 mb-1">Email</label>
          <p className="font-semibold">{data?.email}</p>
        </div>

        <div>
          <label className="block text-gray-600 mb-1">Name</label>
          <input
            value={name || data?.name || ""}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <button
          onClick={() => mutation.mutate()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}