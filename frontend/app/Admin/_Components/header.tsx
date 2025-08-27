"use client";
import Link from "next/link";
import { MenuIcon, PanelsTopLeft, LogOut, User, Bell } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    router.push("/");
  };

  return (
      <header className="w-full">
        <div className="flex h-16 items-center px-8 justify-between bg-white border-b border-gray-100">
          {/* Left: Title */}
          <div className="flex items-center">
          <span className="uppercase tracking-widest font-bold text-gray-700 text-base">
            {(() => {
              if (pathname === "/Admin/admin-dashboard") return "admin • dashboard";
              if (pathname === "/Admin/admin-users") return "admin • users";
              if (pathname === "/Admin/admin-content-audit") return "admin • content audit";
              if (pathname === "/Admin/admin-activity-types") return "admin • activity types";
              if (pathname === "/Admin/admin-logs") return "admin • logs";
              if (pathname === "/Admin/admin-reports") return "admin • reports";
              return "admin";
            })()}
          </span>
          </div>
          {/* Right: Language, Notification, Avatar, Logout */}
          <div className="flex items-center space-x-6">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100">
                  <span className="text-sm font-medium">Eng (US)</span>
                  <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                    <path d="M4 6l4 4 4-4" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Eng (US)</DropdownMenuItem>
                <DropdownMenuItem>Fr (FR)</DropdownMenuItem>
                <DropdownMenuItem>Ar (AR)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Notification Bell */}
            <div className="relative">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500"></span>
            </div>
            {/* Avatar */}
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User Avatar" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            {/* Logout Button */}
            <Button
                variant="destructive"
                className="ml-2 flex items-center gap-2"
                onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
  );
}
