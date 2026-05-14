import { useState, useCallback } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { playInVlc } from "@/lib/tauri";
import { buildStreamUrl } from "./streamUrl";
import type { LiveStream, VodStream } from "@/lib/xtream/types";

export function usePlayMedia() {
    const activePlaylist = useAuthStore((s) => s.activePlaylist);
    const { playerType, vlcPath } = useSettingsStore();

    const [activeLive, setActiveLive] = useState<LiveStream | null>(null);
    const [activeMovie, setActiveMovie] = useState<VodStream | null>(null);

    const playLive = useCallback(
        async (stream: LiveStream) => {
            if (!activePlaylist) {
                toast.error("No active playlist");
                return;
            }

            // M3U streams already carry a direct URL — use it as-is.
            if (activePlaylist.type === "m3u") {
                if (!stream.url) {
                    toast.error("Stream has no URL");
                    return;
                }
                if (playerType === "vlc") {
                    try {
                        const pathToSend = vlcPath.trim() !== "" ? vlcPath.trim() : null;
                        await playInVlc({ url: stream.url, vlcPath: pathToSend });
                        toast.success(`Opening ${stream.name} in VLC`);
                    } catch (err) {
                        toast.error(String(err));
                    }
                } else {
                    setActiveLive(stream);
                }
                return;
            }

            // Xtream — build URL from credentials.
            if (playerType === "vlc") {
                const url = buildStreamUrl(activePlaylist, stream.stream_id, "live", "ts");
                try {
                    const pathToSend = vlcPath.trim() !== "" ? vlcPath.trim() : null;
                    await playInVlc({ url, vlcPath: pathToSend });
                    toast.success(`Opening ${stream.name} in VLC`);
                } catch (err) {
                    toast.error(String(err));
                }
            } else {
                setActiveLive(stream);
            }
        },
        [activePlaylist, playerType, vlcPath],
    );

    const playMovie = useCallback(
        async (movie: VodStream) => {
            if (!activePlaylist) {
                toast.error("No active playlist");
                return;
            }

            // VOD is Xtream-only — M3U playlists don't have movies.
            if (activePlaylist.type !== "xtream") {
                toast.error("Movies are not available for M3U playlists");
                return;
            }

            const ext = movie.container_extension || "mp4";

            if (playerType === "vlc") {
                const url = buildStreamUrl(activePlaylist, movie.stream_id, "movie", ext);
                try {
                    const pathToSend = vlcPath.trim() !== "" ? vlcPath.trim() : null;
                    await playInVlc({ url, vlcPath: pathToSend });
                    toast.success(`Opening ${movie.name} in VLC`);
                } catch (err) {
                    toast.error(String(err));
                }
            } else {
                setActiveMovie(movie);
            }
        },
        [activePlaylist, playerType, vlcPath],
    );

    const playEpisode = useCallback(
        async (episodeId: string | number, title: string, ext: string = "mp4") => {
            if (!activePlaylist) {
                toast.error("No active playlist");
                return;
            }

            if (activePlaylist.type !== "xtream") {
                toast.error("Series are not available for M3U playlists");
                return;
            }

            const url = buildStreamUrl(activePlaylist, episodeId, "series", ext);

            if (playerType === "vlc") {
                try {
                    const pathToSend = vlcPath.trim() !== "" ? vlcPath.trim() : null;
                    await playInVlc({ url, vlcPath: pathToSend });
                    toast.success(`Playing ${title}`);
                } catch (err) {
                    toast.error(String(err));
                }
            } else {
                toast.info(`Web player for series TBD: ${url}`);
            }
        },
        [activePlaylist, playerType, vlcPath],
    );

    return {
        activeLive,
        activeMovie,
        setActiveLive,
        setActiveMovie,
        playLive,
        playMovie,
        playEpisode,
    };
}