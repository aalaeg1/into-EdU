const express = require("express");
const router = express.Router();
const transporter = require("../utils/transporter");


const axios = require("axios");

router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email requis." });
    }

    try {
        // Appel au teacher-service pour récupérer tous les enseignants
        const response = await axios.get("http://localhost:5002/api/teachers");
        const teachers = response.data;

        const teacher = teachers.find(t => t.email === email);

        if (!teacher) {
            return res.status(404).json({ success: false, message: "Cet email n'existe pas." });
        }

        const message = `
Bonjour ${teacher.prenom} ${teacher.nom},

Voici votre mot de passe : ${teacher.password}

Cordialement,
L'équipe pédagogique`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Récupération de mot de passe",
            text: message,
        });

        console.log(`📧 Email de récupération envoyé à ${email}`);
        res.json({ success: true });

    } catch (error) {
        console.error("❌ Erreur lors du forgot-password:", error.message);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
});


router.post("/send", async (req, res) => {
    const { nom, prenom, email, password } = req.body;

    if (!nom || !prenom || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Tous les champs sont requis (nom, prenom, email, password)."
        });
    }

    const message = `
Bonjour ${prenom} ${nom},

Voici vos informations de connexion à la plateforme :
Email : ${email}
Mot de passe : ${password}

Cordialement,
L'équipe pédagogique
`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Vos accès à la plateforme",
        text: message,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Email envoyé à ${email}`);
        res.json({ success: true });
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi de l'email :", error);
        res.status(500).json({ success: false, message: "Erreur lors de l'envoi de l'email." });
    }
});

module.exports = router;
