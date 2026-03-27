import Navbar from "../components/layout/navBar";

export default function Dashboard(){
    return ( 
    <div className="p-6">
        <Navbar/>
      <h1 className="text-2xl font-bold">MetricMind Dashboard</h1>
      <p className="text-gray-500 mt-2">
        AI-powered analytics platform
      </p>
    </div>)
}