import { useState, useCallback } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { playInVlc } from "@/lib/tauri";
import { buildStreamUrl } from "./streamUrl";
import type { LiveStream, VodStream } from "@/lib/xtream/types";

/**
 * Centralizes playback dispatch.
 *
 * - Live and VOD return `activeStream` / `activeMovie` so the caller
 *   can render PlayerModal when set.
 * - VLC mode opens externally and never sets state.
 * - Series uses a separate flow because it needs an episode picker.
 */
export function usePlayMedia() {
    const profile = useAuthStore((s) => s.profile);
    const { playerType, vlcPath } = useSettingsStore();

    const [activeLive, setActiveLive] = useState<LiveStream | null>(null);
    const [activeMovie, setActiveMovie] = useState<VodStream | null>(null);

    const playLive = useCallback(
        async (stream: LiveStream) => {
            if (!profile) {
                toast.error("No active playlist");
                return;
            }

            if (playerType === "vlc") {
                const url = buildStreamUrl(profile, stream.stream_id, "live", "ts");
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
        [profile, playerType, vlcPath],
    );

    const playMovie = useCallback(
        async (movie: VodStream) => {
            if (!profile) {
                toast.error("No active playlist");
                return;
            }

            const ext = movie.container_extension || "mp4";

            if (playerType === "vlc") {
                const url = buildStreamUrl(profile, movie.stream_id, "movie", ext);
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
        [profile, playerType, vlcPath],
    );

    const playEpisode = useCallback(
        async (episodeId: string | number, title: string, ext: string = "mp4") => {
            if (!profile) {
                toast.error("No active playlist");
                return;
            }

            const url = buildStreamUrl(profile, episodeId, "series", ext);

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
                // TODO: route to PlayerModal when we wire VOD/series ArtPlayer support
            }
        },
        [profile, playerType, vlcPath],
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