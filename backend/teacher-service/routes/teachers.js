const express = require("express");
const router = express.Router();
const Teacher = require("../models/Teacher");

// List all teachers (kept as-is)
router.get("/", async (_req, res) => {
    try {
        const teachers = await Teacher.find().select("-__v");
        res.json(teachers);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// 🔎 NEW: GET /api/teachers/search?q=...
// Matches by email, first name, last name, or "first last" (case-insensitive)
router.get("/search", async (req, res) => {
    try {
        const q = (req.query.q || "").toString().trim();
        if (!q) return res.json([]);

        const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

        const results = await Teacher.find({
            $or: [
                { email: regex },
                { nom: regex },
                { prenom: regex },
            ],
        })
            .select("email nom prenom -_id")
            .limit(10);

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

module.exports = router;
