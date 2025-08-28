const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const Folder = require("../models/Folder");
const Teacher = require("../models/Teacher");

// ====== uploads ======
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

const removeFileSafe = (abs) => fs.promises.unlink(abs).catch(() => {});

// ====== helpers ======
function meFromHeader(req, res) {
    const me = (req.header("x-teacher-email") || "").toLowerCase().trim();
    if (!me) {
        res.status(401).send("Missing x-teacher-email");
        return null;
    }
    return me;
}
function canEdit(folder, me) {
    if (folder.teacherEmail.toLowerCase() === me) return true;
    const s = folder.sharedWith.find((x) => x.email.toLowerCase() === me);
    return !!s && s.role === "edit";
}
function canView(folder, me) {
    return (
        folder.teacherEmail.toLowerCase() === me ||
        folder.sharedWith.some((x) => x.email.toLowerCase() === me)
    );
}

// ====== list (mine + shared with me) ======
router.get("/", async (req, res) => {
    const me = meFromHeader(req, res);
    if (!me) return;

    const folders = await Folder.find({
        $or: [{ teacherEmail: me }, { "sharedWith.email": me }],
    })
        .sort({ name: 1 })
        .lean();

    res.json(folders);
});

// ====== create (owner=me) ======
router.post("/", async (req, res) => {
    const me = meFromHeader(req, res);
    if (!me) return;

    const name = (req.body?.name || "").trim();
    if (!name) return res.status(400).send("Missing name");

    const exists = await Folder.findOne({ teacherEmail: me, name });
    if (exists) return res.status(409).json({ message: "Folder exists" });

    const folder = await Folder.create({
        name,
        teacherEmail: me,
        sharedWith: [],
        pdfs: [],
        h5ps: [],
    });

    res.json(folder);
});

// ====== get one (accessible by me) ======
router.get("/id/:folderId", async (req, res) => {
    const me = meFromHeader(req, res);
    if (!me) return;

    const folder = await Folder.findById(req.params.folderId);
    if (!folder) return res.status(404).send("Folder not found");
    if (!canView(folder, me)) return res.status(403).send("Forbidden");

    res.json(folder);
});

// ====== rename (owner only) ======
router.patch("/id/:folderId/rename", async (req, res) => {
    const me = meFromHeader(req, res);
    if (!me) return;

    const { folderId } = req.params;
    const name = (req.body?.name || "").trim();
    if (!name) return res.status(400).send("Missing name");

    const folder = await Folder.findById(folderId);
    if (!folder) return res.status(404).send("Folder not found");
    if (folder.teacherEmail.toLowerCase() !== me) return res.status(403).send("Forbidden");

    const dup = await Folder.findOne({ teacherEmail: me, name, _id: { $ne: folderId } });
    if (dup) return res.status(409).send("Name already used");

    folder.name = name;
    await folder.save();
    res.json({ folder });
});

// ====== delete folder (owner only) ======
router.delete("/id/:folderId", async (req, res) => {
    const me = meFromHeader(req, res);
    if (!me) return;

    const { folderId } = req.params;
    const folder = await Folder.findById(folderId);
    if (!folder) return res.status(404).send("Folder not found");
    if (folder.teacherEmail.toLowerCase() !== me) return res.status(403).send("Forbidden");

    const filenames = [
        ...folder.pdfs.map((p) => p.filename),
        ...folder.h5ps.map((h) => h.filename),
    ];
    await Promise.allSettled(
        filenames.map((name) => removeFileSafe(path.join(UPLOAD_DIR, path.basename(name))))
    );

    await Folder.deleteOne({ _id: folderId });
    res.sendStatus(204);
});

