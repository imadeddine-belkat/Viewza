import { useEffect, useRef } from "react";
import Artplayer from "artplayer";
import Hls from "hls.js";
import mpegts from "mpegts.js";

export interface UseArtPlayerOptions {
    containerId: string;
    url: string | null;
    onError?: (msg: string) => void;
}

export function useArtPlayer({ containerId, url, onError }: UseArtPlayerOptions) {
    const playerRef = useRef<Artplayer | null>(null);

    useEffect(() => {
        if (!url) return;

        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`ArtPlayer: container #${containerId} not found`);
            return;
        }

        const art = new Artplayer({
            container: `#${containerId}`,
            url,
            type: detectType(url),
            autoplay: true,
            autoSize: false,
            autoMini: false,
            pip: true,
            fullscreen: true,
            setting: true,
            hotkey: true,
            isLive: true,
            volume: 0.7,
            customType: {
                m3u8: (video, url) => {
                    if (Hls.isSupported()) {
                        const hls = new Hls();
                        hls.loadSource(url);
                        hls.attachMedia(video);
                        art.on("destroy", () => hls.destroy());
                    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                        video.src = url;
                    } else {
                        onError?.("HLS not supported in this environment");
                    }
                },
                ts: (video, url) => {
                    if (mpegts.getFeatureList().mseLivePlayback) {
                        const player = mpegts.createPlayer({
                            type: "mse",
                            isLive: true,
                            url: `http://127.0.0.1:1421/proxy?url=${encodeURIComponent(url)}`,
                        }, {
                            // --- 4K OPTIMIZATIONS ---
                            enableWorker: true, // Offload processing to a background thread
                            liveBufferLatencyChasing: true, // Keep the live edge tight
                            liveBufferLatencyMaxLatency: 3,
                        });

                        player.attachMediaElement(video);
                        player.load();
                        player.play();
                        art.on("destroy", () => player.destroy());
                    } else {
                        onError?.("MPEG-TS not supported in this environment");
                    }
                },
            },
        });

        // --- TRUE RESOLUTION CHECKER ---
        art.on("video:loadedmetadata", () => {
            const width = art.video.videoWidth;
            const height = art.video.videoHeight;

            // This will tell you exactly what the IPTV provider is sending!
            console.log(`[Diagnostics] True Stream Resolution: ${width}x${height}`);

            // 3840x2160 = True 4K
            // 1920x1080 = 1080p Full HD
            // 1280x720  = 720p HD
        });

        art.on("error", (err) => {
            console.error("ArtPlayer error:", err);
            onError?.("Playback failed");
        });

        playerRef.current = art;

        return () => {
            art.destroy();
            playerRef.current = null;
        };
    }, [url, containerId, onError]);

    return playerRef;
}

function detectType(url: string): "m3u8" | "ts" | "auto" {
    if (url.includes(".m3u8")) return "m3u8";
    if (url.endsWith(".ts")) return "ts";
    return "auto";
}