"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./_Components/sidebar";
import { Header } from "./_Components/header";
import { useSidebarState } from "@/hook/use-sidebar-state";
import { cn } from "@/lib/utils";

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    const { isOpen } = useSidebarState();
    const router = useRouter();

    useEffect(() => {
        // On récupère le rôle depuis le localStorage
        const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
        if (role !== "admin") {
            router.replace("/"); // Redirige s'il n'est pas admin connecté
        }
    }, [router]);

    return (
        <div className="min-h-screen flex bg-[#F7F8FA]">
            <Sidebar />
            <div
                className={cn(
                    "flex-1 flex flex-col min-h-screen transition-[margin-left] ease-in-out duration-300",
                    isOpen ? "lg:ml-64" : "lg:ml-[72px]"
                )}
            >
                <Header />
                <main className="flex-1 px-2 md:px-6 py-4 md:py-8">{children}</main>
            </div>
        </div>
    );
}
