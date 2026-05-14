import { useEffect } from "react";
import { AppRoutes } from "@/routes/routes";
import { usePlatformStore } from "@/stores/platformStore";

export default function App() {
    const detectPlatform = usePlatformStore((s) => s.detect);

    useEffect(() => {
        detectPlatform();
    }, [detectPlatform]);

    return <AppRoutes />;
}