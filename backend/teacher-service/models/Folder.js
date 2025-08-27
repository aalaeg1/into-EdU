const mongoose = require("mongoose");

const shareSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, index: true },
        role: { type: String, enum: ["view", "edit"], default: "view" },
    },
    { _id: false }
);

const fileSchema = new mongoose.Schema(
    {
        filename: String,
        originalName: String,
        uploadedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const folderSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        teacherEmail: { type: String, required: true, index: true }, // owner
        sharedWith: { type: [shareSchema], default: [] },            // collaborators
        pdfs: { type: [fileSchema], default: [] },
        h5ps: { type: [fileSchema], default: [] },
    },
    { timestamps: true }
);

// Unique folder names per owner
folderSchema.index({ teacherEmail: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Folder", folderSchema);
