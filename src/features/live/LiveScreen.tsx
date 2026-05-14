import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { CategoryList } from "./CategoryList";
import { ChannelGrid } from "./ChannelGrid";
import { PlayerModal } from "@/features/player/PlayerModal";
import { fetchLiveCategories, fetchLiveChannels } from "@/lib/playlistManager";
import { buildStreamUrl } from "@/features/player/streamUrl";
import { useAuthStore } from "@/stores/authStore";
import { ALL_CATEGORIES_ID } from "@/lib/xtream/constants";
import { usePlayMedia } from "@/features/player/usePlayMedia";

export function LiveScreen() {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    const { activeLive, setActiveLive, playLive } = usePlayMedia();

    // Single source of truth — same name everywhere in this file.
    const activePlaylist = useAuthStore((s) => s.activePlaylist);

    const categoriesQuery = useQuery({
        queryKey: ["live-categories", activePlaylist?.id],
        queryFn: () => {
            if (!activePlaylist) return [];
            return fetchLiveCategories(activePlaylist);
        },
        enabled: !!activePlaylist,
    });

    const streamsQuery = useQuery({
        queryKey: ["live-streams", selectedCategoryId, activePlaylist?.id],
        queryFn: () => {
            if (!activePlaylist) return [];
            const catId = selectedCategoryId === ALL_CATEGORIES_ID ? undefined : selectedCategoryId;
            return fetchLiveChannels(activePlaylist, catId ?? undefined);
        },
        enabled: !!selectedCategoryId && !!activePlaylist,
    });

    // Now TypeScript narrows correctly because activePlaylist is the discriminated union.
    const getStreamUrl = () => {
        if (!activeLive || !activePlaylist) return null;
        if (activePlaylist.type === "m3u") return activeLive.url ?? null;
        // Inside this branch TS knows activePlaylist is XtreamPlaylist.
        return buildStreamUrl(activePlaylist, activeLive.stream_id);
    };

    if (categoriesQuery.isLoading)
        return <div className="h-full flex items-center justify-center">Loading categories…</div>;
    if (categoriesQuery.error)
        return <div className="h-full flex items-center justify-center text-destructive">Error loading categories</div>;

    return (
        <>
            <div className="h-full flex">
                <div className="w-72 flex-shrink-0">
                    <CategoryList
                        categories={categoriesQuery.data ?? []}
                        selectedId={selectedCategoryId}
                        onSelect={setSelectedCategoryId}
                        allLabel="All Channels"
                    />
                </div>

                <div className="flex-1 min-w-0">
                    {!selectedCategoryId && (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            Select a category
                        </div>
                    )}
                    {selectedCategoryId && streamsQuery.isLoading && (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            Loading channels…
                        </div>
                    )}
                    {selectedCategoryId && streamsQuery.data && (
                        <ChannelGrid streams={streamsQuery.data} onSelect={playLive} />
                    )}
                </div>
            </div>

            <PlayerModal
                url={getStreamUrl()}
                title={activeLive?.name || "Live Stream"}
                icon={activeLive?.stream_icon}
                onClose={() => setActiveLive(null)}
            />
        </>
    );
}