import {
    getLiveStreams as getXtreamLive,
    getLiveCategories as getXtreamLiveCategories,
} from "./xtream/api";
import { parse, type PlaylistItem } from "iptv-playlist-parser";
import type { Playlist, XtreamPlaylist } from "@/stores/authStore";
import { fetchM3u } from "./tauri";

// ─────────────────────────────────────────────────────────────
// M3U parse cache
//
// Why a Map<url, Promise<...>> and not Map<url, ParsedM3U>?
// Storing the *promise* means concurrent callers (e.g. fetchLiveCategories and
// fetchLiveChannels firing at the same time on first load) all await the same
// in-flight request instead of kicking off duplicates. This is the classic
// "request coalescing" / "single-flight" pattern.
//
// TTL is 10 minutes — long enough that category clicks are instant, short
// enough that a manual refresh feels meaningful. Tune to taste.
// ─────────────────────────────────────────────────────────────

type ParsedM3U = ReturnType<typeof parse>;

interface CacheEntry {
    promise: Promise<ParsedM3U>;
    timestamp: number;
}

const M3U_CACHE = new Map<string, CacheEntry>();
const M3U_TTL_MS = 10 * 60 * 1000;

async function getParsedM3u(url: string): Promise<ParsedM3U> {
    const now = Date.now();
    const cached = M3U_CACHE.get(url);

    if (cached && now - cached.timestamp < M3U_TTL_MS) {
        return cached.promise;
    }

    // Cache the promise immediately so concurrent callers share it.
    // We fetch through Rust (fetchM3u) to bypass CORS — see m3u.rs.
    const promise = (async () => {
        const text = await fetchM3u(url);
        return parse(text);
    })();

    M3U_CACHE.set(url, { promise, timestamp: now });

    // If the fetch fails, evict so the next call retries instead of
    // returning a cached rejected promise forever.
    promise.catch(() => M3U_CACHE.delete(url));

    return promise;
}

/** Public: call this from your Sidebar's "Refresh Data" button for M3U playlists. */
export function invalidateM3uCache(url?: string) {
    if (url) M3U_CACHE.delete(url);
    else M3U_CACHE.clear();
}

// ─────────────────────────────────────────────────────────────
// Stable ID derivation
//
// The previous code used array index as stream_id. That's unstable across
// filter changes and refreshes — anything persisted (favorites, history) breaks.
//
// FNV-1a 32-bit hash: fast, no deps, good enough for IDing strings within a
// single playlist. NOT a cryptographic hash — don't use it for anything that
// needs collision resistance. Within ~10k channels, collisions are negligible.
// ─────────────────────────────────────────────────────────────

function hashStringToInt(input: string): number {
    let hash = 0x811c9dc5; // FNV offset basis
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193); // FNV prime
    }
    return hash >>> 0; // force unsigned
}

function m3uStableId(item: PlaylistItem): number {
    // Prefer tvg.id (set by good providers, stable across refreshes).
    // Fall back to the URL, which is the next most stable identifier.
    const seed = item.tvg?.id || item.url || item.name;
    return hashStringToInt(seed);
}

// ─────────────────────────────────────────────────────────────
// Public API — note the explicit `playlist` parameter on every call.
// No more hidden reads from useAuthStore inside data-fetching code.
// ─────────────────────────────────────────────────────────────

export async function fetchLiveCategories(playlist: Playlist) {
    // TS narrows `playlist` based on `.type`. Inside each branch,
    // only the fields valid for that variant are accessible.
    if (playlist.type === "xtream") {
        return fetchXtreamLiveCategories(playlist);
    }

    if (playlist.type === "m3u") {
        return fetchM3uLiveCategories(playlist);
    }

    // Exhaustiveness check — if you add a new playlist type, TS will error here.
    const _exhaustive: never = playlist;
    return _exhaustive;
}

export async function fetchLiveChannels(playlist: Playlist, categoryId?: string) {
    if (playlist.type === "xtream") {
        return fetchXtreamLiveChannels(playlist, categoryId);
    }

    if (playlist.type === "m3u") {
        return fetchM3uLiveChannels(playlist, categoryId);
    }

    const _exhaustive: never = playlist;
    return _exhaustive;
}

// ─── Xtream branch ────────────────────────────────────────────

async function fetchXtreamLiveCategories(_playlist: XtreamPlaylist) {
    // TODO: refactor getXtreamLiveCategories/getXtreamLive to take the playlist
    // explicitly instead of reading from the store. Until then, this works
    // because the active playlist == the playlist we were called with.
    // The `_playlist` underscore signals "we acknowledge we should be using
    // this, but the legacy API doesn't accept it yet."
    return getXtreamLiveCategories();
}

async function fetchXtreamLiveChannels(_playlist: XtreamPlaylist, categoryId?: string) {
    return getXtreamLive(categoryId);
}

// ─── M3U branch ───────────────────────────────────────────────

async function fetchM3uLiveCategories(playlist: M3UPlaylist) {
    const parsed = await getParsedM3u(playlist.m3uUrl);
    const categories = new Set<string>();

    for (const item of parsed.items) {
        if (item.group?.title) categories.add(item.group.title);
    }

    return Array.from(categories).map((name) => ({
        // category_id == category_name for M3U because M3Us don't have separate IDs.
        // That's fine — IDs just need to be unique within their domain.
        category_id: name,
        category_name: name,
        parent_id: 0,
    }));
}

// We need M3UPlaylist for the type narrowing above — re-import for clarity
import type { M3UPlaylist } from "@/stores/authStore";

async function fetchM3uLiveChannels(playlist: M3UPlaylist, categoryId?: string) {
    const parsed = await getParsedM3u(playlist.m3uUrl);

    const items = categoryId
        ? parsed.items.filter((item) => item.group?.title === categoryId)
        : parsed.items;

    return items.map((item) => ({
        stream_id: m3uStableId(item), // stable across filters and refreshes
        name: item.name,
        stream_icon: item.tvg?.logo || "",
        url: item.url,
        category_id: item.group?.title || "Uncategorized",
        stream_type: "live" as const,
        num: null, // M3U has no real channel number; don't fake one
        epg_channel_id: item.tvg?.id || null,
        tv_archive: 0,
        tv_archive_duration: 0,
    }));
}