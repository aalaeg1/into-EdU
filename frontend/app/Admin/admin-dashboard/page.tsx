"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  User,
  FileText,
  Ban,
  LogIn,
  Plus,
  EyeOff,
  BarChart2,
  Download,
} from "lucide-react";
import DashboardChartWrapper, { MonthlyPoint } from "../../Admin/_Components/DashboardChartWrapper";
import { ContentTypeUsageChart, TypeCount } from "../../Admin/_Components/ContentTypeUsageChart";
import { DashboardBanner } from "../../Admin/_Components/DashboardBanner";

/** API endpoints */
const TEACHER_API = "http://localhost:5002/api/teachers";
const FOLDERS_ADMIN_API = "http://localhost:5002/api/folders/admin";
const FOLDERS_BY_TEACHER_API = "http://localhost:5002/api/folders";

/** Types */
type Teacher = {
  email: string;
  nom?: string;
  prenom?: string;
  blocked?: boolean;
  lastSignInAt?: string;
};

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

// UI types
type Stat = {
  icon: React.ReactNode;
  title: string;
  value: number;
  link: string;
  href: string;
  sub?: string;
};

type ActionLink = { icon: React.ReactNode; text: string; href: string };

/** Helpers */
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${txt}`);
  }
  return (await res.json()) as T;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function titleFromFileName(name: string) {
  return name?.replace(/\.[^.]+$/, "") || name;
}

/** compares local calendar day (yyyy-mm-dd) */
function isSameLocalDay(aIso?: string, now = new Date()) {
  if (!aIso) return false;
  const d = new Date(aIso);
  if (Number.isNaN(d.getTime())) return false;
  return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [error, setError] = useState<string | null>(null);

  // NEW: chart range
  type ChartRange = "12m" | "6m" | "1m"; // 1m = this month (daily)
  const [chartRange, setChartRange] = useState<ChartRange>("12m");

  // Load teachers + folders
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const tchs = await fetchJson<Teacher[]>(TEACHER_API, { cache: "no-store" });
        setTeachers(tchs || []);

        let all: Folder[] | null = null;
        try {
          all = await fetchJson<Folder[]>(FOLDERS_ADMIN_API, { cache: "no-store" });
        } catch {
          const results = await Promise.allSettled(
              (tchs || []).map((t) =>
                  fetchJson<Folder[]>(FOLDERS_BY_TEACHER_API, {
                    cache: "no-store",
                    headers: { "x-teacher-email": t.email },
                  })
              )
          );
          const merged: Folder[] = [];
          for (const r of results) {
            if (r.status === "fulfilled" && Array.isArray(r.value)) merged.push(...r.value);
          }
          all = merged;
        }

        setFolders(all || []);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        setTeachers([]);
        setFolders([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /** KPIs */
  const totalTeachers = teachers.length;
  const blockedUsers = useMemo(() => teachers.filter((t) => !!t.blocked).length, [teachers]);
  const recentLogins = useMemo(
      () => teachers.filter((t) => isSameLocalDay(t.lastSignInAt)).length,
      [teachers]
  );
  const totalContent = useMemo(
      () => folders.reduce((s, f) => s + (f.pdfs?.length || 0) + (f.h5ps?.length || 0), 0),
      [folders]
  );

  /** Extract upload dates from content */
  const uploadDates = useMemo(() => {
    const out: Date[] = [];
    for (const f of folders) {
      for (const p of f.pdfs || []) if (p.uploadedAt) out.push(new Date(p.uploadedAt));
      for (const h of f.h5ps || []) if (h.uploadedAt) out.push(new Date(h.uploadedAt));
    }
    return out.filter((d) => !Number.isNaN(d.getTime()));
  }, [folders]);

  /** Build chart points based on selected range */
  const chartPoints: MonthlyPoint[] = useMemo(() => {
    const now = new Date();

    /** Monthly buckets helper (N months back, earliest -> latest) */
    const buildMonthly = (monthsBack: number): MonthlyPoint[] => {
      const months: MonthlyPoint[] = [];
      for (let i = monthsBack - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          label: d.toLocaleString(undefined, { month: "short" }),
          key: monthKey(d),
          value: 0,
        });
      }
      const idx = new Map(months.map((m, i) => [m.key, i] as const));
      for (const d of uploadDates) {
        const k = monthKey(new Date(d.getFullYear(), d.getMonth(), 1));
        const i = idx.get(k);
        if (i !== undefined) months[i].value += 1;
      }
      return months;
    };

    /** Daily buckets for this month (1..days) */
    const buildThisMonthDaily = (): MonthlyPoint[] => {
      const y = now.getFullYear();
      const m = now.getMonth();
      const daysInMonth = new Date(y, m + 1, 0).getDate();

      const pts: MonthlyPoint[] = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(y, m, i + 1);
        return {
          label: String(i + 1), // day number
          key: d.toISOString().slice(0, 10), // yyyy-mm-dd
          value: 0,
        };
      });

      const idx = new Map(pts.map((p, i) => [p.key, i] as const));
      for (const d of uploadDates) {
        if (d.getFullYear() !== y || d.getMonth() !== m) continue;
        const k = new Date(y, m, d.getDate()).toISOString().slice(0, 10);
        const i = idx.get(k);
        if (i !== undefined) pts[i].value += 1;
      }
      return pts;
    };

    if (chartRange === "6m") return buildMonthly(6);
    if (chartRange === "1m") return buildThisMonthDaily();
    return buildMonthly(12); // default 12 months
  }, [chartRange, uploadDates]);

  /** Type usage pie */
  const typeCounts: TypeCount[] = useMemo(() => {
    let pdf = 0;
    let h5p = 0;
    for (const f of folders) {
      pdf += f.pdfs?.length || 0;
      h5p += f.h5ps?.length || 0;
    }
    return [
      { type: "PDF", count: pdf },
      { type: "H5P/ZIP", count: h5p },
    ];
  }, [folders]);

  /** Latest activity */
  type Activity = { whoEmail: string; whoName: string; what: string; when: string };

  const nameByEmail = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of teachers) {
      const label = `${t.prenom ?? ""} ${t.nom ?? ""}`.trim();
      m.set(t.email.toLowerCase(), label || t.email);
    }
    return m;
  }, [teachers]);

  const latest: Activity[] = useMemo(() => {
    const events: { ts: number; whoEmail: string; what: string }[] = [];
    for (const f of folders) {
      for (const p of f.pdfs || []) {
        const ts = p.uploadedAt ? +new Date(p.uploadedAt) : 0;
        events.push({ ts, whoEmail: f.teacherEmail, what: `uploaded PDF “${titleFromFileName(p.originalName)}”` });
      }
      for (const h of f.h5ps || []) {
        const ts = h.uploadedAt ? +new Date(h.uploadedAt) : 0;
        events.push({ ts, whoEmail: f.teacherEmail, what: `uploaded H5P/ZIP “${titleFromFileName(h.originalName)}”` });
      }
    }
    events.sort((a, b) => b.ts - a.ts);
    return events.slice(0, 6).map((e) => ({
      whoEmail: e.whoEmail,
      whoName: nameByEmail.get(e.whoEmail.toLowerCase()) || e.whoEmail,
      what: e.what,
      when: e.ts ? new Date(e.ts).toLocaleString() : "—",
    }));
  }, [folders, nameByEmail]);

  const stats: Stat[] = [
    { icon: <User className="w-6 h-6 text-blue-500" />, title: "Total Teachers", value: totalTeachers, link: "View Users", href: "/Admin/admin-users" },
    { icon: <FileText className="w-6 h-6 text-blue-500" />, title: "Total Content", value: totalContent, link: "View Content", href: "/Teacher/Create" },
    { icon: <Ban className="w-6 h-6 text-blue-500" />, title: "Blocked Users", value: blockedUsers, link: "Manage Access", href: "/Admin/admin-users" },
    { icon: <LogIn className="w-6 h-6 text-blue-500" />, title: "Recent Logins", value: recentLogins, link: "View Logs", href: "/Admin/admin-logs", sub: "Today" },
  ];

  const actions: ActionLink[] = [
    { icon: <Plus className="w-5 h-5" />, text: "Add New User", href: "/Admin/Users" },
    { icon: <EyeOff className="w-5 h-5" />, text: "Enable/Disable Activity Types", href: "/Admin/admin-activity-types" },
    { icon: <BarChart2 className="w-5 h-5" />, text: "Content Audit", href: "/Admin/admin-content-audit" },
    { icon: <Download className="w-5 h-5" />, text: "Download Content Report", href: "/Admin/admin-reports" },
  ];

  return (
      <div className="flex flex-col gap-8">
        <DashboardBanner />

        {error && (
            <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-4 py-3">{error}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md flex items-center px-6 py-4 gap-4 min-w-[200px]">
                <div>{stat.icon}</div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-700 mb-1">{stat.title}</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loading ? "…" : stat.value}
                    {stat.sub && (
                        <span className="text-xs font-normal text-gray-400 ml-1">{stat.sub}</span>
                    )}
                  </div>
                  <a href={stat.href} className="text-xs text-blue-500 hover:underline font-medium">
                    {stat.link} &rarr;
                  </a>
                </div>
              </div>
          ))}
        </div>

        {/* Main row */}
        <div className="flex flex-col lg:flex-row gap-8 min-h-[340px] items-stretch">
          <div className="flex-1 bg-white rounded-2xl shadow-md p-8 min-w-0 flex flex-col justify-center h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xl font-bold text-gray-800">Content Created</div>
              <select
                  className="bg-gray-100 rounded-md px-3 py-1 text-sm text-gray-600"
                  value={chartRange}
                  onChange={(e) => setChartRange(e.target.value as ChartRange)}
              >
                <option value="12m">Last 12 Months</option>
                <option value="6m">Last 6 Months</option>
                <option value="1m">This Month</option>
              </select>
            </div>
            <DashboardChartWrapper monthlyCounts={chartPoints} />
          </div>

          <div className="flex flex-col gap-4 w-full lg:w-72">
            {actions.map((action, i) => (
                <Button
                    key={i}
                    asChild
                    className="w-full h-14 text-base font-semibold flex items-center justify-start gap-3 bg-gradient-to-r from-blue-600 to-purple-400 text-white rounded-xl hover:from-blue-700 hover:to-purple-500"
                >
                  <a href={action.href}>
                    {action.icon} {action.text} <span className="ml-auto">&raquo;</span>
                  </a>
                </Button>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 bg-white rounded-2xl shadow-md p-8 min-w-0 mb-4 lg:mb-0">
            <div className="text-xl font-bold text-gray-800 mb-6">Latest Activity</div>
            {loading ? (
                <div className="text-gray-500">Loading…</div>
            ) : (
                <>
                  {(() => {
                    // latest activity (recomputed here for display independence)
                    const events: Activity[] = (() => {
                      const arr: Activity[] = [];
                      for (const f of folders) {
                        for (const p of f.pdfs || []) {
                          const ts = p.uploadedAt ? +new Date(p.uploadedAt) : 0;
                          const whoName = (
                              `${teachers.find((t) => t.email.toLowerCase() === f.teacherEmail.toLowerCase())?.prenom ?? ""} ${
                                  teachers.find((t) => t.email.toLowerCase() === f.teacherEmail.toLowerCase())?.nom ?? ""
                              }`.trim() || f.teacherEmail
                          );
                          arr.push({
                            whoEmail: f.teacherEmail,
                            whoName,
                            what: `uploaded PDF “${titleFromFileName(p.originalName)}”`,
                            when: ts ? new Date(ts).toLocaleString() : "—",
                          });
                        }
                        for (const h of f.h5ps || []) {
                          const ts = h.uploadedAt ? +new Date(h.uploadedAt) : 0;
                          const whoName = (
                              `${teachers.find((t) => t.email.toLowerCase() === f.teacherEmail.toLowerCase())?.prenom ?? ""} ${
                                  teachers.find((t) => t.email.toLowerCase() === f.teacherEmail.toLowerCase())?.nom ?? ""
                              }`.trim() || f.teacherEmail
                          );
                          arr.push({
                            whoEmail: f.teacherEmail,
                            whoName,
                            what: `uploaded H5P/ZIP “${titleFromFileName(h.originalName)}”`,
                            when: ts ? new Date(ts).toLocaleString() : "—",
                          });
                        }
                      }
                      return arr.sort((a, b) => +new Date(b.when) - +new Date(a.when)).slice(0, 6);
                    })();

                    if (!events.length) {
                      return <div className="text-gray-500">No recent uploads yet.</div>;
                    }
                    return (
                        <div className="flex flex-col gap-6">
                          {events.map((a, idx) => {
                            const initials = a.whoName
                                .split(/\s+/)
                                .filter(Boolean)
                                .map((s) => s[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase();
                            return (
                                <div key={idx} className="flex items-start gap-4">
                                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-blue-600">
                                    {initials || "U"}
                                  </div>
                                  <div>
                                    <span className="font-semibold text-gray-700">{a.whoName}</span> {a.what}
                                    <div className="text-xs text-gray-400 mt-1">{a.when}</div>
                                  </div>
                                </div>
                            );
                          })}
                        </div>
                    );
                  })()}
                </>
            )}
          </div>

          <div className="flex-1 bg-white rounded-2xl shadow-md p-8 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xl font-bold text-gray-800">Content Type Usage</div>
              <div className="flex items-center gap-6 text-sm">
                <span className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-blue-600" /> PDF</span>
                <span className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-indigo-300" /> H5P/ZIP</span>
              </div>
            </div>
            <div className="h-[300px]">
              <ContentTypeUsageChart typeCounts={typeCounts} />
            </div>
          </div>
        </div>
      </div>
  );
}
