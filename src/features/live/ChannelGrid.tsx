import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {Search, Star, Tv} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { LiveStream } from "@/lib/xtream/types";
import {useFavoriteStore} from "@/stores/favoriteStore.ts";
import {cn} from "@/lib/utils.ts";
import { useAuthStore } from "@/stores/authStore";

interface Props {
    streams: LiveStream[];
    onSelect: (stream: LiveStream) => void;
}

export function ChannelGrid({ streams, onSelect }: Props) {
    const [search, setSearch] = useState("");
    const parentRef = useRef<HTMLDivElement>(null);

    const filtered = useMemo(() => {
        if (!search.trim()) return streams;
        const q = search.toLowerCase();
        return streams.filter((s) => s.name.toLowerCase().includes(q));
    }, [streams, search]);

    const virtualizer = useVirtualizer({
        count: filtered.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 64, // each row ~64px tall (logo + 2 lines of text)
        overscan: 6,
    });

    return (
        <div className="flex flex-col h-full">
            <div className="p-3 border-b border-border">
                <div className="relative">
                    <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search channels…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 h-8"
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    {filtered.length} of {streams.length} channels
                </p>
            </div>

            <div ref={parentRef} className="flex-1 overflow-auto">
                <div
                    style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        width: "100%",
                        position: "relative",
                    }}
                >
                    {virtualizer.getVirtualItems().map((vRow) => {
                        const stream = filtered[vRow.index];
                        return (
                            <ChannelRow
                                key={stream.stream_id}
                                stream={stream}
                                onSelect={onSelect}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: `${vRow.size}px`,
                                    transform: `translateY(${vRow.start}px)`,
                                }}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

interface RowProps {
    stream: LiveStream;
    onSelect: (s: LiveStream) => void;
    style: React.CSSProperties;
}

function ChannelRow({ stream, onSelect, style }: RowProps) {
    const [imageFailed, setImageFailed] = useState(false);
    const showImage = stream.stream_icon && !imageFailed;

    const { toggleLive, isLiveFav } = useFavoriteStore();
    const activeId = useAuthStore((s) => s.activeId);
    const isFav = activeId ? isLiveFav(stream.stream_id, activeId) : false;

    return (
        <button
            style={style}
            onClick={() => onSelect(stream)}
            className="flex items-center gap-3 px-4 py-2 hover:bg-accent/50 transition-colors w-full text-left border-b border-border/40 group"
        >
            <div className="flex-shrink-0 w-12 h-12 bg-muted rounded flex items-center justify-center overflow-hidden">
                {showImage ? (
                    <img
                        src={stream.stream_icon}
                        alt=""
                        className="w-full h-full object-contain"
                        onError={() => setImageFailed(true)}
                        loading="lazy"
                    />
                ) : (
                    <Tv className="h-5 w-5 text-muted-foreground" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                    {stream.num != null && (
                        <span className="text-muted-foreground mr-2">{stream.num}</span>
                    )}
                    {stream.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                    {stream.epg_channel_id || "No EPG"}
                    {stream.tv_archive === 1 && " · Catch-up available"}
                </p>
            </div>

            {/* ADD THIS BUTTON: Toggle Favorite */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (activeId) toggleLive(stream, activeId);
                }}
                className="p-2 opacity-0 group-hover:opacity-100 hover:text-yellow-500 transition-all"
            >
                <Star className={cn("w-5 h-5", isFav && "fill-yellow-500 text-yellow-500 opacity-100")} />
            </button>
        </button>
    );
}