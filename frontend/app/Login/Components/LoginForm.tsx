"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import "./LoginForm.css";
import { signIn } from "next-auth/react";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Veuillez remplir tous les champs");
            return;
        }

        try {
            const res = await fetch("http://localhost:5001/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const result = await res.json();

            if (res.ok && result.success) {
                // Stocker le rôle dans le localStorage
                localStorage.setItem("role", result.role);
                localStorage.setItem("email", email);

                // Redirection selon le rôle
                if (result.role === "admin") {
                    router.push("/Admin/admin-dashboard");
                } else if (result.role === "teacher") {
                    router.push("/Teacher/Dashboard");
                } else {
                    setError("Rôle non reconnu");
                }
            } else {
                setError(result.message || "Email ou mot de passe incorrect");
            }

        } catch (err) {
            console.error("Erreur lors de la connexion :", err);
            setError("Erreur de connexion au serveur");
        }
    };

    return (
        <div className="login-container">
            <div className="left-panel">
                <div className="overlay">
                    <h1>Welcome to your Interactive Lesson Platform !</h1>
                    <p>
                        Built to help our teachers deliver powerful learning experiences.
                        Empowering teachers with interactive content tools.
                    </p>
                </div>
            </div>

            <div className="right-panel">
                <form className="login-form" onSubmit={handleLogin}>
                    <h2>Sign In</h2>
                    {error && <div style={{ color: "red", marginBottom: 10 }}>{error}</div>}

                    <h3>Email Address</h3>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="username"
                        required
                    />

                    <h3>Password</h3>
                    <input
                        type="password"
                        placeholder="Input your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />

                    <a href="/forgot-password" className="forgot-password">
                        Forgot password?
                    </a>

                    <button type="submit" className="primary-btn">
                        Sign In
                    </button>

                    <div className="separator">or</div>

                    <button
                        type="button"
                        className="social-btn google"
                        onClick={() => signIn("google")}
                    >
                        Sign In With Google
                    </button>

                    <p className="disclaimer">
                        Protected by reCAPTCHA and subject to the Google{" "}
                        <a href="#">Privacy Policy</a> and{" "}
                        <a href="#">Terms of Service</a>.
                    </p>
                </form>
            </div>
        </div>
    );
}
