// backend/teacher-service/routes/teachers.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const Teacher = require("../models/Teacher");

const router = express.Router();

/* --------------------------------- uploads -------------------------------- */
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname || "");
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
});
const upload = multer({ storage });

/* ------------------------------- AUTH VERIFY ------------------------------ */
/**
 * POST /api/teachers/verify
 * Body: { email, password }
 * Returns: { ok: true, teacher: { email, nom, prenom, blocked } } if valid.
 * - bcrypt compare (with legacy plain-text fallback)
 * - rejects blocked accounts with 403
 */
router.post("/verify", async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ ok: false, message: "email and password required" });
        }

        const t = await Teacher.findOne({ email });
        if (!t) return res.status(404).json({ ok: false, message: "not found" });

        if (t.blocked) {
            return res.status(403).json({ ok: false, message: "blocked" });
        }

        let match = false;
        try {
            match = await bcrypt.compare(password, t.password || "");
        } catch {
            match = false;
        }
        // legacy fallback
        if (!match && t.password && typeof t.password === "string") {
            match = t.password === password;
        }

        if (!match) return res.status(401).json({ ok: false, message: "bad credentials" });

        return res.json({
            ok: true,
            teacher: {
                email: t.email,
                nom: t.nom,
                prenom: t.prenom,
                blocked: !!t.blocked,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, message: "server error" });
    }
});

/* ---------------------------------- READ ---------------------------------- */
/**
 * IMPORTANT: Place /search BEFORE /:email to avoid being matched by the param route.
 */
router.get("/search", async (req, res) => {
    try {
        const q = (req.query.q || "").toString().trim();
        if (!q) return res.json([]);

        const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        const results = await Teacher.find({
            $or: [{ email: regex }, { nom: regex }, { prenom: regex }],
        })
            .select("email nom prenom -_id")
            .limit(10);

        res.json(results);
    } catch {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

router.get("/", async (_req, res) => {
    try {
        const teachers = await Teacher.find().select("-__v -password");
        res.json(teachers);
    } catch {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

router.get("/:email", async (req, res) => {
    try {
        const t = await Teacher.findOne({ email: req.params.email }).select("-__v -password");
        if (!t) return res.status(404).json({ error: "Not found" });
        res.json(t);
    } catch {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

/* --------------------------------- CREATE --------------------------------- */
/**
 * If password is omitted, a secure temp password is generated and returned as `tempPassword`
 * (so the admin UI can email it). Remove the two lines marked "RETURN temp" if you don't
 * want to ever reveal it.
 */
router.post("/", upload.single("photo"), async (req, res) => {
    try {
        // sanitize body: ignore _id if provided
        const {
            _id: _ignoreId,
            email,
            password,
            prenom,
            nom,
            phone,
            classes,
            subjects,
        } = req.body;

        if (!email) return res.status(400).json({ error: "email required" });

        const exists = await Teacher.findOne({ email });
        if (exists) return res.status(409).json({ error: "Email already exists" });

        // generate temp password if missing
        const temp = password && String(password).length > 0
            ? String(password)
            : crypto.randomBytes(9).toString("base64url"); // ~12 chars, URL-safe

        const hash = await bcrypt.hash(temp, 10);

        const doc = await Teacher.create({
            email,
            password: hash,
            prenom,
            nom,
            phone,
            classes,
            subjects,
            photoUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
            blocked: false,
        });

        const { password: _pw, __v, ...safe } = doc.toObject();
        // RETURN temp → expose once so UI can email it
        return res.status(201).json({ ...safe, tempPassword: temp }); // RETURN temp
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

/* ------------------------------ UPDATE PROFILE ---------------------------- */
router.patch("/:email", upload.single("photo"), async (req, res) => {
    try {
        // ignore _id in patch
        const { _id: _ignoreId, prenom, nom, phone, classes, subjects } = req.body;
        const update = { prenom, nom, phone, classes, subjects };
        if (req.file) update.photoUrl = `/uploads/${req.file.filename}`;

        const doc = await Teacher.findOneAndUpdate({ email: req.params.email }, update, {
            new: true,
        }).select("-password -__v");

        if (!doc) return res.status(404).json({ error: "Not found" });
        res.json(doc);
    } catch {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

/* ----------------------------- CHANGE PASSWORD ---------------------------- */
router.post("/change-password", async (req, res) => {
    try {
        const { email, oldPwd, newPwd } = req.body || {};
        if (!email || !newPwd) return res.status(400).json({ error: "email & newPwd required" });

        const doc = await Teacher.findOne({ email });
        if (!doc) return res.status(404).json({ error: "Not found" });

        if (doc.password) {
            const ok = await bcrypt.compare(oldPwd || "", doc.password);
            if (!ok) return res.status(403).json({ error: "Current password incorrect" });
        }
        doc.password = await bcrypt.hash(newPwd, 10);
        await doc.save();
        res.json({ ok: true });
    } catch {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

/* --------------------------- BLOCK / UNBLOCK STATE ------------------------ */
/**
 * PATCH /api/teachers/:email/state
 * Body: { blocked: boolean }
 */
router.patch("/:email/state", async (req, res) => {
    try {
        const { blocked } = req.body || {};
        if (typeof blocked !== "boolean") {
            return res.status(400).json({ error: "blocked must be boolean" });
        }
        const doc = await Teacher.findOneAndUpdate(
            { email: req.params.email },
            { blocked },
            { new: true }
        ).select("-password -__v");

        if (!doc) return res.status(404).json({ error: "Not found" });
        res.json(doc);
    } catch (e) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

/* --------------------------------- DELETE --------------------------------- */
router.delete("/:email", async (req, res) => {
    try {
        const doc = await Teacher.findOneAndDelete({ email: req.params.email });
        if (!doc) return res.status(404).json({ error: "Not found" });
        res.json({ ok: true });
    } catch {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

module.exports = router;
