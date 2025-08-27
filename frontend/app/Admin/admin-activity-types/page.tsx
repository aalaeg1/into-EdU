"use client";

import { useState } from "react";
import { Search, Bell, Globe, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ActivityType {
  id: string;
  name: string;
  version: string;
  description: string;
  usedIn: number;
  isEnabled: boolean;
}

const activityTypes: ActivityType[] = [
  {
    id: "1",
    name: "Interactive Video",
    version: "1.22",
    description: "Add interactions like questions, links, and labels directly onto a video to make learning more engaging and active.",
    usedIn: 12,
    isEnabled: true,
  },
  {
    id: "2",
    name: "Multiple Choice",
    version: "1.24",
    description: "Create quizzes with one or more correct answers, detailed feedback, and retry options — useful for checking understanding.",
    usedIn: 12,
    isEnabled: true,
  },
  {
    id: "3",
    name: "Drag and Drop",
    version: "1.12",
    description: "Let learners match or sort elements by dragging items into defined drop zones — ideal for visual and hands-on exercises.",
    usedIn: 20,
    isEnabled: true,
  },
  {
    id: "4",
    name: "Quiz",
    version: "1.22",
    description: "Combine multiple question types (e.g. MCQ, drag & drop, fill-in-the-blank) into one sequential quiz with scoring and feedback.",
    usedIn: 12,
    isEnabled: true,
  },
  {
    id: "5",
    name: "Course Presentation",
    version: "1.11",
    description: "Build interactive slide-based lessons with multimedia, quizzes, and navigation — perfect for structured content delivery.",
    usedIn: 6,
    isEnabled: false,
  },
  {
    id: "6",
    name: "Single Choice",
    version: "1.9",
    description: "A simple quiz type where the learner selects only one correct answer from several options — quick and easy to create.",
    usedIn: 33,
    isEnabled: true,
  },
];

export default function ActivityTypesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activityTypesList, setActivityTypesList] = useState<ActivityType[]>(activityTypes);

  const filteredActivityTypes = activityTypesList.filter(activity =>
    activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleActivityType = (id: string) => {
    setActivityTypesList(prev =>
      prev.map(activity =>
        activity.id === id
          ? { ...activity, isEnabled: !activity.isEnabled }
          : activity
      )
    );
  };

  return (
    <div className="p-6">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            type="text"
            placeholder="Search activity types"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Activity Types Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Activity Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Used in
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Toggle
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredActivityTypes.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{activity.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-500">{activity.version}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-extralight text-gray-400 max-w-md">{activity.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {activity.usedIn} Content
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActivityType(activity.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        activity.isEnabled ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          activity.isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredActivityTypes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 font-light">No activity types found matching your search.</p>
        </div>
      )}
    </div>
  );
} 