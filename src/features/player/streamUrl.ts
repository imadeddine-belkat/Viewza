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
// streamUrl.ts
interface StreamCredentials {
    host: string;
    port: number;
    username: string;
    password: string;
}

export function buildStreamUrl(
    creds: StreamCredentials,
    streamId: string | number,
    type: "live" | "movie" | "series" = "live",
    extension: string = "ts",
) {
    const { host, port, username, password } = creds;
    const baseUrl = `http://${host}:${port}`;

    if (type === "live") {
        return `${baseUrl}/${username}/${password}/${streamId}.${extension}`;
    }
    return `${baseUrl}/${type}/${username}/${password}/${streamId}.${extension}`;
}