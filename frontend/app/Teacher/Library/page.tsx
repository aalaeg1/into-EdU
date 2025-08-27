"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Folder as FolderIcon,
  ChevronDown,
  Pencil,
  Trash,
  MoveRight,
  Copy,
  Download,
  Share2,
} from "lucide-react";

const API_BASE = "http://localhost:5002";

/* ===== Types côté backend ===== */
type FileMeta = { originalName: string; filename: string; uploadedAt?: string | Date };
type TFolder = {
  _id: string;
  name: string;
  pdfs: FileMeta[];
  h5ps: FileMeta[];
};

/* ===== helpers fetch ===== */
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${txt}`);
  }
  return res.json() as Promise<T>;
}
async function fetchOk(url: string, init?: RequestInit): Promise<void> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${txt}`);
  }
}

/* ===== UI ===== */
export default function LibraryPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [folders, setFolders] = useState<TFolder[]>([]);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [sortBy, setSortBy] = useState("title");

  useEffect(() => {
    if (typeof window !== "undefined") setEmail(localStorage.getItem("email"));
  }, []);

  const loadFolders = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const data = await fetchJson<TFolder[]>(`${API_BASE}/api/folders`, {
        method: "GET",
        cache: "no-store",
        headers: {
          "x-teacher-email": email,
          Accept: "application/json",
        },
      });
      setFolders(data);
    } catch (e) {
      console.error("Load folders error:", e);
      alert("Impossible de charger les dossiers");
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFolders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  /* ===== actions dossiers ===== */
  const handleRename = async (folder: TFolder) => {
    if (!email) return;
    const newName = prompt("Nouveau nom :", folder.name)?.trim();
    if (!newName || newName === folder.name) return;
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
    } catch (err) {
      console.error("Rename folder error:", err);
      alert("Échec du renommage.");
    }
  };

  const handleDelete = async (folder: TFolder) => {
    if (!email) return;
    if (!confirm(`Supprimer le dossier "${folder.name}" et tout son contenu ?`)) return;
    try {
      await fetchOk(`${API_BASE}/api/folders/id/${encodeURIComponent(folder._id)}`, {
        method: "DELETE",
        headers: { "x-teacher-email": email, Accept: "application/json" },
      });
      setFolders((prev) => prev.filter((f) => f._id !== folder._id));
    } catch (err) {
      console.error("Delete folder error:", err);
      alert("Échec de la suppression du dossier");
    }
  };

  /* ===== table Content ===== */
  type ContentRow = {
    title: string;
    updated: string;
    type: string;
    folderName: string;
    downloadUrl: string;
    folderId: string;
    kind: "pdf" | "h5p";
    filename: string;
  };

  const extType = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.endsWith(".pdf")) return "PDF";
    if (lower.endsWith(".h5p")) return "H5P";
    if (lower.endsWith(".zip")) return "ZIP";
    return "File";
  };

  const fmt = (d?: string | Date) =>
      d ? new Date(d).toLocaleDateString() : "—";

  const contentRows: ContentRow[] = useMemo(() => {
    const rows: ContentRow[] = [];
    for (const f of folders) {
      for (const p of f.pdfs) {
        rows.push({
          title: p.originalName,
          updated: fmt(p.uploadedAt),
          type: extType(p.originalName),
          folderName: f.name,
          downloadUrl: `${API_BASE}/uploads/${encodeURIComponent(p.filename)}`,
          folderId: f._id,
          kind: "pdf",
          filename: p.filename,
        });
      }
      for (const h of f.h5ps) {
        rows.push({
          title: h.originalName,
          updated: fmt(h.uploadedAt),
          type: extType(h.originalName),
          folderName: f.name,
          downloadUrl: `${API_BASE}/uploads/${encodeURIComponent(h.filename)}`,
          folderId: f._id,
          kind: "h5p",
          filename: h.filename,
        });
      }
    }
    return rows;
  }, [folders]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contentRows
        .filter((r) => {
          if (q && !(`${r.title} ${r.type} ${r.folderName}`.toLowerCase().includes(q))) return false;
          if (selectedType !== "All" && r.type !== selectedType) return false;
          return true;
        })
        .sort((a, b) => {
          if (sortBy === "title") return a.title.localeCompare(b.title);
          if (sortBy === "type") return a.type.localeCompare(b.type);
          if (sortBy === "owner") return a.folderName.localeCompare(b.folderName);
          return 0;
        });
  }, [contentRows, query, selectedType, sortBy]);

  const handleDeleteFile = async (row: ContentRow) => {
    if (!email) return;
    if (!confirm(`Supprimer "${row.title}" ?`)) return;
    try {
      const url =
          row.kind === "pdf"
              ? `${API_BASE}/api/folders/${encodeURIComponent(row.folderId)}/pdf/${encodeURIComponent(row.filename)}`
              : `${API_BASE}/api/folders/${encodeURIComponent(row.folderId)}/h5p/${encodeURIComponent(row.filename)}`;
      await fetchOk(url, {
        method: "DELETE",
        headers: { "x-teacher-email": email, Accept: "application/json" },
      });
      // refresh local state
      setFolders((prev) =>
          prev.map((f) =>
              f._id !== row.folderId
                  ? f
                  : {
                    ...f,
                    pdfs: row.kind === "pdf" ? f.pdfs.filter((p) => p.filename !== row.filename) : f.pdfs,
                    h5ps: row.kind === "h5p" ? f.h5ps.filter((h) => h.filename !== row.filename) : f.h5ps,
                  }
          )
      );
    } catch (e) {
      console.error("Delete file error:", e);
      alert("Échec de la suppression du fichier");
    }
  };

  return (
      <div className="px-8 py-6 w-full">
        {/* Top bar (sans New Folder, comme demandé) */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-8">
          <div className="flex-1">
            <Input
                placeholder="Search by title, tag, or type..."
                className="w-full"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  Content <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedType("PDF")}>PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedType("ZIP")}>ZIP</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedType("All")}>All</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Folders */}
        <div className="mb-8">
          <div className="font-semibold mb-2">Folders</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-center">
            {folders.map((folder) => (
                <div
                    key={folder._id}
                    className="flex items-center bg-white border rounded-md px-4 py-3 shadow-sm gap-3 w-full mb-4"
                >
                  <FolderIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="font-medium flex-1 text-sm whitespace-normal break-words" title={folder.name}>
                {folder.name}
              </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRename(folder)}>
                        <Pencil className="w-4 h-4 mr-2" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(folder)}>
                        <Trash className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        <MoveRight className="w-4 h-4 mr-2" /> Move
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
            ))}
          </div>
        </div>

        {/* Content Table */}
        <div>
          <div className="font-semibold mb-2">Content</div>
          <div className="bg-white rounded-md shadow-sm min-w-[900px]">
            <table className="w-full text-sm">
              <thead>
              <tr className="border-b">
                <th className="py-3 px-4 text-left font-semibold">Title</th>
                <th className="py-3 px-4 text-left font-semibold">Folder</th>
                <th className="py-3 px-4 text-left font-semibold">Last Updated</th>
                <th className="py-3 px-4 text-left font-semibold">Type</th>
                <th className="py-3 px-4 text-left font-semibold">Access</th>
                <th className="py-3 px-4 text-left font-semibold">Actions</th>
              </tr>
              </thead>
              <tbody>
              {filteredRows.map((item, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-3 px-4 font-semibold whitespace-nowrap">{item.title}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{item.folderName}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{item.updated}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{item.type}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                    <span className="rounded-full px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-600">
                      Only Me
                    </span>
                    </td>
                    <td className="py-3 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">



                          <DropdownMenuItem asChild>
                            <a href={item.downloadUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </a>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handleDeleteFile(item)}>
                            <Trash className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>

                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
              ))}
              {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-gray-500">
                      {loading ? "Loading..." : "No content found"}
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
