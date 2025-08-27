"use client" // This component needs client-side interactivity for state management and navigation.

import Link from "next/link" // Next.js Link component for client-side navigation.
import { usePathname } from "next/navigation" // Hook to get the current URL path.
import { ChevronLeft, PanelsTopLeft, LogOut, Settings as SettingsIcon } from "lucide-react" // Icons for toggle and brand.

import { cn } from "@/lib/utils" // Our utility function for class names.
import { Button } from "@/components/ui/button" // shadcn/ui Button component.
import { ScrollArea } from "@/components/ui/scroll-area" // shadcn/ui ScrollArea for scrollable content.
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip" // shadcn/ui Tooltip components.
import { useSidebarState } from "@/hook/use-sidebar-state" // Our custom sidebar state hook.
import { getMenuList } from "@/lib/admin-menu-item" // Our menu data.

export function Sidebar() {
  const { isOpen, toggle } = useSidebarState() // Get the current state and toggle function from our hook.
  const pathname = usePathname() // Get the current path to highlight active links.
  const menuItems = getMenuList() // Get the array of menu items.

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-20 h-screen -translate-x-full lg:translate-x-0 transition-[width] ease-in-out duration-300 bg-background border-r",
        isOpen ? "w-64" : "w-[72px]",
      )}
    >
      {/* Sidebar content with flex layout to push settings to the bottom */}
      <div className="h-full flex flex-col">
        {/* Top: Toggle and main menu */}
        <div className="px-3 pt-4 flex flex-col flex-grow">
          <div className="invisible lg:visible absolute top-3 -right-4 z-20">
            <Button onClick={toggle} className="rounded-md w-8 h-8 bg-transparent" variant="outline" size="icon">
              <ChevronLeft
                className={cn("h-4 w-4 transition-transform ease-in-out duration-300", isOpen ? "rotate-0" : "rotate-180")}
              />
            </Button>
          </div>
          <h1
            className={cn(
              "transition-transform ease-in-out duration-300 mb-4 flex items-center justify-center",
              isOpen ? "translate-x-0" : "translate-x-1",
            )}
          >
            <Link href="/" className="flex items-center gap-2">
              <span
                className={cn(
                  "font-bold text-lg text-blue-600 whitespace-nowrap transition-[transform,opacity,display] ease-in-out duration-300 tracking-wider",
                  isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full hidden",
                )}
              >
                LOGO
              </span>
            </Link>
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
                              isOpen ? "opacity-100" : "opacity-0 hidden",
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
        {/* Bottom: Settings and logout */}
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
                <SettingsIcon size={18} className={cn(isOpen ? "mr-3" : "")}/>
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
                <LogOut size={18} className={cn(isOpen ? "mr-3" : "")}/>
                <span className={cn(isOpen ? "inline" : "hidden")}>Logout</span>
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </aside>
  )
}
