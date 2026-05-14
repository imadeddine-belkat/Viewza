import { useEffect } from "react";
import { AppRoutes } from "@/routes/routes";
import { usePlatformStore } from "@/stores/platformStore";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { toast } from "sonner";

export default function App() {
    const detectPlatform = usePlatformStore((s) => s.detect);

    useEffect(() => {
        detectPlatform();
    }, [detectPlatform]);

    // Check for updates on startup. Fails silently if offline.
    useEffect(() => {
        (async () => {
            try {
                const update = await check();
                if (update) {
                    toast(`Update available: v${update.version}`, {
                        description: update.body?.slice(0, 100),
                        action: {
                            label: "Install",
                            onClick: async () => {
                                toast.loading("Downloading update…", { id: "update-progress" });
                                try {
                                    await update.downloadAndInstall();
                                    toast.success("Update installed, restarting…", { id: "update-progress" });
                                    await relaunch();
                                } catch (err) {
                                    toast.error(`Update failed: ${String(err)}`, { id: "update-progress" });
                                }
                            },
                        },
                        duration: Infinity,
                    });
                }
            } catch (err) {
                // Network issue, missing latest.json, etc. — don't bother the user.
                console.error("Update check failed:", err);
            }
        })();
    }, []);

    return <AppRoutes />;
}