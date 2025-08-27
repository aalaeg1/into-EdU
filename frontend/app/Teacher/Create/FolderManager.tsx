"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Folder = {
    _id: string;
    name: string;
    pdfs: { filename: string; originalName: string }[];
    h5ps: { title: string }[];
};

export default function FolderManager() {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const router = useRouter();

    const email = typeof window !== "undefined" ? localStorage.getItem("email") : null;

    useEffect(() => {
        if (!email) return;
        fetch(`http://localhost:5002/api/folders/${email}`)
            .then((res) => res.json())
            .then(setFolders);
    }, [email]);

    const refresh = async () => {
        const res = await fetch(`http://localhost:5002/api/folders/${email}`);
        const updated = await res.json();
        setFolders(updated);
    };

    const handleUploadPDF = async () => {
        if (!selectedFile || !selectedFolderId) return;
        const formData = new FormData();
        formData.append("pdf", selectedFile);

        await fetch(`http://localhost:5002/api/folders/${selectedFolderId}/upload-pdf`, {
            method: "POST",
            body: formData,
        });

        await refresh();
        setSelectedFile(null);
    };

    const handleCreateH5P = async (folderId: string) => {
        const title = prompt("Nom du contenu H5P :");
        if (!title) return;

        await fetch(`http://localhost:5002/api/folders/${folderId}/add-h5p`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title }),
        });

        await refresh();
    };

    return (
        <div className="p-6 space-y-6">
            <button
                onClick={() => router.push("/Teacher/Dashboard/Workspace")}
                className="text-blue-600 underline"
            >
                ← Retour
            </button>

            <h2 className="text-2xl font-semibold mb-2">Mes dossiers</h2>

            {folders.map((folder) => (
                <div key={folder._id} className="border p-4 rounded bg-gray-50 shadow-sm">
                    <h3 className="text-lg font-bold">{folder.name}</h3>

                    <div className="flex gap-3 items-center mt-2">
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => {
                                setSelectedFolderId(folder._id);
                                setSelectedFile(e.target.files?.[0] || null);
                            }}
                        />
                        <button
                            onClick={handleUploadPDF}
                            className="bg-green-600 text-white px-3 py-1 rounded"
                        >
                            Uploader PDF
                        </button>
                    </div>

                    {folder.pdfs.length > 0 && (
                        <ul className="mt-3 text-sm space-y-1">
                            {folder.pdfs.map((pdf, idx) => (
                                <li key={idx}>
                                    📄 {pdf.originalName}
                                    <a
                                        href={`http://localhost:5002/api/folders/download/${pdf.filename}`}
                                        className="ml-2 text-blue-600 underline"
                                        download
                                    >
                                        Télécharger
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="mt-3">
                        <button
                            onClick={() => handleCreateH5P(folder._id)}
                            className="bg-purple-600 text-white px-3 py-1 rounded"
                        >
                            ➕ Créer un contenu H5P
                        </button>
                        <ul className="mt-2 list-disc list-inside text-sm">
                            {folder.h5ps.map((h, idx) => (
                                <li key={idx}>🎓 {h.title}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            ))}
        </div>
    );
}
