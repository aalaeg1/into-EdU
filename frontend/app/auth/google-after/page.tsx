"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SessionProvider, useSession } from "next-auth/react";

const TEACHER_SERVICE = "http://localhost:5002";

export default function GoogleAfter() {
    // Wrap with SessionProvider so useSession works on this standalone page
    return (
        <SessionProvider>
            <GoogleAfterInner />
        </SessionProvider>
    );
}

function GoogleAfterInner() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") return;

        const email = session?.user?.email;
        if (!email) {
            router.replace("/auth/error?error=AccessDenied");
            return;
        }

        // Persist sign-in and role locally (like your password flow)
        try {
            localStorage.setItem("email", email);
            localStorage.setItem("role", "teacher");
        } catch {}

        // NEW: tell the backend about this sign-in time
        fetch(
            `${TEACHER_SERVICE}/api/teachers/${encodeURIComponent(email)}/last-signin`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ when: new Date().toISOString() }),
            }
        ).catch(() => {});

        router.replace("/Teacher/Dashboard");
    }, [status, session, router]);

    return (
        <div style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
            <p>Connexion réussie… redirection en cours.</p>
        </div>
    );
}
