"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, PanelsTopLeft, LogOut, Settings as SettingsIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebarState } from "@/hook/use-sidebar-state";
import { getMenuList } from "@/lib/menu-item";

export function Sidebar() {
  const { isOpen, toggle } = useSidebarState();
  const pathname = usePathname();
  const menuItems = getMenuList();

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-20 h-screen -translate-x-full lg:translate-x-0 transition-[width] ease-in-out duration-300 bg-white border-r shadow-sm",
        isOpen ? "w-64" : "w-[80px]",
      )}
    >
      <div className="h-full flex flex-col justify-between">
        {/* Top: Logo and main menu */}
        <div>
          <div className="invisible lg:visible absolute top-3 -right-4 z-20">
            <Button onClick={toggle} className="rounded-md w-8 h-8 bg-transparent" variant="outline" size="icon">
              <ChevronLeft
                  className={cn("h-4 w-4 transition-transform ease-in-out duration-300", isOpen ? "rotate-0" : "rotate-180")}
                />
            </Button>
          </div>
          <div className="flex items-center justify-center py-8">
            {/* Affiche simplement le logo PNG sans lien */}
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-20 w-auto" />
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-320px)] px-2">
            <nav className="flex flex-col gap-1">
              {menuItems.map((item) => (
                <TooltipProvider key={item.href} disableHoverableContent>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-base font-medium transition-colors",
                          pathname === item.href
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            : "text-gray-700 hover:bg-gray-100 hover:text-blue-600",
                          isOpen ? "justify-start" : "justify-center"
                        )}
                        asChild
                      >
                        <Link href={item.href}>
                          <item.icon size={20} className={cn(isOpen ? "mr-2" : "")} />
                          <span
                            className={cn(
                              "whitespace-nowrap transition-opacity duration-300",
                              isOpen ? "opacity-100" : "opacity-0 hidden",
                            )}
                          >
                            {item.label}
                          </span>
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    {!isOpen && <TooltipContent side="right"><span>{item.label}</span></TooltipContent>}
                  </Tooltip>
                </TooltipProvider>
              ))}
            </nav>
          </ScrollArea>
        </div>
        {/* Bottom: Settings and logout */}
        <div className="flex flex-col gap-2 px-4 pb-8">
          <span className={cn("text-[11px] text-gray-400 tracking-widest mb-2 mt-2", isOpen ? "inline" : "hidden")}>SETTINGS</span>
          <Button
            variant="ghost"
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors",
              isOpen ? "justify-start" : "justify-center"
            )}
            asChild
          >
            <Link href="/Teacher/settings">
              <SettingsIcon size={20} className={cn(isOpen ? "mr-2" : "")}/>
              <span className={cn(isOpen ? "inline" : "hidden")}>Settings</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-base font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors",
              isOpen ? "justify-start" : "justify-center"
            )}
            asChild
          >
            <Link href="/">
              <LogOut size={20} className={cn(isOpen ? "mr-2" : "")}/>
              <span className={cn(isOpen ? "inline" : "hidden")}>Logout</span>
            </Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}