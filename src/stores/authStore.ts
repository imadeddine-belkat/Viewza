import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "@/lib/xtream/types";

// Extend your Profile type to include an ID and a custom Name
export interface Playlist extends Profile {
    id: string;
    name: string;
}

interface AuthState {
    playlists: Playlist[];
    activeId: string | null;

    // We keep 'profile' so LiveScreen/VodScreen don't break!
    // It will always reflect the currently active playlist.
    profile: Playlist | null;

    addPlaylist: (playlist: Playlist) => void;
    removePlaylist: (id: string) => void;
    setActivePlaylist: (id: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            playlists: [],
            activeId: null,
            profile: null,

            addPlaylist: (newPlaylist) => set((state) => {
                const updatedPlaylists = [...state.playlists, newPlaylist];
                // If it's their very first playlist, make it active automatically
                if (updatedPlaylists.length === 1) {
                    return {
                        playlists: updatedPlaylists,
                        activeId: newPlaylist.id,
                        profile: newPlaylist
                    };
                }
                return { playlists: updatedPlaylists };
            }),

            removePlaylist: (id) => set((state) => {
                const updatedPlaylists = state.playlists.filter(p => p.id !== id);

                // If they deleted the active playlist, fallback to another one (or null)
                let newActiveId = state.activeId;
                let newProfile = state.profile;

                if (state.activeId === id) {
                    newActiveId = updatedPlaylists.length > 0 ? updatedPlaylists[0].id : null;
                    newProfile = updatedPlaylists.length > 0 ? updatedPlaylists[0] : null;
                }

                return {
                    playlists: updatedPlaylists,
                    activeId: newActiveId,
                    profile: newProfile
                };
            }),

            setActivePlaylist: (id) => set((state) => {
                const active = state.playlists.find(p => p.id === id) || null;
                return { activeId: id, profile: active };
            }),
        }),
        { name: "auth-storage" }
    )
);