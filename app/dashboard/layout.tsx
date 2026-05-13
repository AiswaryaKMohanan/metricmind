"use client";

import { ReactNode } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 🔒 Protect route
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-indigo-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-5 hidden md:block">
        <h2 className="text-xl font-bold mb-8 text-indigo-600">MetricMind</h2>

        <nav className="space-y-4">
          <a
            href="/dashboard"
            className="block text-gray-700 hover:text-indigo-600"
          >
            Dashboard
          </a>
          <a
            href="/dashboard/profile"
            className="block text-gray-700 hover:text-indigo-600"
          >
            Profile
          </a>
          <a
            href="/dashboard/settings"
            className="block text-gray-700 hover:text-indigo-600"
          >
            Settings
          </a>
        </nav>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
          <h1 className="text-lg font-semibold">Dashboard</h1>

          <div className="flex items-center gap-4">
            <span className="text-gray-600 text-sm">
              {session?.user?.email}
            </span>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: "10px",
                background: "#333",
                color: "#fff",
              },
            }}
          />
          {children}
        </main>
      </div>
    </div>
  );
}
