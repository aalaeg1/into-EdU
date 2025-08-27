import React from "react";
import { WelcomeBanner } from "../_Components/dashboard/WelcomeBanner";
import { StatsCards } from "../_Components/dashboard/StatsCards";
import { ContentShortcuts } from "../_Components/dashboard/ContentShortcuts";
import { RecentLessons } from "../_Components/dashboard/RecentLessons";

// Mock data for now, replace with API data later
const stats = {
  myContent: 18,
  sharedContent: 5,
  myFolders: 4,
};

const lessons = [
  {
    title: "Photosynthesis Quiz",
    updated: "2 Days Ago",
    type: "Quiz",
    access: "Only Me",
    actions: ["Edit", "Duplicate", "Download", "Move", "Share", "Delete"],
  },
  {
    title: "Intro To Fractions",
    updated: "June 25, 2025",
    type: "Course Presentation",
    access: "Sarah",
    actions: ["Edit", "Duplicate", "Download", "Move", "Share", "Delete"],
  },
  {
    title: "French Vocabulary Cards",
    updated: "June 18, 2025",
    type: "Dialog Cards",
    access: "Ahmed",
    actions: ["Edit", "Duplicate", "Download", "Move", "Share", "Delete"],
  },
  {
    title: "Fractions",
    updated: "May 27, 2025",
    type: "Interactive Book",
    access: "Only Me",
    actions: ["Edit", "Duplicate", "Download", "Move", "Share", "Delete"],
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <WelcomeBanner />
      <StatsCards stats={stats} />
      <ContentShortcuts />
      <RecentLessons lessons={lessons} />
    </div>
  );
}
