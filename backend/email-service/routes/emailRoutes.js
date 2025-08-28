const express = require("express");
const router = express.Router();
const transporter = require("../utils/transporter");
const axios = require("axios");

const TEACHER_SERVICE = "http://localhost:5002";

/**
 * POST /api/email/forgot-password
 * Verifies the teacher exists and sends a reset guidance email (no stored password).
 */
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body || {};
    if (!email) {
        return res.status(400).json({ success: false, message: "Email requis." });
    }

    try {
        // Ensure teacher exists (teacher-service does not expose password)
        await axios.get(
            `${TEACHER_SERVICE}/api/teachers/${encodeURIComponent(email)}`
        );

        const resetUrl = `http://localhost:3000/reset-password?email=${encodeURIComponent(
            email
        )}`;

        const text = `Bonjour,

Vous avez demandé à réinitialiser votre mot de passe.

Pour définir un nouveau mot de passe, veuillez suivre ce lien :
${resetUrl}

Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.

Cordialement,
L'équipe pédagogique`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Réinitialisation du mot de passe",
            text,
        });

        console.log(`📧 Email de reset envoyé à ${email}`);
        return res.json({ success: true });
    } catch (err) {
        if (err?.response?.status === 404) {
            return res
                .status(404)
                .json({ success: false, message: "Cet email n'existe pas." });
        }
        console.error("❌ Erreur forgot-password:", err?.message || err);
        return res
            .status(500)
            .json({ success: false, message: "Erreur serveur" });
    }
});

/**
 * POST /api/email/send
 * Sends the invitation email using YOUR original message.
 * Required fields: nom, prenom, email, password
 */
router.post("/send", async (req, res) => {
    const { nom, prenom, email, password } = req.body || {};

    if (!nom || !prenom || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Tous les champs sont requis (nom, prenom, email, password).",
        });
    }

    const message = `Bonjour ${prenom} ${nom},

Voici vos informations de connexion à la plateforme :
Email : ${email}
Mot de passe : ${password}
le clé API pour AI Course Planner : 586b6920ea0da175dd669058374e7377f516150ec939f092bdc1bc295da6ac7f
Cordialement,
L'équipe pédagogique
`;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Vos accès à la plateforme",
            text: message,
        });
        console.log(`📧 Email envoyé à ${email}`);
        return res.json({ success: true });
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi de l'email :", error);
        return res
            .status(500)
            .json({ success: false, message: "Erreur lors de l'envoi de l'email." });
    }
});

module.exports = router;
