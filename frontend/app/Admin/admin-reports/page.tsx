"use client";

import { useEffect, useMemo, useState } from "react";

/** API endpoints */
const TEACHER_API = "http://localhost:5002/api/teachers";
const FOLDERS_ADMIN_API = "http://localhost:5002/api/folders/admin";
const FOLDERS_BY_TEACHER_API = "http://localhost:5002/api/folders";

/** shared local keys */
const TYPES_KEY = "activityTypesState_v1";
const INVITES_KEY = "sentEmails"; // legacy local list from admin-users page

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

type TeacherLite = {
    email: string;
    invitedAt?: string | null;   // <-- use this from backend
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, init);
    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${txt}`);
    }
    return (await res.json()) as T;
}

export default function AdminReportsPage() {
    const [teachers, setTeachers] = useState<TeacherLite[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [typesState, setTypesState] = useState<Record<string, boolean>>({});
    const [legacyInvited, setLegacyInvited] = useState<string[]>([]);
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Load teachers + folders from backend
    useEffect(() => {
        (async () => {
            setLoading(true);
            setErr(null);
            try {
                // Teachers come with invitedAt (if present in your schema)
                const tchs = await fetchJson<TeacherLite[]>(TEACHER_API, { cache: "no-store" });
                setTeachers(tchs || []);

                // Folders (admin endpoint or per-teacher fallback)
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
                setErr(msg || "Failed to load data");
                setTeachers([]);
                setFolders([]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Load local (client) states
    useEffect(() => {
        try {
            const rawT = localStorage.getItem(TYPES_KEY);
            if (rawT) setTypesState(JSON.parse(rawT) as Record<string, boolean>);
        } catch {}
        try {
            const rawI = localStorage.getItem(INVITES_KEY);
            if (rawI) setLegacyInvited(JSON.parse(rawI) as string[]);
        } catch {}
    }, []);

    // Derived content counts
    const pdfCount = useMemo(
        () => folders.reduce((s, f) => s + (f.pdfs?.length || 0), 0),
        [folders]
    );
    const h5pCount = useMemo(
        () => folders.reduce((s, f) => s + (f.h5ps?.length || 0), 0),
        [folders]
    );

    // Compute invited teachers from backend + local storage (unique emails)
    const invitedTeachersCount = useMemo(() => {
        const fromDB = new Set(
            (teachers || [])
                .filter((t) => !!t.invitedAt)
                .map((t) => t.email.trim().toLowerCase())
        );
        for (const e of legacyInvited) {
            const k = (e || "").trim().toLowerCase();
            if (k) fromDB.add(k);
        }
        return fromDB.size;
    }, [teachers, legacyInvited]);

    // Other totals
    const totals = useMemo(() => {
        const total = pdfCount + h5pCount;
        const activeTypes = Object.values(typesState).filter(Boolean).length;
        const disabledTypes = Object.values(typesState).filter((v) => !v).length;

        const perTeacher: Record<string, number> = {};
        for (const f of folders) {
            const n = (f.pdfs?.length || 0) + (f.h5ps?.length || 0);
            perTeacher[f.teacherEmail] = (perTeacher[f.teacherEmail] || 0) + n;
        }

        return { total, activeTypes, disabledTypes, perTeacher };
    }, [pdfCount, h5pCount, typesState, folders]);

    // CSV exports
    const exportSummaryCSV = () => {
        const lines = [
            "Metric,Value",
            `Total Teachers,${teachers.length}`,
            `Total Content,${totals.total}`,
            `PDF Count,${pdfCount}`,
            `H5P/ZIP Count,${h5pCount}`,
            `Active Types,${totals.activeTypes}`,
            `Disabled Types,${totals.disabledTypes}`,
            `Invited Teachers,${invitedTeachersCount}`,
        ];
        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "report-summary.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportPerTeacherCSV = () => {
        const header = "Teacher Email,Content Count";
        const rows = Object.entries(totals.perTeacher)
            .map(([k, v]) => `${k},${v}`)
            .join("\n");
        const blob = new Blob([header + "\n" + rows], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "report-per-teacher.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="px-8 py-10 space-y-8">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800">Reports</h3>
                <div className="flex gap-2">
                    <button onClick={exportSummaryCSV} className="px-3 py-2 rounded border bg-white hover:bg-gray-50">
                        Export Summary CSV
                    </button>
                    <button onClick={exportPerTeacherCSV} className="px-3 py-2 rounded border bg-white hover:bg-gray-50">
                        Export Per-Teacher CSV
                    </button>
                </div>
            </div>

            {err && <div className="rounded border border-red-200 bg-red-50 text-red-700 px-4 py-3">{err}</div>}

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Teachers", value: teachers.length },
                    { label: "Total Content", value: totals.total },
                    { label: "PDF", value: pdfCount },
                    { label: "H5P/ZIP", value: h5pCount },
                    { label: "Active Types", value: totals.activeTypes },
                    { label: "Disabled Types", value: totals.disabledTypes },
                    { label: "Invited Teachers", value: invitedTeachersCount },
                ].map((c, i) => (
                    <div key={`${c.label}-${i}`} className="bg-white rounded-xl shadow-md px-6 py-4">
                        <div className="text-xs font-semibold text-gray-700 mb-1">{c.label}</div>
                        <div className="text-2xl font-bold text-gray-900">{loading ? "…" : c.value}</div>
                    </div>
                ))}
            </div>

            {/* Per-teacher table */}
            <div className="bg-white rounded-2xl shadow-md p-6">
                <div className="text-xl font-bold text-gray-800 mb-4">Content by Teacher</div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left">Teacher Email</th>
                            <th className="px-4 py-2 text-left">Content Count</th>
                        </tr>
                        </thead>
                        <tbody>
                        {Object.entries(totals.perTeacher).map(([email, n]) => (
                            <tr key={email} className="hover:bg-gray-50">
                                <td className="px-4 py-2 border-b">{email}</td>
                                <td className="px-4 py-2 border-b">{n}</td>
                            </tr>
                        ))}
                        {Object.keys(totals.perTeacher).length === 0 && (
                            <tr>
                                <td colSpan={2} className="px-4 py-8 text-center text-gray-500">No content yet.</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
