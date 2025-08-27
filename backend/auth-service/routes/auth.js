const express = require("express");
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const ADMIN_EMAIL = "mern_team@ma-hb.com";
const ADMIN_PASSWORD = "admin123";

// POST /api/login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    // 👉 Vérif ADMIN
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        return res.json({
            success: true,
            role: "admin",
            nom: "Admin",
            prenom: "HB",
        });
    }

    try {
        // 👉 Vérif TEACHER via teacher-service
        const teacherRes = await fetch(`http://localhost:5002/api/teachers`);
        const teachers = await teacherRes.json();

        const teacher = teachers.find(
            (t) => t.email === email && t.password === password
        );

        if (teacher) {
            return res.json({
                success: true,
                role: "teacher",
                nom: teacher.nom,
                prenom: teacher.prenom,
            });
        }

        return res.status(401).json({
            success: false,
            message: "Email ou mot de passe incorrect",
        });
    } catch (e) {
        console.error("Erreur de connexion à teacher-service:", e.message);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
});

module.exports = router;
