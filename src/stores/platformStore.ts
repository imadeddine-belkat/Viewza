import { create } from "zustand";
import { platform, type Platform } from "@tauri-apps/plugin-os";
import { getLiveStreams, getVodStreams, getSeries } from '@/lib/xtream/api';

interface PlatformState {
    /** "windows" | "macos" | "linux" | "android" | "ios" — null until detected */
    os: Platform | null;
    /** Convenience: true for android | ios */
    isMobile: boolean;
    /** Convenience: true for windows | macos | linux */
    isDesktop: boolean;
    isRefreshing: boolean;

    liveStreams: any[];
    vodStreams: any[];
    series: any[];

    refreshPlaylist: () => Promise<void>;

    detect: () => Promise<void>;
}

export const usePlatformStore = create<PlatformState>()((set) => ({
    os: null,
    isMobile: false,
    isDesktop: true,   // optimistic default — webview is on desktop until proven otherwise
    isRefreshing: false,
    liveStreams: [],
    vodStreams: [],
    series: [],

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
    refreshPlaylist: async () => {
        set({ isRefreshing: true });

        try {
            // Fetch sequentially to prevent provider timeouts / rate limits
            const newLive = await getLiveStreams();
            const newVod = await getVodStreams();
            const newSeries = await getSeries();

            set({
                liveStreams: newLive,
                vodStreams: newVod,
                series: newSeries,
                isRefreshing: false
            });
        } catch (error) {
            console.error("Failed to refresh playlist:", error);
            set({ isRefreshing: false });
            throw error;
        }
    }
}));