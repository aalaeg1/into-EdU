import {useEffect, useState} from "react";

interface Teacher {
    nom: string;
    prenom: string;
    email: string;
    password?: string;
}

export function useTeacherFirstName(): string | null {
    const [firstName, setFirstName] = useState<string | null>(null);

    useEffect(() => {
        const email = localStorage.getItem("email");
        if (!email) return;

        fetch("http://localhost:5002/api/teachers")
            .then((res) => {
                if (!res.ok) throw new Error("Erreur lors de la récupération des enseignants.");
                return res.json();
            })
            .then((teachers: Teacher[]) => {
                const found = teachers.find((t) => t.email === email);
                setFirstName(found ? found.prenom : null);
            })
            .catch((err) => {
                console.error("Erreur:", err);
                setFirstName(null);
            });
    }, []);

    return firstName;
}
