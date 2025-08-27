"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, FileUp, Play, X } from "lucide-react";

type PDFFile = { originalName: string; filename: string; };
type H5PFile = { originalName: string; filename: string; };
type Folder = {
    _id: string;
    name: string;
    pdfs: PDFFile[];
    h5ps: H5PFile[];
};

export default function FolderView() {
    const paramsRaw = useParams();
    // Assure que params n'est jamais null (Next.js retourne toujours un objet ou undefined, jamais null)
    const params = paramsRaw ?? {};

    // Sécurise l'accès à folderName
    let folderName: string | undefined;
    if (typeof params === "object" && params !== null && "folderName" in params) {
        const value = (params as Record<string, string | string[]>).folderName;
        folderName = Array.isArray(value) ? value[0] : value;
    }

    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const h5pRef = useRef<HTMLInputElement>(null);
    const [folder, setFolder] = useState<Folder | null>(null);
    const [currentH5P, setCurrentH5P] = useState<string | null>(null);
    const [iframeSrc, setIframeSrc] = useState<string>("");

    const [email, setEmail] = useState<string | null>(null);
    useEffect(() => {
        if (typeof window !== "undefined") {
            setEmail(localStorage.getItem("email"));
        }
    }, []);

    // Cleanup blob URLs on unmount
    useEffect(() => {
        return () => {
            if (iframeSrc) URL.revokeObjectURL(iframeSrc);
        };
    }, [iframeSrc]);

    useEffect(() => {
        if (!email || !folderName) return;
        fetch(`http://localhost:5002/api/folders/${email}`)
            .then(res => res.json())
            .then((folders: Folder[]) => {
                const match = folders.find((f) => f.name === folderName) ?? null;
                setFolder(match);
            });
    }, [folderName, email]);

    const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !folder?._id) return;

        const formData = new FormData();
        formData.append("pdf", file);

        await fetch(
            `http://localhost:5002/api/folders/${folder._id}/upload-pdf`,
            {
                method: "POST",
                body: formData,
            }
        );

        location.reload();
    };

    const handleH5PUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !folder?._id) return;

        const formData = new FormData();
        formData.append("h5p", file);

        await fetch(
            `http://localhost:5002/api/folders/${folder._id}/upload-h5p`,
            {
                method: "POST",
                body: formData,
            }
        );

        location.reload();
    };

    const playH5P = async (h5pFile: H5PFile) => {
        try {
            // Fetch the H5P file from the server
            const response = await fetch(`http://localhost:5002/uploads/${h5pFile.filename}`);
            const blob = await response.blob();

            // Create a blob URL for the H5P content
            const url = URL.createObjectURL(blob);
            setIframeSrc(url);
            setCurrentH5P(h5pFile.originalName);
        } catch (error) {
            console.error("Error loading H5P content:", error);
            alert("Erreur lors du chargement du contenu H5P");
        }
    };

    const closeH5P = () => {
        if (iframeSrc) {
            URL.revokeObjectURL(iframeSrc);
            setIframeSrc("");
        }
        setCurrentH5P(null);
    };

    return (
        <div className="p-10 space-y-6">
            <button
                onClick={() => router.push("/Teacher/Create")}
                className="text-blue-600 hover:underline flex items-center gap-1"
            >
                <ArrowLeft className="w-4 h-4" /> Retour
            </button>

            <h2 className="text-2xl font-bold">
                Dossier&nbsp;: {folderName}
            </h2>

            {/* H5P Player Area */}
            {currentH5P && (
                <div className="border rounded-lg overflow-hidden bg-white shadow-lg">
                    <div className="bg-purple-600 text-white p-3 flex justify-between items-center">
                        <h3 className="font-semibold">🎓 {currentH5P}</h3>
                        <button
                            onClick={closeH5P}
                            className="text-white hover:text-gray-200"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="h-[600px]">
                        <iframe
                            src={iframeSrc}
                            className="w-full h-full border-0"
                            title="H5P Content"
                            allow="fullscreen"
                        />
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <button
                        className="bg-green-600 text-white px-4 py-2 rounded"
                        onClick={() => fileRef.current?.click()}
                    >
                        <FileUp className="w-4 h-4 inline-block mr-2" /> Uploader PDF
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="application/pdf"
                        onChange={handlePDFUpload}
                        hidden
                    />
                    <ul className="mt-3">
                        {folder?.pdfs.map((pdf, i) => (
                            <li key={i} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                                📄 {pdf.originalName}
                                <a
                                    href={`http://localhost:5002/uploads/${pdf.filename}`}
                                    className="text-blue-500 underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Download className="w-4 h-4 inline" />
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <button
                        className="bg-purple-600 text-white px-4 py-2 rounded"
                        onClick={() => h5pRef.current?.click()}
                    >
                        <FileUp className="w-4 h-4 inline-block mr-2" /> Uploader H5P
                    </button>
                    <input
                        ref={h5pRef}
                        type="file"
                        accept=".h5p,.zip"
                        onChange={handleH5PUpload}
                        hidden
                    />
                    <ul className="mt-3">
                        {folder?.h5ps.map((h5p, i) => (
                            <li key={i} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                                🎓 {h5p.originalName}
                                <button
                                    onClick={() => playH5P(h5p)}
                                    className="text-green-600 hover:text-green-800"
                                    title="Jouer le contenu H5P"
                                >
                                    <Play className="w-4 h-4" />
                                </button>
                                <a
                                    href={`http://localhost:5002/uploads/${h5p.filename}`}
                                    className="text-blue-500 underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Download className="w-4 h-4 inline" />
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}