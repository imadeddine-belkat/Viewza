import type { Profile } from "@/lib/xtream/types";

export type StreamFormat = "m3u8" | "ts";

/**
 * Build a live stream URL from a profile and stream_id.
 *
 * Xtream live URLs look like:
 *   http://host:port/{username}/{password}/{stream_id}.ts          (MPEG-TS)
 *   http://host:port/live/{username}/{password}/{stream_id}.m3u8   (HLS)
 *
 * HLS is more reliable in browser/webview playback. Try it first.
 */
export function buildStreamUrl(
    profile: Profile,
    streamId: string | number,
    type: "live" | "movie" | "series" = "live",
    extension: string = "ts"
) {
    const { host, port, username, password } = profile;
    const baseUrl = `http://${host}:${port}`;

    if (type === "live") {
        return `${baseUrl}/${username}/${password}/${streamId}.${extension}`;
    } else {
        // VODs and Series require the type injected into the URL path
        return `${baseUrl}/${type}/${username}/${password}/${streamId}.${extension}`;
    }
}