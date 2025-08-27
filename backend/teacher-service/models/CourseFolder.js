// backend/teacher-service/models/CourseFolder.js
const mongoose = require("mongoose");

const courseFolderSchema = new mongoose.Schema({
    title: { type: String, required: true },
    ownerEmail: { type: String, required: true }, // email du teacher
    createdAt: { type: Date, default: Date.now },
    pdfs: [{ type: String }],      // chemins vers les fichiers PDF
    h5pContents: [{ type: String }] // futurs contenus H5P
});

module.exports = mongoose.model("CourseFolder", courseFolderSchema);
