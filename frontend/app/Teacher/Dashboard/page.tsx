"use client";

import React, { useEffect, useMemo, useState } from "react";
import { WelcomeBanner } from "../_Components/dashboard/WelcomeBanner";
import { StatsCards } from "../_Components/dashboard/StatsCards";
import { ContentShortcuts } from "../_Components/dashboard/ContentShortcuts";
import { RecentLessons } from "../_Components/dashboard/RecentLessons";

const API_BASE = "http://localhost:5002";

/** Backend types */
type Share = { email: string; role: "view" | "edit" };
type FileMeta = { originalName: string; filename: string; uploadedAt?: string };
type Folder = {
  _id: string;
  name: string;
  teacherEmail: string;
  sharedWith: Share[];
  pdfs: FileMeta[];
  h5ps: FileMeta[];
};
type TeacherLite = { email: string; nom?: string; prenom?: string };

/** Helpers */
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${txt}`);
  }
  return res.json() as Promise<T>;
}
function formatUpdated(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(+d)) return "—";
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days === 1) return "1 Day Ago";
  if (days <= 7) return `${days} Days Ago`;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}
function typeFromName(name: string): string {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "PDF";
  if (n.endsWith(".h5p")) return "H5P";
  if (n.endsWith(".zip")) return "ZIP";
  return "File";
}

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [teachers, setTeachers] = useState<Record<string, TeacherLite>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") setEmail(localStorage.getItem("email"));
  }, []);

  // Load teachers (for owner display in “Access” column)
  useEffect(() => {
    (async () => {
      try {
        const list = await fetchJson<TeacherLite[]>(`${API_BASE}/api/teachers`, { cache: "no-store" });
        const map: Record<string, TeacherLite> = {};
        for (const t of list) map[t.email.toLowerCase()] = t;
        setTeachers(map);
      } catch {
        setTeachers({});
      }
    })();
  }, []);

  // Load folders I can access (owned + shared)
  useEffect(() => {
    (async () => {
      if (!email) return;
      setLoading(true);
      try {
        const data = await fetchJson<Folder[]>(`${API_BASE}/api/folders`, {
          method: "GET",
          cache: "no-store",
          headers: { "x-teacher-email": email, Accept: "application/json" },
        });
        setFolders(data || []);
      } catch (e) {
        console.error("Dashboard load folders error:", e);
        setFolders([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [email]);

  const me = (email || "").toLowerCase();
  const ownFolders = useMemo(() => folders.filter(f => f.teacherEmail.toLowerCase() === me), [folders, me]);
  const sharedFolders = useMemo(() => folders.filter(f => f.teacherEmail.toLowerCase() !== me), [folders, me]);

  /** Stats
   * - myContent = ALL files I can access (owned + shared)
   * - sharedContent = files in shared folders only (kept for the second card)
   * - myFolders = number of folders I own
   */
  const myContent = useMemo(
      () => folders.reduce((sum, f) => sum + (f.pdfs?.length || 0) + (f.h5ps?.length || 0), 0),
      [folders]
  );
  const sharedContent = useMemo(
      () => sharedFolders.reduce((sum, f) => sum + (f.pdfs?.length || 0) + (f.h5ps?.length || 0), 0),
      [sharedFolders]
  );
  const myFolders = ownFolders.length;
  const stats = { myContent, sharedContent, myFolders };

  /** Recent lessons (remove “actions” entirely) */
  type Lesson = { title: string; updated: string; type: string; access: string };
  const lessons: Lesson[] = useMemo(() => {
    const items: Array<{ title: string; date?: string; type: string; access: string }> = [];

    for (const f of folders) {
      const ownerIsMe = f.teacherEmail.toLowerCase() === me;
      const myShare = f.sharedWith.find((s) => s.email.toLowerCase() === me);
      const roleText = myShare?.role === "edit" ? "Edit" : "View";

      const ownerT = teachers[f.teacherEmail.toLowerCase()];
      const ownerLabel =
          ownerIsMe
              ? "Only Me"
              : `${(ownerT ? `${ownerT.prenom ?? ""} ${ownerT.nom ?? ""}`.trim() : f.teacherEmail) || f.teacherEmail} (${roleText})`;

      for (const p of f.pdfs || [])
        items.push({ title: p.originalName, date: p.uploadedAt, type: typeFromName(p.originalName), access: ownerLabel });
      for (const h of f.h5ps || [])
        items.push({ title: h.originalName, date: h.uploadedAt, type: typeFromName(h.originalName), access: ownerLabel });
    }

    items.sort((a, b) => (+(b.date ? new Date(b.date) : 0) - +(a.date ? new Date(a.date) : 0)));
    return items.slice(0, 4).map(it => ({
      title: it.title,
      updated: formatUpdated(it.date),
      type: it.type,
      access: it.access,
    }));
  }, [folders, me, teachers]);

  return (
      <div className="flex flex-col gap-8 p-6">
        <WelcomeBanner />
        <StatsCards stats={stats} />
        <ContentShortcuts />
        <RecentLessons
            lessons={
              loading
                  ? [
                    { title: "Loading…", updated: "—", type: "—", access: "—" },
                    { title: "Loading…", updated: "—", type: "—", access: "—" },
                  ]
                  : lessons
            }
        />
      </div>
  );
}
