"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronLeft, LogOut, Settings as SettingsIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebarState } from "@/hook/use-sidebar-state";
import { getMenuList } from "@/lib/admin-menu-item";

export function Sidebar() {
  const { isOpen, toggle } = useSidebarState();
  const pathname = usePathname();
  const menuItems = getMenuList();

  return (
      <aside
          className={cn(
              "fixed top-0 left-0 z-20 h-screen -translate-x-full lg:translate-x-0 transition-[width] ease-in-out duration-300 bg-background border-r",
              isOpen ? "w-64" : "w-[72px]"
          )}
      >
        <div className="h-full flex flex-col">
          {/* Top: Toggle + brand + menu */}
          <div className="px-3 pt-4 flex flex-col flex-grow">
            <div className="invisible lg:visible absolute top-3 -right-4 z-20">
              <Button onClick={toggle} className="rounded-md w-8 h-8 bg-transparent" variant="outline" size="icon">
                <ChevronLeft
                    className={cn("h-4 w-4 transition-transform ease-in-out duration-300", isOpen ? "rotate-0" : "rotate-180")}
                />
              </Button>
            </div>

            {/* Brand / Logo */}
            <h1
                className={cn(
                    "transition-transform ease-in-out duration-300 mb-4 flex items-center justify-center",
                    isOpen ? "translate-x-0" : "translate-x-1"
                )}
            >
              <div className="flex items-center justify-center py-8">
                {/* Affiche simplement le logo PNG sans lien */}
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="Logo" className="h-20 w-auto" />
                </div>
              </div>
            </h1>

            <ScrollArea className="h-full py-10">
              <nav className="flex flex-col space-y-1 px-2">
                {menuItems.map((item) => (
                    <TooltipProvider key={item.href} disableHoverableContent>
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <Button
                              variant="ghost"
                              className={cn(
                                  "w-full justify-start h-10 rounded-lg font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors",
                                  pathname === item.href && "bg-blue-600 text-white hover:bg-blue-700",
                                  !isOpen && "justify-center"
                              )}
                              asChild
                          >
                            <Link href={item.href}>
                              <item.icon size={18} className={cn(isOpen ? "mr-3" : "")} />
                              <span
                                  className={cn(
                                      "whitespace-nowrap transition-opacity duration-300",
                                      isOpen ? "opacity-100" : "opacity-0 hidden"
                                  )}
                              >
                            {item.label}
                          </span>
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        {!isOpen && <TooltipContent side="right">{item.label}</TooltipContent>}
                      </Tooltip>
                    </TooltipProvider>
                ))}
              </nav>
            </ScrollArea>
          </div>

          {/* Bottom: Settings + Logout */}
          <div className="flex-shrink-0 pb-6">
            <div className="px-4 mb-2">
              <span className={cn("text-xs text-gray-400 tracking-widest", isOpen ? "inline" : "hidden")}>SETTINGS</span>
            </div>
            <nav className="flex flex-col space-y-1 px-2">
              <Button
                  variant="ghost"
                  className={cn(
                      "w-full justify-start h-10 text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-lg font-medium",
                      !isOpen && "justify-center"
                  )}
                  asChild
              >
                <Link href="/settings">
                  <SettingsIcon size={18} className={cn(isOpen ? "mr-3" : "")} />
                  <span className={cn(isOpen ? "inline" : "hidden")}>Settings</span>
                </Link>
              </Button>

              <Button
                  variant="ghost"
                  className={cn(
                      "w-full justify-start h-10 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg font-medium",
                      !isOpen && "justify-center"
                  )}
                  asChild
              >
                <Link href="/">
                  <LogOut size={18} className={cn(isOpen ? "mr-3" : "")} />
                  <span className={cn(isOpen ? "inline" : "hidden")}>Logout</span>
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </aside>
  );
}
