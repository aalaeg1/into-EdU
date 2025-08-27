"use client";

import React, { useState } from "react";

interface Lesson {
  title: string;
  updated: string;
  type: string;
  access: string;
  actions: string[];
}

interface RecentLessonsProps {
  lessons: Lesson[];
}

export const RecentLessons: React.FC<RecentLessonsProps> = ({ lessons }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 w-full">
      <div className="flex justify-between items-center mb-4">
        <span className="text-lg font-semibold text-gray-800">Recent Lessons</span>
        <a href="#" className="text-blue-600 text-sm font-medium hover:underline">See All</a>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b">
              <th className="py-2 pr-6">Title</th>
              <th className="py-2 pr-6">Last Updated</th>
              <th className="py-2 pr-6">Type</th>
              <th className="py-2 pr-6">Access</th>
              <th className="py-2 pr-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((lesson, idx) => (
              <tr key={lesson.title + idx} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="py-3 pr-6 font-semibold text-gray-900 whitespace-nowrap">{lesson.title}</td>
                <td className="py-3 pr-6 text-gray-700 whitespace-nowrap">{lesson.updated}</td>
                <td className="py-3 pr-6 text-gray-700 whitespace-nowrap">{lesson.type}</td>
                <td className="py-3 pr-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    lesson.access === "Only Me" ? "bg-[#E7E6FD] text-[#4B3DFE]" :
                    lesson.access === "Sarah" ? "bg-[#FFE4D6] text-[#FF6B35]" :
                    lesson.access === "Ahmed" ? "bg-[#FFF3CD] text-[#FFC107]" :
                    "bg-[#E7E6FD] text-[#4B3DFE]"
                  }`}>
                    {lesson.access}
                  </span>
                </td>
                <td className="py-3 pr-6 relative">
                  <button
                    className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                    onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="4" r="2" fill="#888"/><circle cx="10" cy="10" r="2" fill="#888"/><circle cx="10" cy="16" r="2" fill="#888"/></svg>
                  </button>
                  {openIndex === idx && (
                    <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-20">
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">Edit</button>
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">Duplicate</button>
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-center justify-between">
                        Download
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 18L15 12L9 6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-center justify-between">
                        Move
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 18L15 12L9 6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-center justify-between">
                        Share
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 18L15 12L9 6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 