const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

const corsOptions = {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-teacher-email"],
    credentials: true,
    optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, x-teacher-email");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const teacherRoutes = require("./routes/teachers");
const folderRoutes  = require("./routes/folders");

app.use("/api/teachers", teacherRoutes);
app.use("/api/folders",  folderRoutes);


const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
app.use("/uploads", express.static(UPLOAD_DIR));

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ Connexion MongoDB réussie");
        app.listen(process.env.PORT, () => {
            console.log(`🚀 Teacher service actif sur http://localhost:${process.env.PORT}`);
        });
    })
    .catch(err => console.error("Erreur MongoDB :", err));
