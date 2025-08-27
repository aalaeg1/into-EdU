"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowLeft,
    Download,
    FileUp,
    Play,
    X,
    Trash2,
    UserPlus,
    Shield,
    ShieldCheck,
} from "lucide-react";
import JSZip from "jszip";

/** ==== Types ==== */
type PDFFile = { originalName: string; filename: string; uploadedAt?: string };
type H5PFile = { originalName: string; filename: string; uploadedAt?: string };
type Share = { email: string; role: "view" | "edit" };
type Folder = {
    _id: string;
    name: string;
    teacherEmail: string;
    sharedWith: Share[];
    pdfs: PDFFile[];
    h5ps: H5PFile[];
};
type TeacherLite = { email: string; nom?: string; prenom?: string };

const API_BASE = "http://localhost:5002";

/** Small inline banner (toast) */
function Banner({
                    kind,
                    text,
                    onClose,
                }: {
    kind: "success" | "error";
    text: string;
    onClose: () => void;
}) {
    return (
        <div
            className={`fixed right-4 top-4 z-50 rounded-md px-4 py-2 shadow ${
                kind === "success"
                    ? "bg-green-600 text-white"
                    : "bg-red-600 text-white"
            }`}
            role="alert"
        >
            <div className="flex items-center gap-3">
                <span>{text}</span>
                <button className="opacity-80 hover:opacity-100" onClick={onClose}>
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export default function FolderView() {
    const router = useRouter();
    const params = useParams<{ folderName?: string | string[] }>();
    const folderName = useMemo(() => {
        const val = params?.folderName;
        const name = Array.isArray(val) ? val[0] : val;
        return name ? decodeURIComponent(name) : undefined;
    }, [params]);

    const fileRef = useRef<HTMLInputElement>(null);
    const h5pFolderRef = useRef<HTMLInputElement>(null);
    const h5pSingleRef = useRef<HTMLInputElement>(null);

    const [folder, setFolder] = useState<Folder | null>(null);
    const [email, setEmail] = useState<string | null>(null);

    const [currentH5P, setCurrentH5P] = useState<string | null>(null);
    const [iframeSrc, setIframeSrc] = useState<string | null>(null);

    // banner notice
    const [notice, setNotice] = useState<{
        kind: "success" | "error";
        text: string;
    } | null>(null);
    const show = (kind: "success" | "error", text: string) => {
        setNotice({ kind, text });
        setTimeout(() => setNotice(null), 4000);
    };

    // people-picker state
    const [search, setSearch] = useState("");
    const [searchBusy, setSearchBusy] = useState(false);
    const [results, setResults] = useState<TeacherLite[]>([]);
    const [selected, setSelected] = useState<TeacherLite | null>(null);
    const [shareRole, setShareRole] = useState<"view" | "edit">("view");
    const [pickerOpen, setPickerOpen] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") setEmail(localStorage.getItem("email"));
    }, []);

    // load accessible folders for me, pick current
    const refreshFolder = async () => {
        if (!email || !folderName) return;
        const res = await fetch(`${API_BASE}/api/folders`, {
            method: "GET",
            cache: "no-store",
            headers: { "x-teacher-email": email },
        });
        if (!res.ok) return;
        const folders = (await res.json()) as Folder[];
        setFolder(folders.find((f) => f.name === folderName) ?? null);
    };

    useEffect(() => {
        void refreshFolder();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [email, folderName]);

    // owner?
    const isOwner = useMemo(
        () =>
            !!folder &&
            !!email &&
            folder.teacherEmail?.toLowerCase() === email.toLowerCase(),
        [folder, email]
    );

    // ---------- people picker search ----------
    useEffect(() => {
        let aborted = false;
        const run = async () => {
            const q = search.trim();
            if (!q) {
                setResults([]);
                return;
            }
            setSearchBusy(true);
            try {
                const res = await fetch(
                    `${API_BASE}/api/teachers/search?q=${encodeURIComponent(q)}`,
                    { cache: "no-store" }
                );
                if (!res.ok) throw new Error(String(res.status));
                const arr = (await res.json()) as TeacherLite[];

                // hide me + already shared
                const me = (email || "").toLowerCase();
                const existing = new Set([
                    me,
                    ...(folder?.sharedWith.map((s) => s.email.toLowerCase()) || []),
                ]);
                const filtered = arr.filter(
                    (t) => !existing.has(t.email.toLowerCase())
                );

                if (!aborted) setResults(filtered);
            } catch {
                if (!aborted) setResults([]);
            } finally {
                if (!aborted) setSearchBusy(false);
            }
        };
        run();
        return () => {
            aborted = true;
        };
    }, [search, email, folder]);

    const pick = (t: TeacherLite) => {
        setSelected(t);
        setSearch(`${t.prenom ?? ""} ${t.nom ?? ""}`.trim() || t.email);
        setPickerOpen(false);
    };

    // ---------- uploads ----------
    const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const file = input.files?.[0];
        if (!file || !folder?._id || !email) {
            input.value = "";
            return;
        }
        try {
            const formData = new FormData();
            formData.append("pdf", file);
            const res = await fetch(
                `${API_BASE}/api/folders/${folder._id}/upload-pdf`,
                {
                    method: "POST",
                    body: formData,
                    headers: { "x-teacher-email": email },
                }
            );
            if (!res.ok) throw new Error();
            await refreshFolder();
            show("success", "PDF uploaded.");
        } catch {
            show("error", "Failed to upload PDF.");
        } finally {
            input.value = "";
        }
    };

    const handleH5PFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const files = input.files ? Array.from(input.files) : [];
        if (!files.length || !folder?._id || !email) {
            input.value = "";
            return;
        }
        try {
            const zip = new JSZip();
            for (const f of files) {
                const path =
                    "webkitRelativePath" in f
                        ? (f as File & { webkitRelativePath: string }).webkitRelativePath
                        : f.name;
                zip.file(path, f);
            }
            const content = await zip.generateAsync({ type: "blob" });
            const dirName = deriveRootDirName(files) || "package";
            const zipFile = new File([content], `${dirName}.zip`, {
                type: "application/zip",
            });

            const formData = new FormData();
            formData.append("h5p", zipFile);

            const res = await fetch(
                `${API_BASE}/api/folders/${folder._id}/upload-h5p`,
                {
                    method: "POST",
                    body: formData,
                    headers: { "x-teacher-email": email },
                }
            );
            if (!res.ok) throw new Error();
            await refreshFolder();
            show("success", "Folder uploaded.");
        } catch {
            show("error", "Failed to upload the folder.");
        } finally {
            input.value = "";
        }
    };

    const handleH5PSingleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const file = input.files?.[0];
        if (!file || !folder?._id || !email) {
            input.value = "";
            return;
        }
        try {
            const formData = new FormData();
            formData.append("h5p", file);
            const res = await fetch(
                `${API_BASE}/api/folders/${folder._id}/upload-h5p`,
                {
                    method: "POST",
                    body: formData,
                    headers: { "x-teacher-email": email },
                }
            );
            if (!res.ok) throw new Error();
            await refreshFolder();
            show("success", "File uploaded.");
        } catch {
            show("error", "Failed to upload the file.");
        } finally {
            input.value = "";
        }
    };

    const handleDeletePDF = async (pdf: PDFFile) => {
        if (!folder?._id || !email) return;
        try {
            const res = await fetch(
                `${API_BASE}/api/folders/${folder._id}/pdf/${encodeURIComponent(
                    pdf.filename
                )}`,
                {
                    method: "DELETE",
                    headers: { "x-teacher-email": email },
                }
            );
            if (!res.ok) throw new Error();
            await refreshFolder();
            show("success", "PDF deleted.");
        } catch {
            show("error", "Failed to delete the PDF.");
        }
    };

    const handleDeleteH5P = async (h5p: H5PFile) => {
        if (!folder?._id || !email) return;
        try {
            const res = await fetch(
                `${API_BASE}/api/folders/${folder._id}/h5p/${encodeURIComponent(
                    h5p.filename
                )}`,
                {
                    method: "DELETE",
                    headers: { "x-teacher-email": email },
                }
            );
            if (!res.ok) throw new Error();
            await refreshFolder();
            show("success", "Content deleted.");
        } catch {
            show("error", "Failed to delete the content.");
        }
    };

    // ---------- viewer ----------
    const playH5P = async (h5pFile: H5PFile) => {
        try {
            if (iframeSrc) {
                URL.revokeObjectURL(iframeSrc);
                setIframeSrc(null);
            }
            const fileUrl = `${API_BASE}/uploads/${encodeURIComponent(
                h5pFile.filename
            )}`;
            const response = await fetch(fileUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const filenameLower = h5pFile.filename.toLowerCase();
            const isZipLike =
                filenameLower.endsWith(".zip") || filenameLower.endsWith(".h5p");

            if (isZipLike) {
                const blob = await response.blob();
                const zip = await JSZip.loadAsync(blob);

                let indexEntry: JSZip.JSZipObject | null = null;
                zip.forEach((relPath, entry) => {
                    if (relPath.toLowerCase().endsWith("index.html") && !entry.dir)
                        indexEntry = entry;
                });
                if (!indexEntry) {
                    show("error", "index.html introuvable dans l’archive.");
                    return;
                }

                let html = await indexEntry.async("string");
                const urlMap = new Map<string, string>();
                const entries: Array<{ path: string; entry: JSZip.JSZipObject }> = [];
                zip.forEach((p, e) => {
                    if (!e.dir) entries.push({ path: p, entry: e });
                });
                for (const { path, entry } of entries) {
                    try {
                        const b = await entry.async("blob");
                        const u = URL.createObjectURL(b);
                        urlMap.set(path, u);
                    } catch {}
                }

                const indexDir = indexEntry.name.split("/").slice(0, -1).join("/");
                const sortedPaths = Array.from(urlMap.keys()).sort(
                    (a, b) => b.length - a.length
                );

                for (const p of sortedPaths) {
                    const relFromIndex = indexDir
                        ? p.replace(new RegExp(`^${escapeForRegExp(indexDir)}/`), "")
                        : p;
                    const candidates = new Set<string>([
                        p,
                        relFromIndex,
                        `./${relFromIndex}`,
                        `/${relFromIndex}`,
                    ]);
                    for (const cand of candidates) {
                        const re = new RegExp(escapeForRegExp(cand), "g");
                        html = html.replace(re, urlMap.get(p) || cand);
                    }
                }

                const htmlBlob = new Blob([html], { type: "text/html" });
                const url = URL.createObjectURL(htmlBlob);
                setIframeSrc(url);
                setCurrentH5P(h5pFile.originalName);
                return;
            }

            const directBlob = await response.blob();
            const directUrl = URL.createObjectURL(directBlob);
            setIframeSrc(directUrl);
            setCurrentH5P(h5pFile.originalName);
        } catch {
            show("error", "Erreur lors du chargement du contenu (ZIP/H5P/HTML)");
        }
    };

    const closeH5P = () => {
        if (iframeSrc) {
            URL.revokeObjectURL(iframeSrc);
            setIframeSrc(null);
        }
        setCurrentH5P(null);
    };

    // ---------- share actions (owner only) ----------
    const addShare = async () => {
        if (!folder?._id || !email) return;
        if (!selected) {
            show("error", "Pick a teacher from the list.");
            return;
        }
        try {
            const res = await fetch(
                `${API_BASE}/api/folders/id/${folder._id}/share`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", "x-teacher-email": email },
                    body: JSON.stringify({
                        add: [{ email: selected.email, role: shareRole }],
                    }),
                }
            );
            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                if (txt.includes("Unknown teachers"))
                    show("error", "Teacher not found in database.");
                else show("error", "Failed to share this folder.");
                return;
            }
            const data = (await res.json()) as { folder: Folder };
            setFolder(data.folder);
            setSelected(null);
            setSearch("");
            setShareRole("view");
            show("success", "Access granted.");
        } catch {
            show("error", "Failed to share this folder.");
        }
    };

    const updateShareRole = async (
        targetEmail: string,
        role: "view" | "edit"
    ) => {
        if (!folder?._id || !email) return;
        try {
            const res = await fetch(
                `${API_BASE}/api/folders/id/${folder._id}/share`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", "x-teacher-email": email },
                    body: JSON.stringify({ add: [{ email: targetEmail, role }] }),
                }
            );
            if (!res.ok) throw new Error();
            const data = (await res.json()) as { folder: Folder };
            setFolder(data.folder);
            show("success", "Role updated.");
        } catch {
            show("error", "Failed to update role.");
        }
    };

    const removeShare = async (targetEmail: string) => {
        if (!folder?._id || !email) return;
        try {
            const res = await fetch(
                `${API_BASE}/api/folders/id/${folder._id}/share`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", "x-teacher-email": email },
                    body: JSON.stringify({ remove: [targetEmail] }),
                }
            );
            if (!res.ok) throw new Error();
            const data = (await res.json()) as { folder: Folder };
            setFolder(data.folder);
            show("success", "Access removed.");
        } catch {
            show("error", "Failed to remove access.");
        }
    };

    return (
        <div className="p-10 space-y-6">
            {notice && (
                <Banner
                    kind={notice.kind}
                    text={notice.text}
                    onClose={() => setNotice(null)}
                />
            )}

            <button
                onClick={() => router.push("/Teacher/Create")}
                className="text-blue-600 hover:underline flex items-center gap-1"
            >
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <h2 className="text-2xl font-bold">Folder: {folderName ?? "—"}</h2>

            {/* Owner / Shared hint */}
            {folder && email && (
                <div className="text-sm text-gray-600">
                    {isOwner ? (
                        <span className="inline-flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> You are the owner (
                            {folder.teacherEmail})
            </span>
                    ) : (
                        <span className="inline-flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Shared with you • Owner:{" "}
                            <span className="font-mono">{folder.teacherEmail}</span>
            </span>
                    )}
                </div>
            )}

            {/* Share panel (owner only) */}
            {folder && isOwner && (
                <div className="rounded-lg border p-4 space-y-4">
                    <div className="font-semibold flex items-center gap-2">
                        <UserPlus className="w-4 h-4" /> People with access
                    </div>

                    {/* People picker */}
                    <div className="flex flex-wrap items-center gap-2 relative">
                        <div className="relative">
                            <input
                                className="border rounded px-3 py-2 w-72"
                                placeholder="Search name or email…"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPickerOpen(true);
                                    setSelected(null);
                                }}
                                onFocus={() => setPickerOpen(true)}
                                onBlur={() => setTimeout(() => setPickerOpen(false), 150)} // let click fire
                            />
                            {/* dropdown */}
                            {pickerOpen && (results.length > 0 || searchBusy) && (
                                <div className="absolute z-20 mt-1 w-full rounded-md border bg-white shadow">
                                    {searchBusy && (
                                        <div className="px-3 py-2 text-sm text-gray-500">
                                            Searching…
                                        </div>
                                    )}
                                    {!searchBusy &&
                                        results.map((t) => {
                                            const label = `${t.prenom ?? ""} ${t.nom ?? ""}`.trim();
                                            return (
                                                <button
                                                    type="button"
                                                    key={t.email}
                                                    onClick={() => pick(t)}
                                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                                                    title={t.email}
                                                >
                                                    <div className="font-medium">
                                                        {label || t.email}
                                                    </div>
                                                    {label && (
                                                        <div className="text-xs text-gray-500">
                                                            {t.email}
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                </div>
                            )}
                        </div>

                        <select
                            className="border rounded px-2 py-2"
                            value={shareRole}
                            onChange={(e) =>
                                setShareRole(e.target.value as "view" | "edit")
                            }
                        >
                            <option value="view">View</option>
                            <option value="edit">Edit</option>
                        </select>

                        <button
                            onClick={addShare}
                            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
                            disabled={!selected}
                        >
                            Add
                        </button>
                    </div>

                    {/* Current collaborators */}
                    <ul className="space-y-2">
                        {folder.sharedWith.length === 0 && (
                            <li className="text-sm text-gray-500">Nobody yet.</li>
                        )}
                        {folder.sharedWith.map((s) => (
                            <li
                                key={s.email}
                                className="flex items-center gap-3 p-2 bg-gray-50 rounded"
                            >
                <span className="flex-1">
                  {s.email}{" "}
                    <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                            s.role === "edit"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-indigo-100 text-indigo-700"
                        }`}
                    >
                    {s.role}
                  </span>
                </span>
                                <select
                                    className="border rounded px-2 py-1 text-sm"
                                    value={s.role}
                                    onChange={(e) =>
                                        updateShareRole(s.email, e.target.value as "view" | "edit")
                                    }
                                    title="Change role"
                                >
                                    <option value="view">View</option>
                                    <option value="edit">Edit</option>
                                </select>
                                <button
                                    onClick={() => removeShare(s.email)}
                                    className="text-red-600 hover:text-red-800"
                                    title="Remove access"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Viewer */}
            {iframeSrc && (
                <div className="border rounded-lg overflow-hidden bg-white shadow-lg">
                    <div className="bg-purple-600 text-white p-3 flex justify-between items-center">
                        <h3 className="font-semibold">🎓 {currentH5P}</h3>
                        <button onClick={closeH5P} className="text-white hover:text-gray-200">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="h-[600px]">
                        <iframe
                            src={iframeSrc}
                            className="w-full h-full border-0"
                            title="H5P/ZIP Viewer"
                            allowFullScreen
                        />
                    </div>
                </div>
            )}

            {/* Files */}
            <div className="space-y-8">
                {/* PDFs */}
                <div>
                    <div className="flex items-center gap-3">
                        <button
                            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60"
                            onClick={() => fileRef.current?.click()}
                            disabled={!folder}
                        >
                            <FileUp className="w-4 h-4 inline-block mr-2" /> Upload PDF
                        </button>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="application/pdf"
                            onChange={handlePDFUpload}
                            hidden
                        />
                    </div>
                    <ul className="mt-3 space-y-1">
                        {folder?.pdfs.map((pdf) => (
                            <li
                                key={pdf.filename}
                                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded"
                            >
                                <span className="flex-1">📄 {pdf.originalName}</span>
                                <a
                                    href={`${API_BASE}/uploads/${encodeURIComponent(
                                        pdf.filename
                                    )}`}
                                    className="text-blue-500 underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Download"
                                >
                                    <Download className="w-4 h-4" />
                                </a>
                                <button
                                    onClick={() => handleDeletePDF(pdf)}
                                    className="text-red-600 hover:text-red-800"
                                    title="Delete PDF"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* H5P/ZIP */}
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            className="bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-60"
                            onClick={() => h5pSingleRef.current?.click()}
                            disabled={!folder}
                            title="Upload .h5p or .zip"
                        >
                            <FileUp className="w-4 h-4 inline-block mr-2" /> Upload .h5p/.zip
                        </button>
                        <input
                            ref={h5pSingleRef}
                            type="file"
                            accept=".h5p,.zip,text/html"
                            onChange={handleH5PSingleUpload}
                            hidden
                        />

                        <button
                            className="bg-purple-700 text-white px-4 py-2 rounded disabled:opacity-60"
                            onClick={() => h5pFolderRef.current?.click()}
                            disabled={!folder}
                            title="Upload a whole folder (zipped)"
                        >
                            <FileUp className="w-4 h-4 inline-block mr-2" /> Upload folder
                        </button>
                        <input
                            ref={h5pFolderRef}
                            type="file"
                            multiple
                            onChange={handleH5PFolderUpload}
                            hidden
                            // @ts-expect-error non-standard
                            webkitdirectory=""
                            // @ts-expect-error alt
                            directory=""
                        />
                    </div>

                    {/* Helpful hint */}
                    <div className="mt-2 text-xs text-gray-600">
                        Don’t have content yet? We invite you to create your own H5P
                        content at{" "}
                        <a
                            href="https://lumi.education/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                        >
                            lumi.education
                        </a>{" "}
                        or{" "}
                        <a
                            href="https://h5p.org/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                        >
                            h5p.org
                        </a>
                        .
                    </div>

                    <ul className="mt-3 space-y-1">
                        {folder?.h5ps.map((h5p) => (
                            <li
                                key={h5p.filename}
                                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded"
                            >
                                <span className="flex-1">🎓 {h5p.originalName}</span>
                                <button
                                    onClick={() => playH5P(h5p)}
                                    className="text-green-600 hover:text-green-800"
                                    title="Play content"
                                >
                                    <Play className="w-4 h-4" />
                                </button>
                                <a
                                    href={`${API_BASE}/uploads/${encodeURIComponent(
                                        h5p.filename
                                    )}`}
                                    className="text-blue-500 underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Download"
                                >
                                    <Download className="w-4 h-4" />
                                </a>
                                <button
                                    onClick={() => handleDeleteH5P(h5p)}
                                    className="text-red-600 hover:text-red-800"
                                    title="Delete content"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

/** Utils */
type FileWithPath = File & { webkitRelativePath: string };
function escapeForRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function deriveRootDirName(files: File[]): string | null {
    const firstWithPath = files.find(
        (f): f is FileWithPath => "webkitRelativePath" in f
    );
    const rel = (firstWithPath as FileWithPath | undefined)?.webkitRelativePath;
    if (!rel) {
        const name = files[0]?.name ?? "";
        return name ? name.replace(/\.[^./]+$/, "") : null;
    }
    const root = rel.split("/")[0];
    return root || null;
}