// ====== share (owner only, validate teachers) ======
router.patch("/id/:folderId/share", async (req, res) => {
    const me = meFromHeader(req, res);
    if (!me) return;

    const { folderId } = req.params;
    const { add = [], remove = [] } = req.body || {};

    const folder = await Folder.findById(folderId);
    if (!folder) return res.status(404).send("Folder not found");
    if (folder.teacherEmail.toLowerCase() !== me) return res.status(403).send("Forbidden");

    // collect emails to validate against Teacher collection
    const addEmails = add
        .map((x) => String(x.email || "").toLowerCase())
        .filter(Boolean)
        .filter((e) => e !== me); // cannot add myself

    const removeEmails = remove.map((e) => String(e || "").toLowerCase()).filter(Boolean);

    const allCheck = [...new Set([...addEmails, ...removeEmails])];
    if (allCheck.length) {
        const found = await Teacher.find({ email: { $in: allCheck } })
            .select("email")
            .lean();
        const foundSet = new Set(found.map((t) => t.email.toLowerCase()));
        const unknown = allCheck.filter((e) => !foundSet.has(e));
        if (unknown.length) {
            return res.status(400).json({ message: "Unknown teachers", unknown });
        }
    }

    // remove
    if (removeEmails.length) {
        folder.sharedWith = folder.sharedWith.filter(
            (s) => !removeEmails.includes(s.email.toLowerCase())
        );
    }

    // add/update
    for (const entry of add) {
        const email = String(entry.email || "").toLowerCase();
        if (!email || email === me) continue;
        const role = entry.role === "edit" ? "edit" : "view";
        const idx = folder.sharedWith.findIndex((s) => s.email.toLowerCase() === email);
        if (idx >= 0) folder.sharedWith[idx].role = role;
        else folder.sharedWith.push({ email, role });
    }

    await folder.save();
    res.json({ folder });
});

// ====== list sharees (with basic teacher info) ======
router.get("/id/:folderId/shares", async (req, res) => {
    const me = meFromHeader(req, res);
    if (!me) return;
    const folder = await Folder.findById(req.params.folderId).lean();
    if (!folder) return res.status(404).send("Folder not found");
    if (!canView(folder, me)) return res.status(403).send("Forbidden");

    const emails = folder.sharedWith.map((s) => s.email);
    const teachers = await Teacher.find({ email: { $in: emails } })
        .select("email nom prenom")
        .lean();
    res.json({
        owner: folder.teacherEmail,
        sharedWith: folder.sharedWith,
        teachers,
    });
});

// ====== uploads (owner or editor) ======
router.post("/:folderId/upload-pdf", upload.single("pdf"), async (req, res) => {
    const me = meFromHeader(req, res);
    if (!me) return;

    const folder = await Folder.findById(req.params.folderId);
    if (!folder) return res.status(404).json({ message: "Folder not found" });
    if (!canEdit(folder, me)) return res.status(403).send("Forbidden");

    folder.pdfs.push({
        filename: req.file.filename,
        originalName: req.file.originalname,
        uploadedAt: new Date(),
    });
    await folder.save();
    res.json({ success: true });
});

router.post("/:folderId/upload-h5p", upload.single("h5p"), async (req, res) => {
    const me = meFromHeader(req, res);
    if (!me) return;

    const folder = await Folder.findById(req.params.folderId);
    if (!folder) return res.status(404).json({ message: "Folder not found" });
    if (!canEdit(folder, me)) return res.status(403).send("Forbidden");

    folder.h5ps.push({
        filename: req.file.filename,
        originalName: req.file.originalname,
        uploadedAt: new Date(),
    });
    await folder.save();
    res.json({ success: true });
});

// ====== delete files (owner or editor) ======
router.delete("/:folderId/pdf/:filename", async (req, res) => {
    const me = meFromHeader(req, res);
    if (!me) return;

    const { folderId, filename } = req.params;
    const folder = await Folder.findById(folderId);
    if (!folder) return res.status(404).send("Folder not found");
    if (!canEdit(folder, me)) return res.status(403).send("Forbidden");

    const before = folder.pdfs.length;
    folder.pdfs = folder.pdfs.filter((p) => p.filename !== filename);
    if (folder.pdfs.length === before) return res.status(404).send("PDF not found");

    await folder.save();
    await removeFileSafe(path.join(UPLOAD_DIR, path.basename(filename)));
    res.sendStatus(204);
});
// GET /api/folders/admin  -> all folders (admin only)
router.get("/admin", async (req, res) => {
    // TODO: add real auth/role check
    const all = await Folder.find().lean();
    res.json(all);
});

router.delete("/:folderId/h5p/:filename", async (req, res) => {
    const me = meFromHeader(req, res);
    if (!me) return;

    const { folderId, filename } = req.params;
    const folder = await Folder.findById(folderId);
    if (!folder) return res.status(404).send("Folder not found");
    if (!canEdit(folder, me)) return res.status(403).send("Forbidden");

    const before = folder.h5ps.length;
    folder.h5ps = folder.h5ps.filter((h) => h.filename !== filename);
    if (folder.h5ps.length === before) return res.status(404).send("Content not found");

    await folder.save();
    await removeFileSafe(path.join(UPLOAD_DIR, path.basename(filename)));
    res.sendStatus(204);
});

module.exports = router;
