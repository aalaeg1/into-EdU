"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const API_BASE = "http://localhost:5002";

type Teacher = { email: string; nom?: string; prenom?: string };

export default function SettingsPage() {
  const [email, setEmail] = useState<string>("");
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [saving, setSaving] = useState(false);

  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const e = localStorage.getItem("email") || "";
      setEmail(e);
      (async () => {
        try {
          const res = await fetch(`${API_BASE}/api/teachers`, { cache: "no-store" });
          if (!res.ok) throw new Error(String(res.status));
          const arr = (await res.json()) as Teacher[];
          const me = arr.find((t) => t.email?.toLowerCase() === e.toLowerCase()) || null;
          setTeacher(me);
          setPrenom(me?.prenom || "");
          setNom(me?.nom || "");
        } catch {
          setTeacher({ email: e });
        }
      })();
    }
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // If you later add a backend endpoint, patch here.
      // For now we just simulate persist and show success.
      setTeacher((t) => (t ? { ...t, prenom, nom } : t));
      alert("Profile saved.");
    } catch {
      alert("Couldn’t save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
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
      // Wire this to your backend when available.
      // Example (future): await fetch(`${API_BASE}/api/teachers/change-password`, { method: 'POST', body: JSON.stringify({ email, oldPwd, newPwd }), headers: { 'Content-Type': 'application/json' }})
      alert("Password changed (demo).");
      setOldPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch {
      alert("Couldn’t change password.");
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">First name</label>
              <input
                  className="border rounded w-full px-3 py-2"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder="Your first name"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Last name</label>
              <input
                  className="border rounded w-full px-3 py-2"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Your last name"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input className="border rounded w-full px-3 py-2 bg-gray-50" value={email} readOnly />
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
              <input
                  className="border rounded w-full px-3 py-2"
                  type="password"
                  value={oldPwd}
                  onChange={(e) => setOldPwd(e.target.value)}
                  placeholder="••••••••"
              />
            </div>
            <div />
            <div>
              <label className="block text-sm text-gray-600 mb-1">New password</label>
              <input
                  className="border rounded w-full px-3 py-2"
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Confirm new password</label>
              <input
                  className="border rounded w-full px-3 py-2"
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="Repeat new password"
              />
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
