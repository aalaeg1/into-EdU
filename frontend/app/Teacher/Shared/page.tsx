"use client";

import React, { useEffect, useMemo, useState } from "react";

// ---------- config ----------
const API_BASE = "http://localhost:5002";

// ---------- backend types ----------
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

// ---------- helpers ----------
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
    const ms = now.getTime() - d.getTime();
    const days = Math.floor(ms / 86400000);
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

export default function SharedPage() {
    const [email, setEmail] = useState<string | null>(null);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [teachers, setTeachers] = useState<Record<string, TeacherLite>>({});
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string>("");

    // who am I?
    useEffect(() => {
        if (typeof window !== "undefined") setEmail(localStorage.getItem("email"));
    }, []);

    // load teachers (to pretty-print owner names)
    useEffect(() => {
        (async () => {
            try {
                const all = await fetchJson<TeacherLite[]>(`${API_BASE}/api/teachers`, { cache: "no-store" });
                const map: Record<string, TeacherLite> = {};
                for (const t of all) map[t.email.toLowerCase()] = t;
                setTeachers(map);
            } catch {
                setTeachers({});
            }
        })();
    }, []);

    // load all folders I can access (owned + shared); we’ll filter to shared below
    useEffect(() => {
        (async () => {
            if (!email) return;
            setLoading(true);
            setErrorMsg("");
            try {
                const data = await fetchJson<Folder[]>(`${API_BASE}/api/folders`, {
                    method: "GET",
                    cache: "no-store",
                    headers: { "x-teacher-email": email, Accept: "application/json" },
                });
                setFolders(data || []);
            } catch (e: any) {
                console.error("Shared page load error:", e);
                setErrorMsg("Couldn’t load shared content. Please try again.");
                setFolders([]);
            } finally {
                setLoading(false);
            }
        })();
    }, [email]);

    const me = (email || "").toLowerCase();

    // only folders I DON'T own
    const sharedFolders = useMemo(
        () => folders.filter((f) => f.teacherEmail.toLowerCase() !== me),
        [folders, me]
    );

    // flatten files from shared folders into rows (no Actions column)
    type Row = { title: string; folder: string; owner: string; updated: string; type: string };
    const rows: Row[] = useMemo(() => {
        const out: Row[] = [];
        for (const f of sharedFolders) {
            const ownerT = teachers[f.teacherEmail.toLowerCase()];
            const ownerLabel =
                (ownerT ? `${ownerT.prenom ?? ""} ${ownerT.nom ?? ""}`.trim() : "") || f.teacherEmail;

            for (const p of f.pdfs || []) {
                out.push({
                    title: p.originalName,
                    folder: f.name,
                    owner: ownerLabel,
                    updated: formatUpdated(p.uploadedAt),
                    type: typeFromName(p.originalName),
                });
            }
            for (const h of f.h5ps || []) {
                out.push({
                    title: h.originalName,
                    folder: f.name,
                    owner: ownerLabel,
                    updated: formatUpdated(h.uploadedAt),
                    type: typeFromName(h.originalName),
                });
            }
        }
        // newest first
        out.sort((a, b) => (a.updated === "—" ? 1 : b.updated === "—" ? -1 : 0));
        return out;
    }, [sharedFolders, teachers]);

    const sharedFolderCount = sharedFolders.length;
    const sharedItemCount = rows.length;

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Shared With Me</h1>
                <p className="text-gray-600 mt-2">
                    Content that other teachers have shared with you.
                </p>
                <div className="text-sm text-gray-500 mt-2">
                    {loading
                        ? "Loading…"
                        : `${sharedFolderCount} folder${sharedFolderCount === 1 ? "" : "s"} • ${sharedItemCount} item${sharedItemCount === 1 ? "" : "s"}`}
                </div>
            </div>

            {errorMsg && (
                <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
                    {errorMsg}
                </div>
            )}

            {/* Folders quick list (owner shown) */}
            {!loading && sharedFolders.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="font-semibold mb-3">Folders</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {sharedFolders.map((f) => {
                            const ownerT = teachers[f.teacherEmail.toLowerCase()];
                            const owner =
                                (ownerT ? `${ownerT.prenom ?? ""} ${ownerT.nom ?? ""}`.trim() : "") || f.teacherEmail;
                            const count = (f.pdfs?.length || 0) + (f.h5ps?.length || 0);
                            return (
                                <div
                                    key={f._id}
                                    className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2 border"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-yellow-500">📁</span>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{f.name}</span>
                                            <span className="text-xs text-gray-500">
                        shared with you • owner: {owner} • {count} item{count === 1 ? "" : "s"}
                      </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Files table (no Actions column) */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="font-semibold px-4 py-3 border-b">Content</div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b">
                            <th className="py-3 px-4 text-left font-semibold">Title</th>
                            <th className="py-3 px-4 text-left font-semibold">Folder</th>
                            <th className="py-3 px-4 text-left font-semibold">Owner</th>
                            <th className="py-3 px-4 text-left font-semibold">Last Updated</th>
                            <th className="py-3 px-4 text-left font-semibold">Type</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-500">
                                    Loading…
                                </td>
                            </tr>
                        )}

                        {!loading && rows.map((r, idx) => (
                            <tr key={idx} className="border-b last:border-0">
                                <td className="py-3 px-4 font-semibold whitespace-nowrap">{r.title}</td>
                                <td className="py-3 px-4 whitespace-nowrap">{r.folder}</td>
                                <td className="py-3 px-4 whitespace-nowrap">{r.owner}</td>
                                <td className="py-3 px-4 whitespace-nowrap">{r.updated}</td>
                                <td className="py-3 px-4 whitespace-nowrap">{r.type}</td>
                            </tr>
                        ))}

                        {!loading && rows.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-gray-500">
                                    No shared content yet.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
