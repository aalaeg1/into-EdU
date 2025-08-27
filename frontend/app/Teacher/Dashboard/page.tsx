"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { WelcomeBanner } from "../_Components/dashboard/WelcomeBanner";
import { StatsCards } from "../_Components/dashboard/StatsCards";
import { ContentShortcuts } from "../_Components/dashboard/ContentShortcuts";
import { RecentLessons } from "../_Components/dashboard/RecentLessons";
import lottie, { AnimationItem } from "lottie-web";

/* ================== Config ================== */
const API_BASE = "http://localhost:5002"; // teacher-service
const PLANNER_BASE =
    process.env.NEXT_PUBLIC_PLANNER_BASE ?? "http://localhost:5010"; // planner_service

/* ================== Backend types ================== */
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

/* ================== Helpers ================== */
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${txt}`);
  }
  return res.json() as Promise<T>;
}
function formatUpdated(iso?: string): string {
  if (!iso) return "Today";
  const d = new Date(iso);
  if (isNaN(+d)) return "Today";
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

/* ================== Planner Modal ================== */
type ScheduleRow = {
  Séance: number;
  Module: string;
  Titre: string;
  Heures: number;
  Début: string; // ISO
  Fin: string; // ISO
};

function PlannerModal({
                        open,
                        onClose,
                      }: {
  open: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"text" | "pdf">("text");
  const [text, setText] = useState("");
  const [pdf, setPdf] = useState<File | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null); // >>> robust picker
  const [pdfHover, setPdfHover] = useState(false);

  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [weekdayEnabled, setWeekdayEnabled] = useState<boolean[]>([true, true, true, true, true, false, false]);
  const [weekdayTime, setWeekdayTime] = useState<Array<{ h: number; m: number }>>(
      [{ h: 9, m: 0 }, { h: 9, m: 0 }, { h: 9, m: 0 }, { h: 9, m: 0 }, { h: 9, m: 0 }, { h: 9, m: 0 }, { h: 9, m: 0 }]
  );
  const [maxPerSession, setMaxPerSession] = useState(2);
  const [model, setModel] = useState("deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free");
  const [apiKey, setApiKey] = useState("");

  // results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planText, setPlanText] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [ganttPng, setGanttPng] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      // reset when closing
      setError(null);
      setPlanText(null);
      setSessions([]);
      setSchedule([]);
      setGanttPng(null);
      setPdf(null);
      setText("");
      setMode("text");
      if (pdfInputRef.current) pdfInputRef.current.value = ""; // clear native picker
    }
  }, [open]);

  if (!open) return null;

  const weekdayTimesPayload = (): Record<number, [number, number]> => {
    const out: Record<number, [number, number]> = {};
    weekdayEnabled.forEach((ok, i) => {
      if (ok) out[i] = [weekdayTime[i].h, weekdayTime[i].m];
    });
    return out;
  };

  const runPlanner = async () => {
    setLoading(true);
    setError(null);
    setPlanText(null);
    setSessions([]);
    setSchedule([]);
    setGanttPng(null);

    try {
      if (mode === "text") {
        const payload = {
          text,
          start_date: startDate,
          weekday_times: weekdayTimesPayload(),
          max_hours_per_session: maxPerSession,
          model,
          api_key: apiKey || undefined,
        };

        const res = await fetch(`${PLANNER_BASE}/api/plan-from-text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text()}`);
        const data = await res.json();
        if ((data as any).error) throw new Error((data as any).error);

        setPlanText(data.plan_text);
        setSessions(data.sessions || []);
        setSchedule(data.schedule || []);
        setGanttPng(data.gantt_png || null);
      } else {
        if (!pdf) throw new Error("Please select a PDF.");
        const fd = new FormData();
        fd.append("file", pdf);
        fd.append("start_date", startDate);
        fd.append("weekday_times_json", JSON.stringify(weekdayTimesPayload()));
        fd.append("max_hours_per_session", String(maxPerSession));
        fd.append("model", model);
        if (apiKey) fd.append("api_key", apiKey);

        const res = await fetch(`${PLANNER_BASE}/api/plan-from-pdf`, {
          method: "POST",
          body: fd,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text()}`);
        const data = await res.json();
        if ((data as any).error) throw new Error((data as any).error);

        setPlanText(data.plan_text);
        setSessions(data.sessions || []);
        setSchedule(data.schedule || []);
        setGanttPng(data.gantt_png || null);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to run planner.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPng = () => {
    if (!ganttPng) return;
    const a = document.createElement("a");
    a.href = ganttPng;
    a.download = "gantt.png";
    a.click();
  };

  // drag & drop for PDF
  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setPdfHover(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type === "application/pdf") setPdf(f);
  };

  return (
      <div className="fixed inset-0 z-[60]">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="absolute left-1/2 top-1/2 w-[95vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl">
          <div className="rounded-t-xl bg-indigo-600 px-6 py-4 text-white">
            <div className="text-lg font-semibold">AI Course Planner</div>
          </div>

          <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-5">
            {/* Left: form */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex gap-2">
                <button
                    className={`rounded px-3 py-1 text-sm ${mode === "text" ? "bg-indigo-600 text-white" : "border"}`}
                    onClick={() => setMode("text")}
                    type="button"
                >
                  Paste Text
                </button>
                <button
                    className={`rounded px-3 py-1 text-sm ${mode === "pdf" ? "bg-indigo-600 text-white" : "border"}`}
                    onClick={() => setMode("pdf")}
                    type="button"
                >
                  Upload PDF
                </button>
              </div>

              {mode === "text" ? (
                  <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={8}
                      className="w-full rounded border p-3 text-sm"
                      placeholder="Paste your course text here…"
                  />
              ) : (
                  <>
                    {/* BIG selectable area + hidden input */}
                    <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setPdfHover(true);
                        }}
                        onDragLeave={() => setPdfHover(false)}
                        onDrop={onDrop}
                        className={`rounded border-2 border-dashed p-4 text-center text-sm ${
                            pdfHover ? "border-indigo-500 bg-indigo-50" : "border-gray-300"
                        }`}
                    >
                      <p className="mb-3 text-gray-700">
                        Select a <b>PDF</b> or drag & drop it here.
                      </p>
                      <button
                          type="button"
                          onClick={() => pdfInputRef.current?.click()}
                          className="rounded bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
                      >
                        Select PDF
                      </button>
                      <input
                          ref={pdfInputRef}
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => setPdf(e.target.files?.[0] ?? null)}
                      />
                      <div className="mt-2 text-xs text-gray-600">
                        {pdf ? `Selected: ${pdf.name}` : "No file selected"}
                      </div>
                    </div>
                  </>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium">Start date</label>
                <input
                    type="date"
                    className="w-48 rounded border px-2 py-1"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Weekdays & times</div>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={weekdayEnabled[i]}
                            onChange={(e) => {
                              const a = [...weekdayEnabled];
                              a[i] = e.target.checked;
                              setWeekdayEnabled(a);
                            }}
                        />
                        <span className="w-10">{d}</span>
                      </label>
                      <input
                          type="number"
                          min={0}
                          max={23}
                          className="w-16 rounded border px-2 py-1"
                          value={weekdayTime[i].h}
                          onChange={(e) => {
                            const a = [...weekdayTime];
                            a[i] = { ...a[i], h: Number(e.target.value) };
                            setWeekdayTime(a);
                          }}
                          disabled={!weekdayEnabled[i]}
                      />
                      :
                      <input
                          type="number"
                          min={0}
                          max={59}
                          className="w-16 rounded border px-2 py-1"
                          value={weekdayTime[i].m}
                          onChange={(e) => {
                            const a = [...weekdayTime];
                            a[i] = { ...a[i], m: Number(e.target.value) };
                            setWeekdayTime(a);
                          }}
                          disabled={!weekdayEnabled[i]}
                      />
                    </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <label className="text-sm">
                  Max hours/session{" "}
                  <input
                      type="number"
                      min={1}
                      max={4}
                      className="ml-2 w-16 rounded border px-2 py-1"
                      value={maxPerSession}
                      onChange={(e) => setMaxPerSession(Number(e.target.value))}
                  />
                </label>

                <label className="text-sm">
                  Model{" "}
                  <input
                      type="text"
                      className="ml-2 w-[320px] rounded border px-2 py-1"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                  />
                </label>
              </div>

              <label className="text-xs text-gray-600 block">
                Together API key (optional — leave empty if configured on the server)
                <input
                    type="password"
                    className="mt-1 w-full rounded border px-2 py-1"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-…"
                />
              </label>

              <div className="flex gap-3 pt-2">
                <button
                    onClick={runPlanner}
                    disabled={loading || (mode === "text" ? text.trim().length === 0 : !pdf)}
                    className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  {loading ? "Working…" : "Generate plan"}
                </button>
                <button onClick={onClose} className="rounded border px-4 py-2 hover:bg-gray-50">
                  Close
                </button>
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}
            </div>

            {/* Right: results */}
            <div className="lg:col-span-3 space-y-4">
              <div className="rounded border p-3">
                <div className="mb-2 text-sm font-semibold">Plan (raw)</div>
                <pre className="max-h-64 overflow-auto rounded bg-gray-50 p-3 text-xs">
                {planText ?? "—"}
              </pre>
              </div>

              <div className="rounded border p-3">
                <div className="mb-2 text-sm font-semibold">Schedule</div>
                {schedule.length === 0 ? (
                    <div className="text-sm text-gray-500">—</div>
                ) : (
                    <div className="max-h-64 overflow-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                        <tr className="border-b">
                          <th className="py-1 pr-3">#</th>
                          <th className="py-1 pr-3">Title</th>
                          <th className="py-1 pr-3">Module</th>
                          <th className="py-1 pr-3">Hours</th>
                          <th className="py-1 pr-3">Start</th>
                          <th className="py-1 pr-3">End</th>
                        </tr>
                        </thead>
                        <tbody>
                        {schedule.map((r) => (
                            <tr key={r.Séance} className="border-b last:border-0">
                              <td className="py-1 pr-3">S{r.Séance}</td>
                              <td className="py-1 pr-3">{r.Titre}</td>
                              <td className="py-1 pr-3">{r.Module}</td>
                              <td className="py-1 pr-3">{r.Heures}</td>
                              <td className="py-1 pr-3">{new Date(r.Début).toLocaleString()}</td>
                              <td className="py-1 pr-3">{new Date(r.Fin).toLocaleString()}</td>
                            </tr>
                        ))}
                        </tbody>
                      </table>
                    </div>
                )}
              </div>

              <div className="rounded border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold">Gantt</div>
                  <button
                      onClick={downloadPng}
                      disabled={!ganttPng}
                      className="rounded border px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                  >
                    Download PNG
                  </button>
                </div>
                {ganttPng ? (
                    <img src={ganttPng} alt="Gantt" className="max-h-96 w-full rounded border object-contain" />
                ) : (
                    <div className="text-sm text-gray-500">—</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

/* ================== Lottie Stat Card ================== */
function PlannerStatCard({ onClick }: { onClick: () => void }) {
  const animRef = useRef<HTMLDivElement | null>(null);
  const inst = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!animRef.current) return;

    inst.current = lottie.loadAnimation({
      container: animRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: "/Robot%20Futuristic%20Ai%20animated.json",
    });

    return () => {
      inst.current?.destroy();
      inst.current = null;
    };
  }, []);

  return (
      <button
          onClick={onClick}
          className="group flex w-full items-center gap-4 rounded-2xl border bg-white px-6 py-5 shadow-sm transition hover:shadow-md"
          title="Open the AI Course Planner"
      >
        <div className="grid h-12 w-12 place-items-center rounded-full bg-gray-100">
          <div ref={animRef} className="h-10 w-10" />
        </div>
        <div className="flex flex-1 items-center justify-between">
          <div className="text-left">
            <div className="text-sm font-semibold text-gray-900">AI Planner</div>
            <div className="text-xs text-gray-500">Plan lessons automatically</div>
          </div>
          <div className="text-xl font-bold text-indigo-600 opacity-0 transition group-hover:opacity-100">↗</div>
        </div>
      </button>
  );
}

