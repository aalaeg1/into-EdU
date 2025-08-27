"use client";
import { useEffect, useState } from "react";

export function useAuth() {
    const [role, setRole] = useState<string | null>(null);
    useEffect(() => {
        setRole(localStorage.getItem('role'));
    }, []);
    return { role };
}
