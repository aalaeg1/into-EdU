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
        const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
        if (role !== "teacher") {
            router.replace("/");
        }
    }, [router]);

    return (
        <div>
            <Sidebar />
            <div
                className={cn(
                    "min-h-screen transition-[margin-left] ease-in-out duration-300",
                    isOpen ? "lg:ml-64" : "lg:ml-[80px]"
                )}
            >
                <Header />
                <main>{children}</main>
            </div>
        </div>
    );
}
