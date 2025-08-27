"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccess("");
        setError("");
        setLoading(true);
        try {
            const res = await fetch("http://localhost:5003/api/email/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });
            const result = await res.json();
            if (result.success) {
                setSuccess("Un email vous a été envoyé !");
            } else {
                setError(result.message || "Erreur inconnue");
            }
        } catch {
            setError("Erreur de connexion au serveur.");
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white rounded shadow p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">Mot de passe oublié</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Votre adresse email"
                        required
                        className="border px-3 py-2 rounded w-full"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded"
                    >
                        Envoyer
                    </button>
                </form>
                {success && <p className="text-green-600 mt-4">{success}</p>}
                {error && <p className="text-red-600 mt-4">{error}</p>}
                <button
                    className="mt-4 text-blue-600 underline"
                    onClick={() => router.push("/")} // ou "/" selon ta route de login
                >
                    Retour à la connexion
                </button>
            </div>
        </div>
    );
}
