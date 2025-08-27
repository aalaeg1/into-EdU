"use client";

import { useMemo, useState } from "react";
import { X, Upload, CalendarDays } from "lucide-react";

const PLANNER_API = "http://localhost:5010";

type PlanResult = {
    plan_text: string;
    plan: any;
    sessions: Array<{ Module: string; Séance: number; Titre: string; Heures: number }>;
    schedule: Array<{ Séance: number; Module: string; Titre: string; Heures: number; Début: string; Fin: string }>;
    gantt_png?: string;
};

export default function PlannerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [mode, setMode] = useState<"text"|"pdf">("text");
    const [text, setText] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const [startDate, setStartDate] = useState<string>("");
    const [maxPerSession, setMaxPerSession] = useState(2);

    // weekdays (0=Mon .. 6=Sun) → hour/min
    const [weekdayTimes, setWeekdayTimes] = useState<Record<number,[number,number]>>({
        0: [9, 0], 2: [14, 0], 4: [10, 30], // default example: Mon, Wed, Fri
    });

    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<PlanResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const weekdayNames = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

    const canGenerate = useMemo(() => {
        if (!startDate) return false;
        if (mode === "text" && text.trim().length < 30) return false;
        if (mode === "pdf" && !file) return false;
        return true;
    }, [mode, text, file, startDate]);

    const toggleDay = (d: number) => {
        setWeekdayTimes(prev => {
            const next = { ...prev };
            if (d in next) delete next[d]; else next[d] = [9, 0];
            return next;
        });
    };

    const updateTime = (d: number, which: "h"|"m", val: number) => {
        setWeekdayTimes(prev => {
            const cur = prev[d] ?? [9,0];
            const next: [number,number] = which === "h" ? [val, cur[1]] : [cur[0], val];
            return { ...prev, [d]: next };
        });
    };

    const generate = async () => {
        setBusy(true); setError(null); setResult(null);
        try {
            if (mode === "text") {
                const res = await fetch(`${PLANNER_API}/api/plan-from-text`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        text,
                        start_date: startDate,
                        weekday_times: weekdayTimes,
                        max_hours_per_session: maxPerSession,
                    }),
                });
                const data = await res.json();
                if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
                setResult(data as PlanResult);
            } else {
                const fd = new FormData();
                if (!file) throw new Error("Select a PDF");
                fd.append("file", file);
                fd.append("start_date", startDate);
                fd.append("weekday_times_json", JSON.stringify(weekdayTimes));
                fd.append("max_hours_per_session", String(maxPerSession));
                const res = await fetch(`${PLANNER_API}/api/plan-from-pdf`, { method: "POST", body: fd });
                const data = await res.json();
                if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
                setResult(data as PlanResult);
            }
        } catch (e: any) {
            setError(e?.message || "Failed to generate plan");
        } finally {
            setBusy(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
            <div className="w-[min(100%,980px)] max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-xl border">
                {/* Header */}
                <div className="px-4 py-3 border-b flex items-center justify-between">
                    <div className="font-semibold">AI Course Planner</div>
                    <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
                </div>

                {/* Body */}
                <div className="p-4 grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {/* Left: inputs */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex gap-2">
                            <button className={`px-3 py-1.5 rounded border ${mode==="text"?"bg-gray-900 text-white":"bg-white"}`} onClick={()=>setMode("text")}>Paste Text</button>
                            <button className={`px-3 py-1.5 rounded border ${mode==="pdf"?"bg-gray-900 text-white":"bg-white"}`} onClick={()=>setMode("pdf")}>Upload PDF</button>
                        </div>

                        {mode==="text" ? (
                            <textarea
                                className="w-full h-40 border rounded p-2 text-sm"
                                placeholder="Paste your course material here..."
                                value={text}
                                onChange={(e)=>setText(e.target.value)}
                            />
                        ) : (
                            <label className="border rounded p-4 flex items-center gap-3 cursor-pointer">
                                <Upload className="w-5 h-5" />
                                <span>{file ? file.name : "Choose a PDF"}</span>
                                <input type="file" accept="application/pdf" className="hidden" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
                            </label>
                        )}

                        <div className="space-y-1">
                            <label className="text-sm font-medium flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Start date</label>
                            <input type="date" className="border rounded px-2 py-1" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
                        </div>

                        <div>
                            <div className="text-sm font-medium mb-1">Weekdays & times</div>
                            <div className="grid grid-cols-2 gap-2">
                                {weekdayNames.map((nm, i)=>(
                                    <div key={i} className="border rounded p-2 flex items-center justify-between">
                                        <label className="flex items-center gap-2">
                                            <input type="checkbox" checked={i in weekdayTimes} onChange={()=>toggleDay(i)} />
                                            <span>{nm}</span>
                                        </label>
                                        <div className="flex items-center gap-1">
                                            <input type="number" min={0} max={23} className="w-14 border rounded px-1 py-0.5"
                                                   value={(weekdayTimes[i]??[9,0])[0]} onChange={(e)=>updateTime(i,"h",Number(e.target.value))} />
                                            :
                                            <input type="number" min={0} max={59} className="w-14 border rounded px-1 py-0.5"
                                                   value={(weekdayTimes[i]??[9,0])[1]} onChange={(e)=>updateTime(i,"m",Number(e.target.value))} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Max hours / session</label>
                            <input type="number" min={1} max={4} className="w-16 border rounded px-2 py-1"
                                   value={maxPerSession} onChange={(e)=>setMaxPerSession(Number(e.target.value))} />
                        </div>

                        <div className="flex gap-2">
                            <button disabled={!canGenerate || busy} onClick={generate}
                                    className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
                                {busy ? "Generating..." : "Generate plan"}
                            </button>
                            <a href="https://lumi.education/" target="_blank" className="text-xs underline text-blue-700">Create H5P with Lumi</a>
                            <a href="https://h5p.org/" target="_blank" className="text-xs underline text-blue-700">or H5P.org</a>
                        </div>

                        {error && <div className="text-sm text-red-600">{error}</div>}
                    </div>

                    {/* Right: results */}
                    <div className="lg:col-span-3 overflow-auto max-h-[70vh] border rounded p-3 space-y-4">
                        {!result && <div className="text-gray-500 text-sm">Results will appear here…</div>}

                        {result && (
                            <>
                                <div>
                                    <div className="font-semibold mb-1">Plan (raw)</div>
                                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto whitespace-pre-wrap">{result.plan_text}</pre>
                                </div>

                                <div>
                                    <div className="font-semibold mb-1">Sessions</div>
                                    <table className="w-full text-sm border">
                                        <thead>
                                        <tr className="bg-gray-50">
                                            <th className="p-2 text-left">#</th>
                                            <th className="p-2 text-left">Module</th>
                                            <th className="p-2 text-left">Title</th>
                                            <th className="p-2 text-left">Hours</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {result.sessions.map((s)=>(
                                            <tr key={s.Séance} className="border-t">
                                                <td className="p-2">S{s.Séance}</td>
                                                <td className="p-2">{s.Module}</td>
                                                <td className="p-2">{s.Titre}</td>
                                                <td className="p-2">{s.Heures}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div>
                                    <div className="font-semibold mb-1">Schedule</div>
                                    <table className="w-full text-sm border">
                                        <thead>
                                        <tr className="bg-gray-50">
                                            <th className="p-2 text-left">#</th>
                                            <th className="p-2 text-left">Start</th>
                                            <th className="p-2 text-left">End</th>
                                            <th className="p-2 text-left">Title</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {result.schedule.map((s)=>(
                                            <tr key={s.Séance} className="border-t">
                                                <td className="p-2">S{s.Séance}</td>
                                                <td className="p-2">{new Date(s.Début).toLocaleString()}</td>
                                                <td className="p-2">{new Date(s.Fin).toLocaleString()}</td>
                                                <td className="p-2">{s.Titre}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>

                                {result.gantt_png && (
                                    <div>
                                        <div className="font-semibold mb-1">Gantt</div>
                                        <img src={result.gantt_png} alt="Gantt" className="w-full rounded border" />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
