import Image from "next/image";
import { Button } from "@/components/ui/button";
import { User, FileText, Ban, LogIn, Plus, EyeOff, BarChart2, Download } from "lucide-react";
import DashboardChartWrapper from "../../Admin/_Components/DashboardChartWrapper";
import { ContentTypeUsageChart } from "../../Admin/_Components/ContentTypeUsageChart";
import { DashboardBanner } from "../../Admin/_Components/DashboardBanner";

const stats = [
  {
    icon: <User className="w-6 h-6 text-blue-500" />,
    title: "Total Teachers",
    value: 27,
    link: "View Users",
    href: "#",
  },
  {
    icon: <FileText className="w-6 h-6 text-blue-500" />,
    title: "Total Content",
    value: 34,
    link: "View Content",
    href: "#",
  },
  {
    icon: <Ban className="w-6 h-6 text-blue-500" />,
    title: "Blocked Users",
    value: 4,
    link: "Manage Access",
    href: "#",
  },
  {
    icon: <LogIn className="w-6 h-6 text-blue-500" />,
    title: "Recent Logins",
    value: 6,
    link: "View Logs",
    href: "#",
    sub: "Today",
  },
];

const actions = [
  {
    icon: <Plus className="w-5 h-5" />, text: "Add New User"
  },
  {
    icon: <EyeOff className="w-5 h-5" />, text: "Enable/Disable Activity Types"
  },
  {
    icon: <BarChart2 className="w-5 h-5" />, text: "Content Audit"
  },
  {
    icon: <Download className="w-5 h-5" />, text: "Download Content Report"
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardBanner />
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-md flex items-center px-6 py-4 gap-4 min-w-[200px]">
            <div>{stat.icon}</div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-gray-700 mb-1">{stat.title}</div>
              <div className="text-2xl font-bold text-gray-900">{stat.value} {stat.sub && <span className="text-xs font-normal text-gray-400 ml-1">{stat.sub}</span>}</div>
              <a href={stat.href} className="text-xs text-blue-500 hover:underline font-medium">{stat.link} &rarr;</a>
            </div>
          </div>
        ))}
      </div>
      {/* Main Content Row */}
      <div className="flex flex-col lg:flex-row gap-8 min-h-[340px] items-stretch">
        {/* Chart Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-md p-8 min-w-0 flex flex-col justify-center h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xl font-bold text-gray-800">Content Created</div>
            <select className="bg-gray-100 rounded-md px-3 py-1 text-sm text-gray-600 outline-none border-none">
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
          </div>
          <DashboardChartWrapper />
        </div>
        {/* Action Buttons */}
        <div className="flex flex-col gap-4 w-full lg:w-72">
          {actions.map((action, i) => (
            <Button key={i} className="w-full h-14 text-base font-semibold flex items-center justify-start gap-3 bg-gradient-to-r from-blue-600 to-purple-400 text-white rounded-xl shadow-none hover:from-blue-700 hover:to-purple-500">
              {action.icon} {action.text} <span className="ml-auto">&raquo;</span>
            </Button>
          ))}
        </div>
      </div>
      {/* Bottom Section: Latest Activity & Content Type Usage */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Latest Activity */}
        <div className="flex-1 bg-white rounded-2xl shadow-md p-8 min-w-0 mb-4 lg:mb-0">
          <div className="text-xl font-bold text-gray-800 mb-6">Lastest Activity</div>
          <div className="flex flex-col gap-6">
            {/* Exemple d'activité, à remplacer par des données dynamiques si besoin */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-blue-500">SB</div>
              <div>
                <span className="font-semibold text-gray-700">Sara Bennis</span> created new content: <span className="font-bold text-red-500">Water Cycle</span>
                <div className="text-xs text-gray-400 mt-1">2 March 2021, 13:45 PM</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-green-600">YH</div>
              <div>
                <span className="font-semibold text-gray-700">Younes Haloui</span> shared 'Science Lab Safety' with <span className="font-bold text-green-600">Mr. Khalid</span>
                <div className="text-xs text-gray-400 mt-1">2 March 2021, 13:45 PM</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-blue-500">YE</div>
              <div>
                <span className="font-semibold text-gray-700">Youssef Elhouari</span> edited the lesson <span className="font-bold text-blue-600 underline cursor-pointer">Algebra Basics: Part I</span>
                <div className="text-xs text-gray-400 mt-1">2 March 2021, 13:45 PM</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-700">SW</div>
              <div>
                <span className="font-semibold text-gray-700">Sam William</span> created new content: <span className="font-bold text-red-500">Functions</span>
                <div className="text-xs text-gray-400 mt-1">2 March 2021, 13:45 PM</div>
              </div>
            </div>
          </div>
        </div>
        {/* Content Type Usage */}
        <div className="flex-1 bg-white rounded-2xl shadow-md p-8 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xl font-bold text-gray-800">Content Type Usage</div>
            <div className="flex items-center gap-6 text-sm">
              <span className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-blue-600"></span> This Week <span className="font-bold ml-1">1,245</span></span>
              <span className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-indigo-200"></span> Last Week <span className="font-bold ml-1">1,356</span></span>
            </div>
          </div>
          {/* Chart */}
          <div className="h-[300px]">
            <ContentTypeUsageChart />
          </div>
        </div>
      </div>
    </div>
  );
}
