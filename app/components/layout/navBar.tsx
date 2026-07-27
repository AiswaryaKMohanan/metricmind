import Logout from "@/app/logout/page";

export default function Navbar() {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white shadow">
      <h1 className="font-bold text-lg">MetricMind</h1>
      <div className="text-sm text-gray-500">Welcome, User</div>
      <Logout></Logout>
    </div>
  );
}