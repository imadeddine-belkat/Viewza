// src/components/shared/AppShell.tsx
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "@/stores/authStore";
import { xtreamSetSession } from "@/lib/tauri";

export function AppShell() {
    const activePlaylist = useAuthStore((state) => state.activePlaylist);

    // Sync the Rust session whenever the active playlist changes.
    // Only Xtream has a session — M3U is stateless.
    useEffect(() => {
        if (activePlaylist?.type === "xtream") {
            xtreamSetSession({
                host: activePlaylist.host,
                port: activePlaylist.port,
                username: activePlaylist.username,
                password: activePlaylist.password,
            }).catch((err) => console.error("Failed to set Rust session:", err));
        }
    }, [activePlaylist]);

    return (
        <div className="flex h-screen bg-background text-foreground">
            <Sidebar />
            <main className="flex-1 overflow-auto relative">
                <Outlet />
            </main>
            <Toaster position="bottom-right" />
        </div>
    );
}