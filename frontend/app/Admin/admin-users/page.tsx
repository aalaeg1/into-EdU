"use client";

import { useEffect, useMemo, useState } from "react";

type Teacher = {
    _id?: string;
    nom?: string;
    prenom?: string;
    email: string;
    password?: string;
    blocked?: boolean;
};

const TEACHERS_API = "http://localhost:5002/api/teachers";
const EMAIL_API = "http://localhost:5003/api/email/send";

const STORAGE_KEY = "sentEmails";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, init);
    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${txt}`);
    }
    return res.json() as Promise<T>;
}

export default function AdminUsersPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [sending, setSending] = useState<string | null>(null);
    const [working, setWorking] = useState<string | null>(null);
    const [sentEmails, setSentEmails] = useState<string[]>([]);
    const [query, setQuery] = useState("");

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setSentEmails(JSON.parse(raw));
        } catch {}
    }, []);
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sentEmails));
        } catch {}
    }, [sentEmails]);

    const load = async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const list = await fetchJson<Teacher[]>(TEACHERS_API, { cache: "no-store" });
            const seen = new Set<string>();
            const dedup = list.filter((t) => {
                const e = (t.email || "").toLowerCase().trim();
                if (!e || seen.has(e)) return false;
                seen.add(e);
                return true;
            });
            setTeachers(dedup);
        } catch (err: any) {
            setLoadError(err?.message || "Failed to load teachers");
            setTeachers([]);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        void load();
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return teachers;
        return teachers.filter((t) => {
            const full = `${t.prenom ?? ""} ${t.nom ?? ""}`.toLowerCase();
            return (
                full.includes(q) ||
                (t.email || "").toLowerCase().includes(q) ||
                (t.nom ?? "").toLowerCase().includes(q) ||
                (t.prenom ?? "").toLowerCase().includes(q)
            );
        });
    }, [teachers, query]);

    // Invite -> teacher-service generates temp password; email-service sends it
    const handleSendEmail = async (t: Teacher) => {
        setSending(t.email);
        try {
            const r = await fetch(
                `${TEACHERS_API}/${encodeURIComponent(t.email)}/invite`,
                { method: "POST", headers: { "Content-Type": "application/json" } }
            );
            if (!r.ok) throw new Error(await r.text());
            const invited = (await r.json()) as {
                email: string;
                nom?: string;
                prenom?: string;
                password: string;
            };

            const mail = await fetch(EMAIL_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nom: invited.nom ?? t.nom ?? "",
                    prenom: invited.prenom ?? t.prenom ?? "",
                    email: invited.email,
                    password: invited.password, // original wording in the email-service
                }),
            });

            let ok = mail.ok;
            let body: any = null;
            try {
                body = await mail.json();
            } catch {}
            if (body && typeof body.success === "boolean") ok = ok && body.success;
            if (!ok) {
                const msg = (body && (body.message || body.error)) || `HTTP ${mail.status}`;
                throw new Error(msg);
            }

            setSentEmails((prev) => (prev.includes(t.email) ? prev : [...prev, t.email]));
            alert(`Invitation envoyée à ${t.email}`);
        } catch (err: any) {
            alert(`Erreur lors de l'envoi: ${err?.message || String(err)}`);
        } finally {
            setSending(null);
        }
    };

    const handleToggleBlock = async (t: Teacher) => {
        setWorking(t.email);
        try {
            const res = await fetch(
                `${TEACHERS_API}/${encodeURIComponent(t.email)}/state`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ blocked: !t.blocked }),
                }
            );
            if (!res.ok) throw new Error(await res.text());
            const updated = (await res.json()) as Teacher;
            setTeachers((prev) =>
                prev.map((x) => (x.email === t.email ? { ...x, blocked: updated.blocked } : x))
            );
        } catch (e: any) {
            alert(`Impossible de mettre à jour l'état: ${e?.message || e}`);
        } finally {
            setWorking(null);
        }
    };

    const handleDelete = async (t: Teacher) => {
        if (!confirm(`Supprimer l'enseignant ${t.email} ? Cette action est irréversible.`))
            return;
        setWorking(t.email);
        try {
            const res = await fetch(
                `${TEACHERS_API}/${encodeURIComponent(t.email)}`,
                { method: "DELETE" }
            );
            if (!res.ok) throw new Error(await res.text());
            setTeachers((prev) => prev.filter((x) => x.email !== t.email));
        } catch (e: any) {
            alert(`Suppression impossible: ${e?.message || e}`);
        } finally {
            setWorking(null);
        }
    };

    return (
        <div className="px-8 py-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-gray-800">Liste des enseignants</h3>
                    <p className="text-gray-500 text-sm">Invitez, bloquez ou supprimez des comptes.</p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="border rounded px-3 py-2 w-64"
                        placeholder="Rechercher par nom ou email…"
                    />
                    <button onClick={load} className="px-3 py-2 border rounded bg-white hover:bg-gray-50">
                        Refresh
                    </button>
                </div>
            </div>

            {loading && <p className="text-center text-gray-600">Chargement…</p>}
            {loadError && (
                <div className="bg-red-50 text-red-700 border border-red-200 rounded p-3 mb-4">
                    {loadError}
                </div>
            )}

            {!loading && !loadError && (
                <div className="overflow-x-auto bg-white border rounded shadow">
                    <table className="min-w-full">
                        <thead>
                        <tr className="bg-gray-50">
                            <th className="py-2 px-4 border-b text-left">Nom</th>
                            <th className="py-2 px-4 border-b text-left">Prénom</th>
                            <th className="py-2 px-4 border-b text-left">Email</th>
                            <th className="py-2 px-4 border-b text-left">Statut</th>
                            <th className="py-2 px-4 border-b text-center w-72">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-6 text-center text-gray-500">
                                    Aucun enseignant trouvé.
                                </td>
                            </tr>
                        )}

                        {filtered.map((t, idx) => {
                            const isSent = sentEmails.includes(t.email);
                            const rowKey = t._id ?? t.email ?? `row-${idx}`;
                            const busy = working === t.email;

                            return (
                                <tr key={rowKey} className="hover:bg-gray-50">
                                    <td className="py-2 px-4 border-b">{t.nom || "—"}</td>
                                    <td className="py-2 px-4 border-b">{t.prenom || "—"}</td>
                                    <td className="py-2 px-4 border-b">{t.email}</td>
                                    <td className="py-2 px-4 border-b">
                                        {t.blocked ? (
                                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-red-100 text-red-700">
                          Blocked
                        </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700">
                          Active
                        </span>
                                        )}
                                    </td>
                                    <td className="py-2 px-4 border-b text-center">
                                        <div className="flex items-center gap-2 justify-center">
                                            <button
                                                onClick={() => handleSendEmail(t)}
                                                className={`px-3 py-1 rounded text-white text-sm ${
                                                    isSent
                                                        ? "bg-emerald-600 hover:bg-emerald-700"
                                                        : "bg-blue-600 hover:bg-blue-700"
                                                } disabled:opacity-60`}
                                                disabled={busy || sending === t.email}
                                                title={isSent ? "Renvoyer l'invitation" : "Envoyer l'invitation"}
                                            >
                                                {sending === t.email ? "Envoi…" : isSent ? "Renvoyer" : "Inviter"}
                                            </button>

                                            <button
                                                onClick={() => handleToggleBlock(t)}
                                                className={`px-3 py-1 rounded text-white text-sm ${
                                                    t.blocked
                                                        ? "bg-yellow-600 hover:bg-yellow-700"
                                                        : "bg-gray-700 hover:bg-gray-800"
                                                } disabled:opacity-60`}
                                                disabled={busy}
                                                title={t.blocked ? "Débloquer" : "Bloquer"}
                                            >
                                                {t.blocked ? "Unblock" : "Block"}
                                            </button>

                                            <button
                                                onClick={() => handleDelete(t)}
                                                className="px-3 py-1 rounded text-white text-sm bg-red-600 hover:bg-red-700 disabled:opacity-60"
                                                disabled={busy}
                                                title="Supprimer"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
