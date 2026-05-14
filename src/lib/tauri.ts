import { invoke } from "@tauri-apps/api/core";
import type {
    Category,
    LiveStream,
    LoginResponse,
    VodStream,
    SeriesItem,
} from "./xtream/types";

// ---- Auth / session ----

export async function xtreamLogin(args: {
    host: string;
    port: number;
    username: string;
    password: string;
}): Promise<LoginResponse> {
    return invoke<LoginResponse>("xtream_login", args);
}

export async function xtreamSetSession(args: {
    host: string;
    port: number;
    username: string;
    password: string;
}): Promise<void> {
    return invoke<void>("xtream_set_session", args);
}

export async function xtreamClearSession(): Promise<void> {
    return invoke<void>("xtream_clear_session");
}

// ---- Live ----

export async function xtreamGetLiveCategories(): Promise<Category[]> {
    return invoke<Category[]>("xtream_get_live_categories");
}

export async function xtreamGetLiveStreams(args: {
    categoryId?: string;
}): Promise<LiveStream[]> {
    return invoke<LiveStream[]>("xtream_get_live_streams", {
        categoryId: args.categoryId ?? null,
    });
}

// ---- VOD ----

export async function xtreamGetVodCategories(): Promise<Category[]> {
    return invoke<Category[]>("xtream_get_vod_categories");
}

export async function xtreamGetVodStreams(args: {
    categoryId?: string;
}): Promise<VodStream[]> {
    return invoke<VodStream[]>("xtream_get_vod_streams", {
        categoryId: args.categoryId ?? null,
    });
}

// ---- Series ----

export async function xtreamGetSeriesCategories(): Promise<Category[]> {
    return invoke<Category[]>("xtream_get_series_categories");
}

export async function xtreamGetSeries(args: {
    categoryId?: string;
}): Promise<SeriesItem[]> {
    return invoke<SeriesItem[]>("xtream_get_series", {
        categoryId: args.categoryId ?? null,
    });
}

// Series info has wildly inconsistent shapes across providers — keep loose typing.
export async function xtreamGetSeriesInfo(args: {
    seriesId: number;
}): Promise<unknown> {
    return invoke<unknown>("xtream_get_series_info", args);
}

// ---- EPG ----

export async function xtreamGetShortEpg(args: {
    streamId: number;
}): Promise<unknown> {
    return invoke<unknown>("xtream_get_short_epg", args);
}

// ---- Player ----

export async function playInVlc(args: {
    url: string;
    vlcPath: string | null;
}): Promise<void> {
    return invoke<void>("play_in_vlc", args);
}

export async function fetchM3u(url: string): Promise<string> {
    return invoke<string>("fetch_m3u", { url });
}