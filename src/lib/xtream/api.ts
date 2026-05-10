import type { Category, Profile, SeriesItem, VodStream } from "./types";
import {
    xtreamLogin,
    xtreamGetLiveCategories,
    xtreamGetLiveStreams,
    xtreamGetVodCategories,
    xtreamGetVodStreams,
    xtreamGetSeriesCategories,
    xtreamGetSeries,
    xtreamGetSeriesInfo,
} from "@/lib/tauri";

export interface LoginInput {
    url: string;
    username: string;
    password: string;
}

function parseHost(input: string): { host: string; port: number } {
    const trimmed = input.trim().replace(/\/+$/, "");

    if (trimmed.includes("://")) {
        const u = new URL(trimmed);
        return {
            host: u.hostname,
            port: u.port
                ? parseInt(u.port)
                : u.protocol === "https:" ? 443 : 80,
        };
    }

    if (trimmed.includes(":")) {
        const [host, portStr] = trimmed.split(":");
        return { host, port: parseInt(portStr) || 80 };
    }

    return { host: trimmed, port: 80 };
}

export async function login(input: LoginInput): Promise<Profile> {
    const { host, port } = parseHost(input.url);

    const response = await xtreamLogin({
        host,
        port,
        username: input.username,
        password: input.password,
    });

    return {
        host,
        port,
        username: response.user_info.username,
        password: response.user_info.password,
        status: response.user_info.status,
        expDate: response.user_info.exp_date
            ? new Date(parseInt(response.user_info.exp_date) * 1000)
            : undefined,
        maxConnections: response.user_info.max_connections
            ? parseInt(response.user_info.max_connections)
            : undefined,
    };
}

export async function getLiveCategories(): Promise<Category[]> {
    return xtreamGetLiveCategories();
}

export async function getLiveStreams(categoryId?: string) {
    return xtreamGetLiveStreams({ categoryId });
}

export async function getVodCategories(): Promise<Category[]> {
    return xtreamGetVodCategories();
}

export async function getVodStreams(categoryId?: string): Promise<VodStream[]> {
    return xtreamGetVodStreams({ categoryId });
}

export async function getSeriesCategories(): Promise<Category[]> {
    return xtreamGetSeriesCategories();
}

export async function getSeries(categoryId?: string): Promise<SeriesItem[]> {
    return xtreamGetSeries({ categoryId });
}

export async function getSeriesInfo(seriesId: number): Promise<any> {
    return xtreamGetSeriesInfo({ seriesId });
}