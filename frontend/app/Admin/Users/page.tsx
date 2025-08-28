"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X } from "lucide-react";
import Link from "next/link";

const API_BASE = "http://localhost:5002"; // teacher-service

type CreatePayload = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    classes: string;
    subjects: string;
    password: string;
    confirmPassword: string;
};

export default function CreateTeacherPage() {
    const router = useRouter();

    const [formData, setFormData] = useState<CreatePayload>({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        classes: "",
        subjects: "",
        password: "",
        confirmPassword: "",
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
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
            alert("Please fill the required fields.");
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        setBusy(true);
        try {
            const fd = new FormData();
            fd.append("prenom", formData.firstName.trim());
            fd.append("nom", formData.lastName.trim());
            fd.append("email", formData.email.trim().toLowerCase());
            fd.append("phone", formData.phone.trim());
            fd.append("classes", formData.classes.trim());
            fd.append("subjects", formData.subjects.trim());
            fd.append("password", formData.password);
            if (photoFile) fd.append("photo", photoFile);

            const res = await fetch(`${API_BASE}/api/teachers`, {
                method: "POST",
                body: fd,
            });

            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`HTTP ${res.status} ${txt}`);
            }

            alert("Teacher created successfully.");
            router.push("/Admin/Users"); // or wherever your list page is
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            alert(`Failed to create teacher.\n${msg}`);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Add New Teacher</h1>
            </div>

            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
                <div className="bg-purple-600 text-white px-6 py-4">
                    <h2 className="text-lg font-semibold">Personal Details</h2>
                </div>

                <div className="p-6 space-y-6">
                    {/* First & Last name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                placeholder="Maria"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                placeholder="Historia"
                                required
                            />
                        </div>
                    </div>

                    {/* Email & Phone */}
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
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone
                            </label>
                            <Input
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="+212 6 12 34 56 78"
                            />
                        </div>
                    </div>

                    {/* Classes & Photo */}
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
                            <div className="text-xs text-gray-500 mt-1">{formData.classes.length}/2000</div>
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
                                            alt="Teacher preview"
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
                                            Drag & drop or click to select a photo
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

                    {/* Subjects */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subjects
                        </label>
                        <Input
                            name="subjects"
                            value={formData.subjects}
                            onChange={handleInputChange}
                            placeholder="Arabic, Islamic Education"
                        />
                    </div>

                    {/* Passwords */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <Link href="/Admin/Users">
                        <Button type="button" variant="outline" className="px-8">
                            Cancel
                        </Button>
                    </Link>
                    <Button type="submit" className="px-8 bg-purple-600 hover:bg-purple-700" disabled={busy}>
                        {busy ? "Saving..." : "Save"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
