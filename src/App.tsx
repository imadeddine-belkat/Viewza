import { useEffect } from "react";
import { AppRoutes } from "@/routes/routes";
import { useAuthStore } from "@/stores/authStore";
import { usePlatformStore } from "@/stores/platformStore";
import { xtreamSetSession } from "@/lib/tauri";

export default function App() {
    const profile = useAuthStore((s) => s.profile);
    const detectPlatform = usePlatformStore((s) => s.detect);

    // Detect platform once on app start
    useEffect(() => {
        detectPlatform();
    }, [detectPlatform]);

    // Existing auth rehydration
    useEffect(() => {
        if (profile) {
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