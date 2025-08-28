// backend/teacher-service/models/Teacher.js
const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
    {
            nom: String,
            prenom: String,
            email: { type: String, unique: true, required: true, index: true },
            password: String,       // bcrypt hash
            phone: String,
            classes: String,
            subjects: String,
            photoUrl: String,
            blocked: { type: Boolean, default: false }, // <— add this
    },
    { timestamps: true }
);

module.exports = mongoose.model("Teacher", teacherSchema);
