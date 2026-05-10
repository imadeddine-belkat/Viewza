import { useEffect } from "react";
import { AppRoutes } from "@/routes/routes";
import { useAuthStore } from "@/stores/authStore";
import { xtreamSetSession } from "@/lib/tauri";

export default function App() {
    const profile = useAuthStore((s) => s.profile);

    useEffect(() => {
        if (profile) {
            // Rehydrate Rust session state from persisted Zustand profile.
            // Fire and forget — if it fails, next API call will surface the error.
            xtreamSetSession({
                host: profile.host,
                port: profile.port,
                username: profile.username,
                password: profile.password,
            }).catch(console.error);
        }
    }, [profile]);

    return <AppRoutes />;
}