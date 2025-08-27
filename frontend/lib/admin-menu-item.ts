import {
  Home,
  Settings,
  Users,
  Package,
  BarChart,
  type LucideIcon,
  LayoutDashboard,
  Library,
  FilePlus2,
  Upload,
  LogOut,
} from "lucide-react";

// Define the type for a single menu item.
type MenuItem = {
  href: string; // The URL path for the navigation link.
  label: string; // The display text for the menu item.
  icon: LucideIcon; // The Lucide React icon component for the menu item.
};

// Function to get the list of menu items.
export function getMenuList(): MenuItem[] {
  return [
    {
      href: "/Admin/admin-dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/Admin/admin-users",
      label: "Users",
      icon: Users,
    },
    {
      href: "/Admin/admin-content-audit",
      label: "Content Audit",
      icon: BarChart,
    },
    {
      href: "/Admin/admin-activity-types",
      label: "Activity Types",
      icon: Package,
    },
    {
      href: "/Admin/admin-logs",
      label: "Logs",
      icon: Library,
    },
    {
      href: "/Admin/admin-reports",
      label: "Reports",
      icon: FilePlus2,
    },
  ];
}
