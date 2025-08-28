const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const Teacher = require("../models/Teacher");

const router = express.Router();

/* --------------------------------- uploads -------------------------------- */
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname || "");
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
});
const upload = multer({ storage });

/* --------------------------------- helpers -------------------------------- */
function safeTeacherPlain(obj) {
    if (!obj) return null;
    // obj is plain (because we use .lean()); just strip sensitive fields
    const { __v, password, ...safe } = obj;
    return safe;
}
function generateTempPassword(len = 10) {
    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
    let out = "";
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}

/* ----------------------------------- READ --------------------------------- */
// Put /search BEFORE '/:email'
router.get("/search", async (req, res) => {
    try {
        const q = (req.query.q || "").toString().trim();
        if (!q) return res.json([]);
        const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        const results = await Teacher.find({
            $or: [{ email: regex }, { nom: regex }, { prenom: regex }],
        })
            .select("email nom prenom -_id")
            .limit(10)
            .lean();
        res.json(results);
    } catch {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

router.get("/", async (_req, res) => {
    try {
        const teachers = await Teacher.find().select("-__v -password").lean();
        res.json(teachers);
    } catch {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

router.get("/:email", async (req, res) => {
    try {
        const t = await Teacher.findOne({ email: req.params.email })
            .select("-__v -password")
            .lean();
        if (!t) return res.status(404).json({ error: "Not found" });
        res.json(t);
    } catch {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

/* ---------------------------------- CREATE -------------------------------- */
router.post("/", upload.single("photo"), async (req, res) => {
    try {
        const { email, password, prenom, nom, phone, classes, subjects } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: "email & password required" });

        const exists = await Teacher.findOne({ email }).lean();
        if (exists) return res.status(409).json({ error: "Email already exists" });

        const hash = await bcrypt.hash(password, 10);
        const doc = await Teacher.create({
            email,
            password: hash,
            prenom,
            nom,
            phone,
            classes,
            subjects,
            photoUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
        });

        res.status(201).json(safeTeacherPlain(doc.toObject()));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

/* ---------------------------- BLOCK / UNBLOCK ----------------------------- */
router.patch("/:email/state", async (req, res) => {
    try {
        const { blocked } = req.body || {};
        const updated = await Teacher.findOneAndUpdate(
            { email: req.params.email },
            { $set: { blocked: !!blocked } },
            { new: true, lean: true, projection: "-password -__v" }
        );
        if (!updated) return res.status(404).json({ error: "Not found" });
        res.json(updated);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

/* --------------------------------- INVITE --------------------------------- */
/**
 * Generates a temp password, hashes it, stores it, and returns
 * { email, nom, prenom, password } (plaintext temp password) for the email-service.
 * Uses .lean() + updateOne() to avoid hydration/casting on malformed _id docs.
 */
router.post("/:email/invite", async (req, res) => {
    try {
        const email = req.params.email;
        const t = await Teacher.findOne({ email }).lean();
        if (!t) return res.status(404).json({ error: "Not found" });
        if (t.blocked) return res.status(403).json({ error: "User is blocked" });

        const temp = generateTempPassword(10);
        const hash = await bcrypt.hash(temp, 10);

        await Teacher.updateOne({ email }, { $set: { password: hash } });

        return res.json({
            email: t.email,
            nom: t.nom || "",
            prenom: t.prenom || "",
            password: temp,
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

/* ---------------------------------- UPDATE -------------------------------- */
router.patch("/:email", upload.single("photo"), async (req, res) => {
    try {
        const { prenom, nom, phone, classes, subjects } = req.body;
        const update = { prenom, nom, phone, classes, subjects };
        if (req.file) update.photoUrl = `/uploads/${req.file.filename}`;

        const doc = await Teacher.findOneAndUpdate(
            { email: req.params.email },
            { $set: update },
            { new: true, lean: true, projection: "-password -__v" }
        );
        if (!doc) return res.status(404).json({ error: "Not found" });
        res.json(doc);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

/* ---------------------------- CHANGE PASSWORD ----------------------------- */
router.post("/change-password", async (req, res) => {
    try {
        const { email, oldPwd, newPwd } = req.body || {};
        if (!email || !newPwd)
            return res.status(400).json({ error: "email & newPwd required" });

        const t = await Teacher.findOne({ email }).lean();
        if (!t) return res.status(404).json({ error: "Not found" });

        if (t.password) {
            const ok = await bcrypt.compare(oldPwd || "", t.password);
            if (!ok) return res.status(403).json({ error: "Current password incorrect" });
        }
        const hash = await bcrypt.hash(newPwd, 10);
        await Teacher.updateOne({ email }, { $set: { password: hash } });
        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

/* ---------------------------------- DELETE -------------------------------- */
router.delete("/:email", async (req, res) => {
    try {
        const doc = await Teacher.findOneAndDelete({ email: req.params.email }).lean();
        if (!doc) return res.status(404).json({ error: "Not found" });
        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

module.exports = router;
