import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { CategoryList } from "./CategoryList";
import { ChannelGrid } from "./ChannelGrid";
import { PlayerModal } from "@/features/player/PlayerModal";
import { getLiveCategories, getLiveStreams } from "@/lib/xtream/api";
import { buildStreamUrl } from "@/features/player/streamUrl"; // Adjust path if needed
import { useAuthStore } from "@/stores/authStore";
import { ALL_CATEGORIES_ID } from "@/lib/xtream/constants";
import { usePlayMedia } from "@/features/player/usePlayMedia";

export function LiveScreen() {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    const { activeLive, setActiveLive, playLive } = usePlayMedia();
    const profile = useAuthStore((s) => s.profile);  // keep for URL building in modal


    const categoriesQuery = useQuery({
        queryKey: ["live-categories"],
        queryFn: getLiveCategories,
    });

    const streamsQuery = useQuery({
        queryKey: ["live-streams", selectedCategoryId],
        queryFn: () => {
            // For "All", omit category_id — Xtream returns everything
            if (selectedCategoryId === ALL_CATEGORIES_ID) {
                return getLiveStreams();
            }
            return getLiveStreams(selectedCategoryId ?? undefined);
        },
        enabled: !!selectedCategoryId,
    });

    if (categoriesQuery.isLoading) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground">
                Loading categories…
            </div>
        );
    }

    if (categoriesQuery.error) {
        return (
            <div className="h-full flex items-center justify-center text-destructive">
                Error loading categories: {(categoriesQuery.error as Error).message}
            </div>
        );
    }

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
                            Select a category to browse channels
                        </div>
                    )}

                    {selectedCategoryId && streamsQuery.isLoading && (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            Loading channels…
                        </div>
                    )}

                    {selectedCategoryId && streamsQuery.error && (
                        <div className="h-full flex items-center justify-center text-destructive">
                            Error: {(streamsQuery.error as Error).message}
                        </div>
                    )}

                    {selectedCategoryId && streamsQuery.data && (
                        <ChannelGrid
                            streams={streamsQuery.data}
                            onSelect={playLive}
                        />
                    )}
                </div>
            </div>

            <PlayerModal
                url={activeLive && profile ? buildStreamUrl(profile, activeLive.stream_id) : null}
                title={activeLive?.name || "Live Stream"}
                icon={activeLive?.stream_icon}
                onClose={() => setActiveLive(null)}
            />
        </>
    );
}