import { create } from "zustand";
import { platform, type Platform } from "@tauri-apps/plugin-os";

interface PlatformState {
    /** "windows" | "macos" | "linux" | "android" | "ios" — null until detected */
    os: Platform | null;
    /** Convenience: true for android | ios */
    isMobile: boolean;
    /** Convenience: true for windows | macos | linux */
    isDesktop: boolean;

    detect: () => Promise<void>;
}

export const usePlatformStore = create<PlatformState>()((set) => ({
    os: null,
    isMobile: false,
    isDesktop: true,   // optimistic default — webview is on desktop until proven otherwise

    detect: async () => {
        try {
            const os = await platform();
            const isMobile = os === "android" || os === "ios";
            set({
                os,
                isMobile,
                isDesktop: !isMobile,
            });
        } catch (err) {
            console.error("Platform detection failed:", err);
            // Keep desktop defaults on failure — safer fallback
        }
    },
}));