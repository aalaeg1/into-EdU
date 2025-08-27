"use client";

import Link from "next/link";
import { MenuIcon, LogOut, User, Bell } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getMenuList } from "@/lib/menu-item";
import { useSidebarState } from "@/hook/use-sidebar-state";

const API_BASE = "http://localhost:5002";

type Share = { email: string; role: "view" | "edit" };
type Folder = {
  _id: string;
  name: string;
  teacherEmail: string;
  sharedWith: Share[];
  pdfs?: any[];
  h5ps?: any[];
};
type TeacherLite = { email: string; nom?: string; prenom?: string };

type Notice = { id: string; text: string; href?: string; ownerEmail: string; folderId: string };

export function Header() {
  const pathname = usePathname();
  const menuItems = getMenuList();
  const { toggle } = useSidebarState();
  const router = useRouter();

  let title = "DASHBOARD";
  if (pathname === "/settings") title = "SETTINGS";
  else if (pathname === "/logout") title = "LOGOUT";
  else {
    const currentMenu = menuItems.find((item) => item.href === pathname);
    if (currentMenu) title = currentMenu.label.toUpperCase();
  }

  const [email, setEmail] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [teachersMap, setTeachersMap] = useState<Record<string, TeacherLite>>({});

  // read who I am
  useEffect(() => {
    if (typeof window !== "undefined") setEmail(localStorage.getItem("email"));
  }, []);

  // load teachers (to pretty print owner name)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/teachers`, { cache: "no-store" });
        if (!res.ok) return;
        const arr = (await res.json()) as TeacherLite[];
        const map: Record<string, TeacherLite> = {};
        for (const t of arr) map[t.email.toLowerCase()] = t;
        setTeachersMap(map);
      } catch {
        setTeachersMap({});
      }
    })();
  }, []);

  // build notifications from shared folders; poll every 25s
  useEffect(() => {
    if (!email) return;

    let active = true;
    const me = email.toLowerCase();

    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/folders`, {
          method: "GET",
          cache: "no-store",
          headers: { "x-teacher-email": email },
        });
        if (!res.ok) throw new Error(String(res.status));
        const folders = (await res.json()) as Folder[];

        // shared with me (owner != me & I'm in sharedWith)
        const shared = folders.filter(
            (f) => f.teacherEmail.toLowerCase() !== me && (f.sharedWith || []).some((s) => s.email.toLowerCase() === me)
        );

        // notifications
        const notices: Notice[] = shared.map((f) => {
          const owner = teachersMap[f.teacherEmail?.toLowerCase()];
          const ownerLabel =
              (owner ? `${owner.prenom ?? ""} ${owner.nom ?? ""}`.trim() : "") || f.teacherEmail;
          return {
            id: `${f._id}`, // one notice per folder share
            folderId: f._id,
            ownerEmail: f.teacherEmail,
            text: `${ownerLabel} shared the folder “${f.name}” with you`,
            href: `/Teacher/Dashboard/Workspace/${encodeURIComponent(f.name)}`,
          };
        });

        // unseen tracking in localStorage
        const key = "seenShareFolderIds";
        const seenSet = new Set<string>(JSON.parse(localStorage.getItem(key) || "[]"));
        const unseen = notices.filter((n) => !seenSet.has(n.folderId)).length;

        if (!active) return;
        setNotices(notices);
        setUnseenCount(unseen);
      } catch {
        if (!active) return;
        setNotices([]);
        setUnseenCount(0);
      }
    };

    load();
    const t = setInterval(load, 25000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [email, teachersMap]);

  const markAllSeen = () => {
    const key = "seenShareFolderIds";
    const current = new Set<string>(JSON.parse(localStorage.getItem(key) || "[]"));
    notices.forEach((n) => current.add(n.folderId));
    localStorage.setItem(key, JSON.stringify(Array.from(current)));
    setUnseenCount(0);
  };

  // --- Logout handler ---
  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    router.push("/");
  };

  // title/avatar helper
  const shortEmail = (email || "").split("@")[0] || "U";

  return (
      <header className="sticky top-0 z-10 w-full bg-white shadow-sm border-b">
        <div className="flex h-16 items-center px-8 gap-4">
          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggle}>
            <MenuIcon className="h-6 w-6" />
          </Button>

          {/* Title */}
          <div className="flex-1 flex items-center">
            <h1 className="font-extrabold text-xl tracking-widest text-gray-800 uppercase">{title}</h1>
          </div>

          {/* Notifications (derived from shares) */}
          <DropdownMenu onOpenChange={(open) => open && markAllSeen()}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative p-2 rounded-full hover:bg-gray-100">
                <Bell className="h-6 w-6 text-gray-700" />
                {unseenCount > 0 && (
                    <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[11px] font-bold text-white bg-red-500 rounded-full">
                  {unseenCount}
                </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="font-semibold">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notices.length === 0 ? (
                  <div className="px-3 py-6 text-sm text-gray-500">No notifications yet.</div>
              ) : (
                  <>
                    {notices.slice(0, 8).map((n) => (
                        <DropdownMenuItem key={n.id} asChild>
                          <Link href={n.href || "#"} className="whitespace-normal leading-snug text-sm">
                            {n.text}
                          </Link>
                        </DropdownMenuItem>
                    ))}
                    {notices.length > 8 && (
                        <div className="px-3 py-2 text-xs text-gray-500">
                          +{notices.length - 8} more…
                        </div>
                    )}
                  </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User Avatar" />
                  <AvatarFallback>{shortEmail.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{shortEmail}</p>
                  <p className="text-xs leading-none text-muted-foreground">{email || "—"}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {/* Profile should open Settings */}
                <DropdownMenuItem asChild>
                  <Link href="/Teacher/settings" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
  );
}
