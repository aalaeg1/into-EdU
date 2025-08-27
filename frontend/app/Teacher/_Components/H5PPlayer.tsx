"use client";
import { useEffect, useRef, useState } from "react";

export default function H5PPlayer() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [iframeSrc, setIframeSrc] = useState<string>("");

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        let indexFile: File | null = null;
        const fileMap: Record<string, string> = {};

        for (const file of Array.from(files)) {
            const url = URL.createObjectURL(file);
            fileMap[file.webkitRelativePath] = url;

            if (file.name === "index.html") {
                indexFile = file;
            }
        }

        if (!indexFile) {
            alert("index.html introuvable !");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            let html = reader.result as string;

            Object.keys(fileMap).forEach((path) => {
                const filename = path.split("/").slice(1).join("/");
                html = html.replaceAll(filename, fileMap[path]);
            });

            const blob = new Blob([html], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            setIframeSrc(url);
        };
        reader.readAsText(indexFile);
    };

    return (
        <div className="mt-6 space-y-4">
            <button
                onClick={handleImportClick}
                className="bg-blue-500 text-white px-4 py-2 rounded"
            >
                Importer un contenu H5P
            </button>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFolderChange}
                multiple
                //@ts-expect-error webkitdirectory not in TS
                webkitdirectory="true"
                directory=""
            />
            {iframeSrc && (
                <div className="h-[600px] mt-4 border rounded overflow-hidden">
                    <iframe src={iframeSrc} className="w-full h-full border-0" />
                </div>
            )}
        </div>
    );
}
