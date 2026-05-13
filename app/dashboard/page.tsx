"use client";
import { useQuery } from "@tanstack/react-query";

export default function DashboardPage() {
  const stats = [
    {
      title: "Users",
      value: "1,245",
      change: "+12%",
    },
    {
      title: "Revenue",
      value: "$8,430",
      change: "+8%",
    },
    {
      title: "Growth",
      value: "23%",
      change: "+5%",
    },
    {
      title: "Sessions",
      value: "12,340",
      change: "+15%",
    },
  ];


  const {data,isLoading}= useQuery({
    queryKey:['user'],
    queryFn: async()=>{
      const res = await fetch("api/user")
       if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    }
  })

    if (isLoading) {
    return <p>Loading user data...</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Overview</h2>
       <h2 className="text-2xl font-bold mb-6 text-gray-800">
         Welcome {data?.name || "User"} 👋
      </h2>
      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`p-6 rounded-2xl shadow-md hover:shadow-lg transition ${
              stat.change.includes("+") ? "bg-blue-50" : "bg-red-50"
            }`}
          >
            <p className="text-gray-500 text-sm">{stat.title}</p>

            <h3 className="text-2xl font-bold mt-2 text-gray-800">
              {stat.value}
            </h3>

            <p
              className={`text-sm mt-2 ${
                stat.change.includes("+") ? "text-green-500" : "text-red-500"
              }`}
            >
              {stat.change} from last month
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
