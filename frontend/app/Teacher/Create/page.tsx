"use client";
import { useEffect, useState } from "react";
import { FolderPlus, Folder as FolderIcon, Trash2, Pencil, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Share = { email: string; role: "view" | "edit" };
type TFolder = {
  _id: string;
  name: string;
  teacherEmail: string;      // <-- NEW: needed to know who owns
  sharedWith?: Share[];
};

const API_BASE = "http://localhost:5002";

// helper for JSON responses (do not use on 204)
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${txt}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export default function CreatePage() {
  const [folders, setFolders] = useState<TFolder[]>([]);
  const [name, setName] = useState("");
  const router = useRouter();

  const email = typeof window !== "undefined" ? localStorage.getItem("email") : null;

  // load my + shared folders
  useEffect(() => {
    const load = async () => {
      if (!email) return;
      try {
        const data = await fetchJson<TFolder[]>(`${API_BASE}/api/folders`, {
          method: "GET",
          cache: "no-store",
          headers: { "x-teacher-email": email, Accept: "application/json" },
        });
        setFolders(data || []);
      } catch (e) {
        console.error("Load folders error:", e);
        setFolders([]);
      }
    };
    void load();
  }, [email]);

  // create (owner = me)
  const handleCreate = async () => {
    if (!name.trim() || !email) return;

    const normalized = name.trim().toLowerCase();
    if (folders.some((f) => f.name.trim().toLowerCase() === normalized)) {
      alert("Ce nom de dossier existe déjà.");
      return;
    }

    try {
      const created = await fetchJson<TFolder>(`${API_BASE}/api/folders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-teacher-email": email,
          Accept: "application/json",
        },
        body: JSON.stringify({ name: name.trim(), teacherEmail: email }),
      });
      setFolders((prev) => [...prev, created]);
      setName("");
    } catch (err: any) {
      console.error("Create folder error:", err);
      alert(String(err?.message || "Échec de création du dossier"));
    }
  };

  const openFolder = (name: string) => {
    router.push(`/Teacher/Dashboard/Workspace/${encodeURIComponent(name)}`);
  };

  // delete (204 no body) — owner only (backend enforces)
  const handleDeleteFolder = async (folder: TFolder) => {
    if (!email) return;
    if (!confirm(`Supprimer le dossier "${folder.name}" et tout son contenu ?`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/folders/id/${encodeURIComponent(folder._id)}`, {
        method: "DELETE",
        headers: { "x-teacher-email": email, Accept: "application/json" },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${txt}`);
      }
      setFolders((prev) => prev.filter((f) => f._id !== folder._id));
    } catch (err) {
      console.error("Delete folder error:", err);
      alert("Échec de la suppression du dossier");
    }
  };

  // rename — owner only (backend enforces)
  const handleRenameFolder = async (folder: TFolder) => {
    if (!email) return;
    const newName = prompt("Nouveau nom du dossier :", folder.name)?.trim();
    if (!newName || newName === folder.name) return;

    if (folders.some((f) => f._id !== folder._id && f.name.trim().toLowerCase() === newName.toLowerCase())) {
      alert("Un autre dossier porte déjà ce nom.");
      return;
    }

    try {
      const data = await fetchJson<{ folder: TFolder }>(
          `${API_BASE}/api/folders/id/${encodeURIComponent(folder._id)}/rename`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "x-teacher-email": email,
              Accept: "application/json",
            },
            body: JSON.stringify({ name: newName }),
          }
      );
      setFolders((prev) => prev.map((f) => (f._id === folder._id ? data.folder : f)));
    } catch (err: any) {
      console.error("Rename folder error:", err);
      alert(String(err?.message || "Échec du renommage"));
    }
  };

  // SHARE — owner only in UI (and also enforced by backend)
  const handleShareFolder = async (folder: TFolder) => {
    if (!email) return;
    const raw = prompt(
        `Emails à partager (séparés par des virgules).\n` +
        `Tu peux suffixer ":edit" pour donner l'édition. Ex: prof1@ecole.com, prof2@ecole.com:edit`
    );
    if (!raw) return;

    const items = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((token) => {
          const [em, rolePart] = token.split(":").map((x) => x.trim());
          const role: Share["role"] = rolePart === "edit" ? "edit" : "view";
          return { email: em.toLowerCase(), role };
        })
        .filter((s) => /\S+@\S+\.\S+/.test(s.email));

    if (!items.length) {
      alert("Aucun email valide.");
      return;
    }

    try {
      const data = await fetchJson<{ folder: TFolder }>(
          `${API_BASE}/api/folders/id/${encodeURIComponent(folder._id)}/share`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "x-teacher-email": email,
              Accept: "application/json",
            },
            body: JSON.stringify({ add: items }),
          }
      );
      setFolders((prev) => prev.map((f) => (f._id === folder._id ? data.folder : f)));
      alert("Partage mis à jour.");
    } catch (err: any) {
      console.error("Share folder error:", err);
      alert(String(err?.message || "Échec du partage"));
    }
  };

  return (
      <div className="p-10 space-y-6">
        <h2 className="text-2xl font-bold">Créer un nouveau dossier</h2>

        <div className="flex gap-2">
          <input
              className="border px-4 py-2 rounded w-72"
              placeholder="Nom du dossier"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
          />
          <button onClick={handleCreate} className="bg-black text-white px-4 py-2 rounded">
            <FolderPlus className="w-5 h-5 inline-block mr-1" /> Créer
          </button>
        </div>

        <div className="space-y-3">
          {folders.map((f) => {
            const isOwner =
                !!email && f.teacherEmail && f.teacherEmail.toLowerCase() === email.toLowerCase();

            const rightBadge = isOwner
                ? f.sharedWith?.length
                    ? `• shared with ${f.sharedWith.length}`
                    : ""
                : "• shared with you"; // <— what you asked

            return (
                <div
                    key={f._id}
                    onClick={() => openFolder(f.name)}
                    className="bg-gray-100 px-4 py-2 rounded cursor-pointer hover:bg-gray-200 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2">
                    <FolderIcon className="text-yellow-500 w-5 h-5" />
                    <span className="font-medium">
                  {f.name}
                      {rightBadge ? (
                          <span className="ml-2 text-xs text-gray-500">{rightBadge}</span>
                      ) : null}
                </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Share: show ONLY for owner */}
                    {isOwner && (
                        <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShareFolder(f);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded"
                            title="Partager le dossier"
                        >
                          <Share2 className="w-5 h-5" />
                          <span className="sr-only">Partager</span>
                        </button>
                    )}

                    {/* Rename / Delete — optional: keep visible; backend still enforces owner-only */}
                    <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameFolder(f);
                        }}
                        className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded"
                        title="Renommer le dossier"
                    >
                      <Pencil className="w-5 h-5" />
                      <span className="sr-only">Renommer</span>
                    </button>

                    <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(f);
                        }}
                        className="text-red-600 hover:text-red-800 px-2 py-1 rounded"
                        title="Supprimer le dossier"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span className="sr-only">Supprimer</span>
                    </button>
                  </div>
                </div>
            );
          })}
        </div>
      </div>
  );
}
