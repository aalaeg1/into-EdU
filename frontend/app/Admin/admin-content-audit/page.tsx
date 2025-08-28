"use client";

import { useEffect, useMemo, useState } from "react";

/** API endpoints */
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

type Row = {
    id: string;
    title: string;
    ownerEmail: string;
    type: "PDF" | "H5P/ZIP";
    createdAt?: string;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, init);
    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${txt}`);
    }
    return (await res.json()) as T;
}
function titleFromFileName(name: string) {
    return name?.replace(/\.[^.]+$/, "") || name;
}

export default function AdminContentAuditPage() {
    const [rows, setRows] = useState<Row[]>([]);
    const [q, setQ] = useState("");
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setErr(null);
            try {
                const teachers: { email: string }[] = await fetchJson(TEACHER_API, { cache: "no-store" });

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

                const r: Row[] = [];
                for (const f of folders || []) {
                    for (const p of f.pdfs || []) {
                        r.push({
                            id: `pdf:${f._id}:${p.filename}`,
                            title: titleFromFileName(p.originalName || p.filename),
                            ownerEmail: f.teacherEmail,
                            type: "PDF",
                            createdAt: p.uploadedAt,
                        });
                    }
                    for (const h of f.h5ps || []) {
                        r.push({
                            id: `h5p:${f._id}:${h.filename}`,
                            title: titleFromFileName(h.originalName || h.filename),
                            ownerEmail: f.teacherEmail,
                            type: "H5P/ZIP",
                            createdAt: h.uploadedAt,
                        });
                    }
                }

                // newest first
                r.sort((a, b) => {
                    const ta = a.createdAt ? +new Date(a.createdAt) : 0;
                    const tb = b.createdAt ? +new Date(b.createdAt) : 0;
                    return tb - ta;
                });

                setRows(r);
            } catch (e: any) {
                setErr(e?.message || "Failed to load content");
                setRows([]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = useMemo(() => {
        const qq = q.trim().toLowerCase();
        if (!qq) return rows;
        return rows.filter(
            (i) =>
                i.title.toLowerCase().includes(qq) ||
                i.ownerEmail.toLowerCase().includes(qq) ||
                i.type.toLowerCase().includes(qq)
        );
    }, [rows, q]);

    return (
        <div className="px-8 py-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                    <h3 className="text-2xl font-bold text-gray-800">Content Audit</h3>
                    <p className="text-gray-500 text-sm">Listing real content from your folders service.</p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search title, owner or type…"
                        className="border rounded px-3 py-2 w-72"
                    />
                </div>
            </div>

            {err && <div className="rounded border border-red-200 bg-red-50 text-red-700 px-4 py-3">{err}</div>}

            <div className="bg-white border rounded shadow overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-2 text-left">Title</th>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-left">Owner</th>
                        <th className="px-4 py-2 text-left">Created</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Loading…</td></tr>
                    ) : filtered.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No content.</td></tr>
                    ) : (
                        filtered.map((i) => (
                            <tr key={i.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 border-b">{i.title}</td>
                                <td className="px-4 py-2 border-b">{i.type}</td>
                                <td className="px-4 py-2 border-b">{i.ownerEmail}</td>
                                <td className="px-4 py-2 border-b">
                                    {i.createdAt ? new Date(i.createdAt).toLocaleString() : "—"}
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
