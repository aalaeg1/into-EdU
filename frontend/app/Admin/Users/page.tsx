"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X } from "lucide-react";
import Link from "next/link";

const TEACHER_API = "http://localhost:5002/api/teachers";     // teacher-service
const EMAIL_API   = "http://localhost:5003/api/email/send";   // email-service

type CreatePayload = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    classes: string;
    subjects: string;
};

function generateTempPassword(len = 12) {
    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
    let out = "";
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}

export default function CreateTeacherPage() {
    const router = useRouter();

    const [formData, setFormData] = useState<CreatePayload>({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        classes: "",
        subjects: "",
    });

    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setPhotoFile(file);
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setPhotoPreview((ev.target?.result as string) ?? null);
            reader.readAsDataURL(file);
        } else {
            setPhotoPreview(null);
        }
    };

    const removePhoto = () => {
        setPhotoFile(null);
        setPhotoPreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.firstName || !formData.lastName || !formData.email) {
            alert("Please fill the required fields (first name, last name, email).");
            return;
        }

        const tempPassword = generateTempPassword();

        setBusy(true);
        try {
            // 1) Create teacher in teacher-service (send generated password; backend will hash it)
            const fd = new FormData();
            fd.append("prenom", formData.firstName.trim());
            fd.append("nom", formData.lastName.trim());
            fd.append("email", formData.email.trim().toLowerCase());
            fd.append("phone", formData.phone.trim());
            fd.append("classes", formData.classes.trim());
            fd.append("subjects", formData.subjects.trim());
            fd.append("password", tempPassword); // generated; not shown in UI
            if (photoFile) fd.append("photo", photoFile);

            const createRes = await fetch(TEACHER_API, {
                method: "POST",
                body: fd,
            });

            if (!createRes.ok) {
                const txt = await createRes.text().catch(() => "");
                throw new Error(`Create failed: HTTP ${createRes.status} ${txt}`);
            }

            // 2) Send invite email with the same generated password
            const mailRes = await fetch(EMAIL_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nom: formData.lastName.trim(),
                    prenom: formData.firstName.trim(),
                    email: formData.email.trim().toLowerCase(),
                    password: tempPassword,
                }),
            });

            let ok = mailRes.ok;
            let body: any = null;
            try { body = await mailRes.json(); } catch {}
            if (body && typeof body.success === "boolean") ok = ok && body.success;

            if (!ok) {
                const msg = (body && (body.message || body.error)) || `HTTP ${mailRes.status}`;
                alert(
                    `Teacher created, but sending the email failed:\n${msg}\nYou can resend from the Admin Users list.`
                );
            } else {
                alert("Teacher created and invite email sent.");
            }

            router.push("/Admin/admin-users"); // go to the list page
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            alert(`Failed to create & invite teacher.\n${msg}`);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Add New Teacher</h1>
            </div>

            {/* Form */}
            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
                {/* Personal Details Header */}
                <div className="bg-purple-600 text-white px-6 py-4">
                    <h2 className="text-lg font-semibold">Personal Details</h2>
                    <p className="text-xs opacity-90 mt-1">
                        A secure password will be generated automatically and emailed to the teacher.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* First Row - First Name & Last Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                placeholder="Maria"
                                className="w-full"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                placeholder="Historia"
                                className="w-full"
                                required
                            />
                        </div>
                    </div>

                    {/* Second Row - Email & Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="teacher@example.com"
                                className="w-full"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone
                            </label>
                            <Input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="+1234567890"
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Third Row - Classes & Photo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Classes
                            </label>
                            <textarea
                                name="classes"
                                value={formData.classes}
                                onChange={handleInputChange}
                                placeholder="2Bac SM-A, 2Bac SM-B, Tronc Commun"
                                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical"
                            />
                            <div className="text-xs text-gray-500 mt-1">
                                {formData.classes.length}/2000
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Photo
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative">
                                {photoPreview ? (
                                    <div className="relative">
                                        <img
                                            src={photoPreview}
                                            alt="Teacher photo preview"
                                            className="w-20 h-20 rounded-full mx-auto object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={removePhoto}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">
                                            Drag and drop or<br />
                                            click here to select file
                                        </p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Fourth Row - Subjects */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subjects
                        </label>
                        <Input
                            type="text"
                            name="subjects"
                            value={formData.subjects}
                            onChange={handleInputChange}
                            placeholder="Arabic, Islamic Education"
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <Link href="/Admin/admin-users">
                        <Button type="button" variant="outline" className="px-8">
                            Cancel
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        className="px-8 bg-purple-600 hover:bg-purple-700"
                        disabled={busy}
                    >
                        {busy ? "Saving & Sending…" : "Save & Send Invite"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
