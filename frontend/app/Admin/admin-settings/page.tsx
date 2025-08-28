"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

const CHANGE_PWD_API = "http://localhost:5002/api/teachers/change-password";

type ApiOk = { ok: true };
type ApiErr = { error?: string };

export default function AdminSettingsPage() {
    const [email, setEmail] = useState<string>("");
    const [role, setRole] = useState<"teacher" | "admin" | "">("");
    const [oldPwd, setOldPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);

    // Load identity from localStorage
    useEffect(() => {
        try {
            const e = localStorage.getItem("email") || "";
            const r = (localStorage.getItem("role") || "") as "teacher" | "admin" | "";
            setEmail(e);
            setRole(r);
        } catch {
            // noop
        }
    }, []);

    const canSubmit = role === "teacher" && email.length > 0 && oldPwd && newPwd && confirmPwd;

    async function handleSave() {
        setMsg(null);

        if (role !== "teacher") {
            setMsg({
                kind: "error",
                text: "Password changes are only available for teacher accounts.",
            });
            return;
        }
        if (!email) {
            setMsg({ kind: "error", text: "Missing email in session." });
            return;
        }
        if (newPwd.length < 6) {
            setMsg({ kind: "error", text: "New password must be at least 6 characters." });
            return;
        }
        if (newPwd !== confirmPwd) {
            setMsg({ kind: "error", text: "New passwords do not match." });
            return;
        }

        try {
            setSaving(true);
            const res = await fetch(CHANGE_PWD_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, oldPwd, newPwd }),
            });

            if (!res.ok) {
                let errTxt = `HTTP ${res.status}`;
                try {
                    const body = (await res.json()) as ApiErr;
                    if (body?.error) errTxt = body.error;
                } catch {}
                throw new Error(errTxt);
            }

            const data = (await res.json()) as ApiOk;
            if (!data.ok) throw new Error("Unexpected server response.");

            setMsg({ kind: "success", text: "Password updated successfully." });
            setOldPwd("");
            setNewPwd("");
            setConfirmPwd("");
        } catch (e) {
            const text = e instanceof Error ? e.message : String(e);
            setMsg({ kind: "error", text });
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto px-6 py-10">
            {/* Email */}
            <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                    <input
                        type="email"
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700"
                        value={email}
                        readOnly
                    />
                    <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500" />
                </div>
            </div>

            {/* Change password */}
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Change password</h2>

            {role === "admin" && (
                <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 text-amber-800 px-3 py-2 text-sm">
                    Admin password changes aren’t supported here. This form is enabled for teacher accounts.
                </div>
            )}

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Old Password</label>
                    <input
                        type="password"
                        placeholder="Placeholder"
                        autoComplete="current-password"
                        className="w-full rounded-lg border border-gray-200 px-4 py-3"
                        value={oldPwd}
                        onChange={(e) => setOldPwd(e.target.value)}
                        disabled={role !== "teacher"}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input
                        type="password"
                        placeholder="Input your new password"
                        autoComplete="new-password"
                        className="w-full rounded-lg border border-gray-200 px-4 py-3"
                        value={newPwd}
                        onChange={(e) => setNewPwd(e.target.value)}
                        disabled={role !== "teacher"}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Retype New Password</label>
                    <input
                        type="password"
                        placeholder="Input again your new password"
                        autoComplete="new-password"
                        className="w-full rounded-lg border border-gray-200 px-4 py-3"
                        value={confirmPwd}
                        onChange={(e) => setConfirmPwd(e.target.value)}
                        disabled={role !== "teacher"}
                    />
                </div>

                {msg && (
                    <div
                        className={
                            msg.kind === "success"
                                ? "rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-2 text-sm"
                                : "rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm"
                        }
                    >
                        {msg.text}
                    </div>
                )}

                <Button
                    onClick={handleSave}
                    disabled={!canSubmit || saving}
                    className="w-40 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                >
                    {saving ? "Saving…" : "Save Changes"}
                </Button>
            </div>
        </div>
    );
}
