const express = require("express");
const router = express.Router();

const fetch = (...args) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { OAuth2Client } = require("google-auth-library");

const ADMIN_EMAIL = "mern_team@ma-hb.com";
const ADMIN_PASSWORD = "admin123";

const TEACHER_SERVICE = "http://localhost:5002";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID; // same as NEXT_PUBLIC_GOOGLE_CLIENT_ID

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * Password login (unchanged, but now calls teacher verify for bcrypt)
 */
router.post("/login", async (req, res) => {
    const { email, password } = req.body || {};

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        return res.json({
            success: true,
            role: "admin",
            nom: "Admin",
            prenom: "HB",
            email,
        });
    }

    try {
        // ask teacher-service to verify bcrypt
        const resp = await fetch(`${TEACHER_SERVICE}/api/teachers/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || !data.ok) {
            return res
                .status(401)
                .json({ success: false, message: "Email ou mot de passe incorrect" });
        }
        const t = data.teacher || {};
        if (t.blocked) {
            return res
                .status(403)
                .json({
                    success: false,
                    message:
                        "Votre compte est bloqué. Veuillez contacter l’administrateur.",
                });
        }
        return res.json({
            success: true,
            role: "teacher",
            nom: t.nom,
            prenom: t.prenom,
            email: t.email,
        });
    } catch (e) {
        console.error("Erreur de connexion à teacher-service:", e?.message || e);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
});

/**
 * Google login (NEW)
 * Body: { credential } where credential is the Google ID token from GIS
 */
router.post("/login/google", async (req, res) => {
    try {
        const { credential } = req.body || {};
        if (!credential) {
            return res
                .status(400)
                .json({ success: false, message: "Missing Google credential" });
        }

        // verify token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload() || {};
        const email = (payload.email || "").toLowerCase();

        if (!email) {
            return res
                .status(401)
                .json({ success: false, message: "Invalid Google token" });
        }

        // only allow teachers in our DB
        const tResp = await fetch(
            `${TEACHER_SERVICE}/api/teachers/${encodeURIComponent(email)}`
        );

        if (tResp.status === 404) {
            return res.status(403).json({
                success: false,
                message:
                    "Ce compte Google n’est pas autorisé (email non trouvé dans la liste des enseignants).",
            });
        }

        if (!tResp.ok) {
            return res
                .status(500)
                .json({ success: false, message: "Erreur teacher-service" });
        }

        const teacher = await tResp.json();
        if (teacher.blocked) {
            return res.status(403).json({
                success: false,
                message:
                    "Votre compte est bloqué. Veuillez contacter l’administrateur.",
            });
        }

        return res.json({
            success: true,
            role: "teacher",
            nom: teacher.nom,
            prenom: teacher.prenom,
            email: teacher.email,
        });
    } catch (err) {
        console.error("Google login error:", err?.message || err);
        res.status(401).json({ success: false, message: "Token Google invalide" });
    }
});

module.exports = router;
