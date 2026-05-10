import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
    playerType: "artplayer" | "vlc";
    setPlayerType: (type: "artplayer" | "vlc") => void;

    vlcPath: string;
    setVlcPath: (path: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            playerType: "artplayer",
            setPlayerType: (type) => set({ playerType: type }),

            vlcPath: "", // Default to empty (Rust will use OS defaults)
            setVlcPath: (path) => set({ vlcPath: path }),
        }),
        { name: "settings-storage" }
    )
);