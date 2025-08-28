"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SessionProvider, useSession } from "next-auth/react";

export default function GoogleAfter() {
    // Wrap this page with SessionProvider so useSession works
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

        try {
            localStorage.setItem("email", email);
            localStorage.setItem("role", "teacher");
        } catch {}

        router.replace("/Teacher/Dashboard");
    }, [status, session, router]);

    return (
        <div style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
            <p>Connexion réussie… redirection en cours.</p>
        </div>
    );
}
