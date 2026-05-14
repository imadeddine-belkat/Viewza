import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─────────────────────────────────────────────────────────────
// Types live here now (not in xtream/types.ts) because the union
// is a store-level concept, not an Xtream-API concept.
// ─────────────────────────────────────────────────────────────

interface BasePlaylist {
    id: string;
    name: string;
}

export interface XtreamPlaylist extends BasePlaylist {
    type: "xtream";
    host: string;
    port: number;
    username: string;
    password: string;
    status: string;
    maxConnections?: number;
}

export interface M3UPlaylist extends BasePlaylist {
    type: "m3u";
    m3uUrl: string;
}

// The discriminated union. TypeScript will now FORCE you to check
// `playlist.type` before touching type-specific fields.
export type Playlist = XtreamPlaylist | M3UPlaylist;

// ─────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────

interface AuthState {
    playlists: Playlist[];
    activeId: string | null;

    // Renamed from `profile`. The old name implied "Xtream credentials";
    // the new name accurately says "whichever playlist is currently selected,
    // could be either kind."
    activePlaylist: Playlist | null;

    addPlaylist: (playlist: Playlist) => void;
    removePlaylist: (id: string) => void;
    setActivePlaylist: (id: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            playlists: [],
            activeId: null,
            activePlaylist: null,

            addPlaylist: (newPlaylist) =>
                set((state) => {
                    const updatedPlaylists = [...state.playlists, newPlaylist];
                    if (updatedPlaylists.length === 1) {
                        return {
                            playlists: updatedPlaylists,
                            activeId: newPlaylist.id,
                            activePlaylist: newPlaylist,
                        };
                    }
                    return { playlists: updatedPlaylists };
                }),

            removePlaylist: (id) =>
                set((state) => {
                    const updatedPlaylists = state.playlists.filter((p) => p.id !== id);
                    if (state.activeId === id) {
                        const fallback = updatedPlaylists[0] ?? null;
                        return {
                            playlists: updatedPlaylists,
                            activeId: fallback?.id ?? null,
                            activePlaylist: fallback,
                        };
                    }
                    return { playlists: updatedPlaylists };
                }),

            setActivePlaylist: (id) =>
                set((state) => {
                    const active = state.playlists.find((p) => p.id === id) ?? null;
                    return { activeId: id, activePlaylist: active };
                }),
        }),
        {
            name: "auth-storage",
            version: 1,
            migrate: (persistedState: any, version: number) => {
                // v0 → v1: rename `profile` → `activePlaylist`,
                // backfill `type: "xtream"` on legacy playlists.
                if (version === 0) {
                    const playlists = (persistedState?.playlists ?? []).map((p: any) => ({
                        ...p,
                        type: p.type ?? "xtream",
                    }));

                    const activePlaylist = persistedState?.profile
                        ? { ...persistedState.profile, type: persistedState.profile.type ?? "xtream" }
                        : (playlists.find((p: any) => p.id === persistedState?.activeId) ?? null);

                    return {
                        playlists,
                        activeId: persistedState?.activeId ?? null,
                        activePlaylist,
                    };
                }
                return persistedState;
            },
        },
    ),
);