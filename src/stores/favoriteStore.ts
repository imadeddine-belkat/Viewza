import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LiveStream, VodStream, SeriesItem } from "@/lib/xtream/types";

// Tagged variants — each favorite knows which playlist it belongs to
export type LiveFav = LiveStream & { playlistId: string };
export type VodFav = VodStream & { playlistId: string };
export type SeriesFav = SeriesItem & { playlistId: string };

interface FavoriteState {
    // Raw storage — flat arrays across all playlists
    live: LiveFav[];
    vod: VodFav[];
    series: SeriesFav[];

    // Toggles take both the item AND the playlist it came from
    toggleLive: (item: LiveStream, playlistId: string) => void;
    toggleVod: (item: VodStream, playlistId: string) => void;
    toggleSeries: (item: SeriesItem, playlistId: string) => void;

    // Checks are scoped to a playlist — same id can exist in multiple providers
    isLiveFav: (id: number, playlistId: string) => boolean;
    isVodFav: (id: number, playlistId: string) => boolean;
    isSeriesFav: (id: number, playlistId: string) => boolean;

    // Drop all favorites belonging to a playlist (called on playlist delete)
    pruneByPlaylist: (playlistId: string) => void;
}

export const useFavoriteStore = create<FavoriteState>()(
    persist(
        (set, get) => ({
            live: [],
            vod: [],
            series: [],

            toggleLive: (item, playlistId) =>
                set((state) => {
                    const exists = state.live.find(
                        (f) => f.stream_id === item.stream_id && f.playlistId === playlistId,
                    );
                    return {
                        live: exists
                            ? state.live.filter(
                                (f) =>
                                    !(f.stream_id === item.stream_id && f.playlistId === playlistId),
                            )
                            : [...state.live, { ...item, playlistId }],
                    };
                }),

            toggleVod: (item, playlistId) =>
                set((state) => {
                    const exists = state.vod.find(
                        (f) => f.stream_id === item.stream_id && f.playlistId === playlistId,
                    );
                    return {
                        vod: exists
                            ? state.vod.filter(
                                (f) =>
                                    !(f.stream_id === item.stream_id && f.playlistId === playlistId),
                            )
                            : [...state.vod, { ...item, playlistId }],
                    };
                }),

            toggleSeries: (item, playlistId) =>
                set((state) => {
                    const exists = state.series.find(
                        (f) => f.series_id === item.series_id && f.playlistId === playlistId,
                    );
                    return {
                        series: exists
                            ? state.series.filter(
                                (f) =>
                                    !(f.series_id === item.series_id && f.playlistId === playlistId),
                            )
                            : [...state.series, { ...item, playlistId }],
                    };
                }),

            isLiveFav: (id, playlistId) =>
                get().live.some(
                    (f) => f.stream_id === id && f.playlistId === playlistId,
                ),
            isVodFav: (id, playlistId) =>
                get().vod.some(
                    (f) => f.stream_id === id && f.playlistId === playlistId,
                ),
            isSeriesFav: (id, playlistId) =>
                get().series.some(
                    (f) => f.series_id === id && f.playlistId === playlistId,
                ),

            pruneByPlaylist: (playlistId) =>
                set((state) => ({
                    live: state.live.filter((f) => f.playlistId !== playlistId),
                    vod: state.vod.filter((f) => f.playlistId !== playlistId),
                    series: state.series.filter((f) => f.playlistId !== playlistId),
                })),
        }),
        {
            name: "favorites-storage",
            version: 2, // bump version: discards any v1 data (untagged favorites)
        },
    ),
);