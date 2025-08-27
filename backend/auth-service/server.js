const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/auth");
app.use("/api", authRoutes);

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB connecté");
        app.listen(process.env.PORT, () => {
            console.log(`🚀 Auth Service en écoute sur http://localhost:${process.env.PORT}`);
        });
    })
    .catch((err) => console.error("Erreur MongoDB:", err));
