"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Folder = {
    _id: string;
    name: string;
};

export default function WorkspacePage() {
    const [folders, setFolders] = useState<Folder[]>([]);
    const router = useRouter();
    const email = typeof window !== "undefined" ? localStorage.getItem("email") : null;

    useEffect(() => {
        if (!email) return;
        fetch(`http://localhost:5002/api/folders/${email}`)
            .then((res) => res.json())
            .then((data) => setFolders(data))
            .catch(() => alert("Erreur lors du chargement des dossiers"));
    }, [email]);

    const handleCreateFolder = () => {
        router.push("/Teacher/Create");
    };

    const goToFolder = (name: string) => {
        router.push(`/Teacher/Dashboard/Workspace/${encodeURIComponent(name)}`);
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between">
                <h2 className="text-xl font-bold">Mes dossiers</h2>
                <Button className="bg-blue-600 text-white" onClick={handleCreateFolder}>
                    ➕ Nouveau dossier
                </Button>
            </div>

            {folders.length === 0 && <p>Aucun dossier pour l’instant.</p>}

            <ul className="space-y-2">
                {folders.map((folder) => (
                    <li
                        key={folder._id}
                        className="cursor-pointer p-4 bg-gray-100 rounded shadow hover:bg-gray-200"
                        onClick={() => goToFolder(folder.name)}
                    >
                        📁 {folder.name}
                    </li>
                ))}
            </ul>
        </div>
    );
}
