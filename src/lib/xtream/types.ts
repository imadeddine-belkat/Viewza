export interface UserInfo {
    username: string;
    password: string;
    auth: number;
    status: string;
    exp_date?: string;
    is_trial?: string;
    active_cons?: string;
    created_at?: string;
    max_connections?: string;
    allowed_output_formats: string[];
}

export interface ServerInfo {
    url: string;
    port: string;
    https_port: string;
    server_protocol: string;
    timezone: string;
    time_now: string;
}

export interface LoginResponse {
    user_info: UserInfo;
    server_info: ServerInfo;
}

// What our app code actually wants — flatter, normalized
export interface Profile {
    host: string;
    port: number;
    username: string;
    password: string;
    status: string;
    expDate?: Date;
    maxConnections?: number;
}

export interface Category {
    category_id: string;
    category_name: string;
    parent_id: number;
}

export interface LiveStream {
    num: number | null;
    name: string;
    stream_type: string;
    stream_id: number;
    stream_icon: string;
    epg_channel_id: string | null;
    category_id: string;
    tv_archive: number;
    tv_archive_duration: number;
    url?: string;
}

export interface VodStream {
    num: number | null;
    name: string;
    stream_type: string;
    stream_id: number;
    stream_icon: string;
    category_id: string;
    container_extension: string;
}

export interface SeriesItem {
    num: number | null;
    name: string;
    series_id: number;
    cover: string;
    category_id: string;
}