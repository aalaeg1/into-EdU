const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
    {
            nom: String,
            prenom: String,
            email: { type: String, unique: true, required: true, index: true },
            password: String,         // bcrypt hash
            phone: String,
            classes: String,
            subjects: String,
            photoUrl: String,
            blocked: { type: Boolean, default: false },

            // NEW
            invitedAt: { type: Date, default: null },
            inviteCount: { type: Number, default: 0 },

            // already used elsewhere
            lastSignInAt: { type: Date, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Teacher", teacherSchema);
