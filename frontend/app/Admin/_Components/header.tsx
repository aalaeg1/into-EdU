"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { LogOut, Bell, FileText, Upload } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TEACHER_API = "http://localhost:5002/api/teachers";
const FOLDERS_ADMIN_API = "http://localhost:5002/api/folders/admin";
const FOLDERS_BY_TEACHER_API = "http://localhost:5002/api/folders";
const NOTIF_LAST_SEEN_KEY = "adminNotifLastSeen_v1";

type Share = { email: string; role: "view" | "edit" };
type FileMeta = { originalName: string; filename: string; uploadedAt?: string };
type Folder = {
  _id: string;
  name: string;
  teacherEmail: string;
  sharedWith: Share[];
  pdfs: FileMeta[];
  h5ps: FileMeta[];
};
type Teacher = { email: string; nom?: string; prenom?: string };

type EventItem = {
  id: string;
  ts: number;
  teacherEmail: string;
  teacherLabel: string;
  kind: "PDF" | "H5P";
  title: string;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${txt}`);
  }
  return (await res.json()) as T;
}

function titleFromFileName(name: string): string {
  return name?.replace(/\.[^.]+$/, "") || name || "Untitled";
}

function getStoredLastSeen(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(NOTIF_LAST_SEEN_KEY);
    const v = raw ? Number(raw) : 0;
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    try {
      localStorage.removeItem("role");
      localStorage.removeItem("email");
    } catch {}
    router.push("/");
  };

  // ---------- Notifications ----------
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState<boolean>(true);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState<boolean>(false);

  // ✅ FIX: give useRef an initial number (not a function)
  const lastSeenRef = useRef<number>(getStoredLastSeen());

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadingNotifs(true);
      setNotifError(null);
      try {
        const teachers = await fetchJson<Teacher[]>(TEACHER_API, { cache: "no-store" });

        let folders: Folder[] | null = null;
        try {
          folders = await fetchJson<Folder[]>(FOLDERS_ADMIN_API, { cache: "no-store" });
        } catch {
          const results = await Promise.allSettled(
              (teachers || []).map((t) =>
                  fetchJson<Folder[]>(FOLDERS_BY_TEACHER_API, {
                    cache: "no-store",
                    headers: { "x-teacher-email": t.email },
                  })
              )
          );
          const merged: Folder[] = [];
          for (const r of results) {
            if (r.status === "fulfilled" && Array.isArray(r.value)) merged.push(...r.value);
          }
          folders = merged;
        }

        const labelByEmail = new Map<string, string>();
        for (const t of teachers || []) {
          const label = `${t.prenom ?? ""} ${t.nom ?? ""}`.trim();
          labelByEmail.set(t.email.toLowerCase(), label || t.email);
        }

        const evts: EventItem[] = [];
        for (const f of folders || []) {
          for (const p of f.pdfs || []) {
            const when = p.uploadedAt ? +new Date(p.uploadedAt) : 0;
            if (!when) continue;
            evts.push({
              id: `pdf:${f._id}:${p.filename}`,
              ts: when,
              teacherEmail: f.teacherEmail,
              teacherLabel: labelByEmail.get(f.teacherEmail.toLowerCase()) || f.teacherEmail,
              kind: "PDF",
              title: titleFromFileName(p.originalName || p.filename),
            });
          }
          for (const h of f.h5ps || []) {
            const when = h.uploadedAt ? +new Date(h.uploadedAt) : 0;
            if (!when) continue;
            evts.push({
              id: `h5p:${f._id}:${h.filename}`,
              ts: when,
              teacherEmail: f.teacherEmail,
              teacherLabel: labelByEmail.get(f.teacherEmail.toLowerCase()) || f.teacherEmail,
              kind: "H5P",
              title: titleFromFileName(h.originalName || h.filename),
            });
          }
        }

        evts.sort((a, b) => b.ts - a.ts);
        if (!cancelled) setEvents(evts);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!cancelled) {
          setNotifError(msg || "Failed to load notifications");
          setEvents([]);
        }
      } finally {
        if (!cancelled) setLoadingNotifs(false);
      }
    };

    void load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const unreadCount = useMemo(() => {
    const lastSeen = lastSeenRef.current || 0;
    return events.reduce((n, e) => (e.ts > lastSeen ? n + 1 : n), 0);
  }, [events]);

  const onNotifOpenChange = (open: boolean) => {
    setNotifOpen(open);
    if (open) {
      const now = Date.now();
      lastSeenRef.current = now;
      try {
        localStorage.setItem(NOTIF_LAST_SEEN_KEY, String(now));
      } catch {}
    }
  };

  const pageTitle = (() => {
    if (pathname === "/Admin/admin-dashboard") return "admin • dashboard";
    if (pathname === "/Admin/admin-users") return "admin • users";
    if (pathname === "/Admin/admin-content-audit") return "admin • content audit";
    if (pathname === "/Admin/admin-activity-types") return "admin • activity types";
    if (pathname === "/Admin/admin-logs") return "admin • logs";
    if (pathname === "/Admin/admin-reports") return "admin • reports";
    if (pathname === "/Admin/admin-settings") return "admin • settings";
    return "admin";
  })();

  return (
      <header className="w-full">
        <div className="flex h-16 items-center px-8 justify-between bg-white border-b border-gray-100">
          <div className="flex items-center">
            <span className="uppercase tracking-widest font-bold text-gray-700 text-base">{pageTitle}</span>
          </div>

          <div className="flex items-center space-x-6">
            <DropdownMenu open={notifOpen} onOpenChange={onNotifOpenChange}>
              <DropdownMenuTrigger asChild>
                <button className="relative">
                  <Bell className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                  {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] leading-[18px] text-white bg-red-600 text-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[360px]">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Recent uploads</span>
                  {loadingNotifs && <span className="text-xs text-gray-400">Loading…</span>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifError ? (
                    <div className="p-3 text-sm text-red-600">{notifError}</div>
                ) : events.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">No uploads yet.</div>
                ) : (
                    <>
                      {events.slice(0, 10).map((e) => (
                          <DropdownMenuItem key={e.id} className="py-2 focus:bg-gray-50 cursor-default">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                {e.kind === "PDF" ? (
                                    <FileText className="w-4 h-4 text-blue-600" />
                                ) : (
                                    <Upload className="w-4 h-4 text-indigo-500" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm">
                                  <span className="font-semibold text-gray-800">{e.teacherLabel}</span>{" "}
                                  uploaded <span className="font-medium">{e.kind}</span> “{e.title}”
                                </div>
                                <div className="text-[11px] text-gray-400">{new Date(e.ts).toLocaleString()}</div>
                              </div>
                            </div>
                          </DropdownMenuItem>
                      ))}
                      {events.length > 10 && (
                          <>
                            <DropdownMenuSeparator />
                            <div className="p-2 text-center text-xs text-gray-500">
                              Showing 10 of {events.length}. See Logs for more.
                            </div>
                          </>
                      )}
                    </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User Avatar" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>

            <Button variant="destructive" className="ml-2 flex items-center gap-2" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
  );
}
