"use client";

import Link from "next/link";
import { MenuIcon, LogOut, User, Bell } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
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

  // --- Logout handler ---
  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    router.push("/");
  };

  return (
      <header className="sticky top-0 z-10 w-full bg-white shadow-sm border-b">
        <div className="flex h-16 items-center px-8 gap-4">
          {/* Mobile Menu Button */}
          <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={toggle}
          >
            <MenuIcon className="h-6 w-6" />
          </Button>
          {/* Title */}
          <div className="flex-1 flex items-center">
            <h1 className="font-extrabold text-xl tracking-widest text-gray-800 uppercase">{title}</h1>
          </div>
          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100">
                <span className="text-sm font-medium">Eng (US)</span>
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Eng (US)</DropdownMenuItem>
              <DropdownMenuItem>Fr (FR)</DropdownMenuItem>
              <DropdownMenuItem>Ar (AR)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Notification Bell */}
          <Button variant="ghost" className="relative p-2 rounded-full hover:bg-gray-100">
            <Bell className="h-6 w-6 text-gray-700" />
            <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">1</span>
          </Button>
          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User Avatar" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">John Doe</p>
                  <p className="text-xs leading-none text-muted-foreground">john.doe@example.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
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
