"use client";

import { useEffect, useMemo, useState } from "react";

const TEACHER_API = "http://localhost:5002/api/teachers";
const FOLDERS_ADMIN_API = "http://localhost:5002/api/folders/admin";
const FOLDERS_BY_TEACHER_API = "http://localhost:5002/api/folders";

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

type LogItem = {
    id: string;
    when: string; // ISO
    actor: string;
    action: string;
    meta?: Record<string, unknown>;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, init);
    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${txt}`);
    }
    return (await res.json()) as T;
}

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [lastSignin, setLastSignin] = useState<{ email: string; when: string }[]>([]);
    const [err, setErr] = useState<string | null>(null);
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setErr(null);
            try {
                // Teachers (to get lastSignInAt)
                const teachers: { email: string; lastSignInAt?: string }[] = await fetchJson(TEACHER_API, {
                    cache: "no-store",
                });
                const last = (teachers || [])
                    .filter((t) => !!t.lastSignInAt)
                    .map((t) => ({ email: t.email, when: t.lastSignInAt as string }))
                    .sort((a, b) => +new Date(b.when) - +new Date(a.when));
                setLastSignin(last);

                // Folders for inferred upload logs
                let folders: Folder[] | null = null;
                try {
                    folders = await fetchJson<Folder[]>(FOLDERS_ADMIN_API, { cache: "no-store" });
                } catch {
                    const results = await Promise.allSettled(
                        (teachers || []).map((t) =>
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
                    folders = merged;
                }

                const contentDerived: LogItem[] = [];
                for (const f of folders || []) {
                    for (const p of f.pdfs || []) {
                        if (!p.uploadedAt) continue;
                        contentDerived.push({
                            id: `pdf:${f._id}:${p.filename}`,
                            when: p.uploadedAt,
                            actor: f.teacherEmail,
                            action: "UPLOAD_PDF",
                            meta: { filename: p.originalName || p.filename },
                        });
                    }
                    for (const h of f.h5ps || []) {
                        if (!h.uploadedAt) continue;
                        contentDerived.push({
                            id: `h5p:${f._id}:${h.filename}`,
                            when: h.uploadedAt,
                            actor: f.teacherEmail,
                            action: "UPLOAD_H5P",
                            meta: { filename: h.originalName || h.filename },
                        });
                    }
                }

                const all = contentDerived.sort((a, b) => +new Date(b.when) - +new Date(a.when));
                setLogs(all);
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                setErr(msg || "Failed to load logs");
                setLogs([]);
                setLastSignin([]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = useMemo(() => {
        const qq = q.trim().toLowerCase();
        if (!qq) return logs;
        return logs.filter(
            (l) =>
                l.actor.toLowerCase().includes(qq) ||
                l.action.toLowerCase().includes(qq) ||
                JSON.stringify(l.meta || {}).toLowerCase().includes(qq)
        );
    }, [logs, q]);

    return (
        <div className="px-8 py-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                    <h3 className="text-2xl font-bold text-gray-800">System Logs</h3>
                    <p className="text-gray-500 text-sm">
                        Shows last sign-ins (from the backend) and inferred content uploads.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className="border rounded px-3 py-2 w-72"
                        placeholder="Search logs…"
                    />
                </div>
            </div>

            {/* Last sign-in table */}
            <div className="bg-white border rounded shadow overflow-x-auto">
                <div className="px-4 py-3 border-b bg-gray-50 text-sm font-semibold text-gray-700">
                    Last sign-in (per teacher)
                </div>
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-2 text-left">Teacher</th>
                        <th className="px-4 py-2 text-left">Last sign-in</th>
                    </tr>
                    </thead>
                    <tbody>
                    {lastSignin.length === 0 ? (
                        <tr>
                            <td colSpan={2} className="px-4 py-6 text-center text-gray-500">
                                No sign-ins recorded yet.
                            </td>
                        </tr>
                    ) : (
                        lastSignin.map((r) => (
                            <tr key={r.email} className="hover:bg-gray-50">
                                <td className="px-4 py-2 border-b">{r.email}</td>
                                <td className="px-4 py-2 border-b">
                                    {new Date(r.when).toLocaleString()}
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* Content/Upload logs */}
            <div className="bg-white border rounded shadow overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-2 text-left">When</th>
                        <th className="px-4 py-2 text-left">Actor</th>
                        <th className="px-4 py-2 text-left">Action</th>
                        <th className="px-4 py-2 text-left">Meta</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Loading…</td></tr>
                    ) : filtered.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No logs.</td></tr>
                    ) : (
                        filtered.map((l) => (
                            <tr key={l.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 border-b">{new Date(l.when).toLocaleString()}</td>
                                <td className="px-4 py-2 border-b">{l.actor}</td>
                                <td className="px-4 py-2 border-b">{l.action}</td>
                                <td className="px-4 py-2 border-b text-xs text-gray-500">
                                    {l.meta ? JSON.stringify(l.meta) : "—"}
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {err && (
                <div className="rounded border border-red-200 bg-red-50 text-red-700 px-4 py-3">
                    {err}
                </div>
            )}
        </div>
    );
}
