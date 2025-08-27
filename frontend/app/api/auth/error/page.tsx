'use client';

import { useRouter } from "next/navigation";

export default function AuthErrorPage() {
    const router = useRouter();

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f3f3f3"
        }}>
            <div style={{
                padding: "2rem 3rem",
                borderRadius: "2rem",
                background: "#fff",
                boxShadow: "0 2px 16px 4px #0001",
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
            }}>
                <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Accès refusé</h1>
                <p style={{ marginBottom: "2rem", textAlign: "center" }}>
                    Vous n&apos;avez pas la permission de vous connecter avec ce compte.
                </p>
                <button
                    onClick={() => router.push("/")}
                    style={{
                        padding: "0.7rem 2rem",
                        background: "#2563eb",
                        color: "white",
                        border: "none",
                        borderRadius: "0.7rem",
                        fontSize: "1.1rem",
                        cursor: "pointer"
                    }}
                >
                    Retour à l&apos;accueil
                </button>
            </div>
        </div>
    );
}