/* ================== Dashboard ================== */
export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [teachers, setTeachers] = useState<Record<string, TeacherLite>>({});
  const [loading, setLoading] = useState(true);
  const [plannerOpen, setPlannerOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setEmail(localStorage.getItem("email"));
  }, []);

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
  const ownFolders = useMemo(() => folders.filter((f) => f.teacherEmail.toLowerCase() === me), [folders, me]);
  const sharedFolders = useMemo(() => folders.filter((f) => f.teacherEmail.toLowerCase() !== me), [folders, me]);

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

  type Lesson = { title: string; updated: string; type: string; access: string };
  const lessons: Lesson[] = useMemo(() => {
    const items: Array<{ title: string; date?: string; type: string; access: string }> = [];

    for (const f of folders) {
      const ownerIsMe = f.teacherEmail.toLowerCase() === me;
      const myShare = f.sharedWith.find((s) => s.email.toLowerCase() === me);
      const roleText = myShare?.role === "edit" ? "Edit" : "View";

      const ownerT = teachers[f.teacherEmail.toLowerCase()];
      const ownerLabel = ownerIsMe
          ? "Only Me"
          : `${(ownerT ? `${ownerT.prenom ?? ""} ${ownerT.nom ?? ""}`.trim() : f.teacherEmail) || f.teacherEmail} (${roleText})`;

      for (const p of f.pdfs || [])
        items.push({ title: p.originalName, date: p.uploadedAt, type: typeFromName(p.originalName), access: ownerLabel });
      for (const h of f.h5ps || [])
        items.push({ title: h.originalName, date: h.uploadedAt, type: typeFromName(h.originalName), access: ownerLabel });
    }

    items.sort((a, b) => +(b.date ? new Date(b.date) : 0) - +(a.date ? new Date(a.date) : 0));
    return items.slice(0, 4).map((it) => ({
      title: it.title,
      updated: formatUpdated(it.date),
      type: it.type,
      access: it.access,
    }));
  }, [folders, me, teachers]);

  return (
      <div className="flex flex-col gap-8 p-6">
        <WelcomeBanner />

        {/* Stats row + Lottie planner card */}
        <div className="flex w-full flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <StatsCards stats={stats} />
          </div>
          <div className="md:w-[280px]">
            <PlannerStatCard onClick={() => setPlannerOpen(true)} />
          </div>
        </div>

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

        <PlannerModal open={plannerOpen} onClose={() => setPlannerOpen(false)} />
      </div>
  );
}
