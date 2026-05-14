// src/components/shared/AppShell.tsx
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "@/stores/authStore";
import { xtreamSetSession } from "@/lib/tauri";

export function AppShell() {
    // 1. Grab the active profile from your store
    const profile = useAuthStore((state) => state.profile);

    // 2. Sync the session to Rust whenever the app opens or the profile changes
    useEffect(() => {
        if (profile) {
            xtreamSetSession({
                host: profile.host,
                port: profile.port,
                username: profile.username,
                password: profile.password,
            }).catch((err) => console.error("Failed to set Rust session:", err));
        }
    }, [profile]);

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