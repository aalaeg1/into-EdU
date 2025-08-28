"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

const API_BASE = "http://localhost:5002";

type Teacher = {
    email: string;
    nom?: string;
    prenom?: string;
    phone?: string;
    classes?: string;
    subjects?: string;
    photoUrl?: string;
};

export default function SettingsPage() {
    const [email, setEmail] = useState<string>("");
    const [teacher, setTeacher] = useState<Teacher | null>(null);

    const [prenom, setPrenom] = useState("");
    const [nom, setNom] = useState("");
    const [phone, setPhone] = useState("");
    const [classes, setClasses] = useState("");
    const [subjects, setSubjects] = useState("");
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    const [saving, setSaving] = useState(false);

    const [oldPwd, setOldPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [pwdBusy, setPwdBusy] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const e = localStorage.getItem("email") || "";
        setEmail(e);

        (async () => {
            try {
                // you can also call /api/teachers/:email if you added it
                const res = await fetch(`${API_BASE}/api/teachers`, { cache: "no-store" });
                const arr = (await res.json()) as Teacher[];
                const me = arr.find((t) => t.email?.toLowerCase() === e.toLowerCase()) || null;
                if (me) {
                    setTeacher(me);
                    setPrenom(me.prenom || "");
                    setNom(me.nom || "");
                    setPhone(me.phone || "");
                    setClasses(me.classes || "");
                    setSubjects(me.subjects || "");
                    setPhotoPreview(me.photoUrl || null);
                } else {
                    setTeacher({ email: e });
                }
            } catch {
                setTeacher({ email: e });
            }
        })();
    }, []);

    const onPickPhoto = (ev: React.ChangeEvent<HTMLInputElement>) => {
        const file = ev.target.files?.[0] || null;
        setPhotoFile(file);
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setPhotoPreview((e.target?.result as string) ?? null);
            reader.readAsDataURL(file);
        }
    };
    const removePhoto = () => {
        setPhotoFile(null);
        setPhotoPreview(null);
    };

    const handleSaveProfile = async () => {
        if (!email) return;
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append("prenom", prenom);
            fd.append("nom", nom);
            fd.append("phone", phone);
            fd.append("classes", classes);
            fd.append("subjects", subjects);
            if (photoFile) fd.append("photo", photoFile);

            const res = await fetch(`${API_BASE}/api/teachers/${encodeURIComponent(email)}`, {
                method: "PATCH",
                body: fd,
            });
            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`HTTP ${res.status} ${txt}`);
            }
            const updated = (await res.json()) as Teacher;
            setTeacher(updated);
            if (updated.photoUrl) setPhotoPreview(updated.photoUrl);
            alert("Profile saved.");
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            alert(`Couldn't save profile.\n${msg}`);
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!email) return;
        if (!newPwd || newPwd.length < 6) {
            alert("New password must be at least 6 characters.");
            return;
        }
        if (newPwd !== confirmPwd) {
            alert("New password and confirmation do not match.");
            return;
        }
        setPwdBusy(true);
        try {
            const res = await fetch(`${API_BASE}/api/teachers/change-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, oldPwd, newPwd }),
            });
            const payload = (await res.json()) as { ok?: boolean; error?: string };
            if (!res.ok || !payload.ok) {
                throw new Error(payload.error || `HTTP ${res.status}`);
            }
            alert("Password changed.");
            setOldPwd("");
            setNewPwd("");
            setConfirmPwd("");
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            alert(`Couldn't change password.\n${msg}`);
        } finally {
            setPwdBusy(false);
        }
    };

    return (
        <div className="p-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
                <p className="text-gray-600 mt-1">Manage your profile and account security</p>
            </div>

            {/* Profile */}
            <div className="bg-white border rounded-lg shadow-sm p-6 space-y-5">
                <div className="font-semibold text-gray-800">Profile</div>

                {/* Photo */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative">
                        {photoPreview ? (
                            <div className="relative inline-block">
                                <img src={photoPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover" />
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
                                <p className="text-sm text-gray-500">Drag & drop or click to select a photo</p>
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={onPickPhoto} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">First name</label>
                        <input className="border rounded w-full px-3 py-2" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Last name</label>
                        <input className="border rounded w-full px-3 py-2" value={nom} onChange={(e) => setNom(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Phone</label>
                        <input className="border rounded w-full px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Email</label>
                        <input className="border rounded w-full px-3 py-2 bg-gray-50" value={email} readOnly />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm text-gray-600 mb-1">Classes</label>
                        <textarea className="border rounded w-full px-3 py-2 min-h-[90px]" value={classes} onChange={(e) => setClasses(e.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm text-gray-600 mb-1">Subjects</label>
                        <input className="border rounded w-full px-3 py-2" value={subjects} onChange={(e) => setSubjects(e.target.value)} />
                    </div>
                </div>

                <div className="pt-3">
                    <Button className="px-4" onClick={handleSaveProfile} disabled={saving}>
                        {saving ? "Saving..." : "Save profile"}
                    </Button>
                </div>
            </div>

            {/* Security */}
            <div className="bg-white border rounded-lg shadow-sm p-6 space-y-5">
                <div className="font-semibold text-gray-800">Security</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Current password</label>
                        <input className="border rounded w-full px-3 py-2" type="password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} />
                    </div>
                    <div />
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">New password</label>
                        <input className="border rounded w-full px-3 py-2" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Confirm new password</label>
                        <input className="border rounded w-full px-3 py-2" type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
                    </div>
                </div>
                <div className="pt-3">
                    <Button className="px-4" onClick={handleChangePassword} disabled={pwdBusy}>
                        {pwdBusy ? "Updating..." : "Change password"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
