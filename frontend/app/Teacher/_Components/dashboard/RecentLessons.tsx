import React from "react";

type Lesson = {
  title: string;
  updated: string;
  type: string;
  access: string; // "Only Me" or "Owner Name (View|Edit)"
};

export function RecentLessons({ lessons }: { lessons: Lesson[] }) {
  return (
      <div className="w-full">
        <div className="font-semibold mb-2">Recent Lessons</div>
        <div className="bg-white rounded-md shadow-sm min-w-[900px]">
          <table className="w-full text-sm">
            <thead>
            <tr className="border-b">
              <th className="py-3 px-4 text-left font-semibold">Title</th>
              <th className="py-3 px-4 text-left font-semibold">Last Updated</th>
              <th className="py-3 px-4 text-left font-semibold">Type</th>
              <th className="py-3 px-4 text-left font-semibold">Access</th>
            </tr>
            </thead>
            <tbody>
            {lessons.map((item, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="py-3 px-4 font-semibold whitespace-nowrap">{item.title}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{item.updated}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{item.type}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                  <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                          item.access === "Only Me" ? "bg-indigo-100 text-indigo-600" : "bg-yellow-100 text-yellow-700"
                      }`}
                  >
                    {item.access}
                  </span>
                  </td>
                </tr>
            ))}
            {lessons.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-gray-500">
                    No content found
                  </td>
                </tr>
            )}
            </tbody>
          </table>
        </div>
      </div>
  );
}
