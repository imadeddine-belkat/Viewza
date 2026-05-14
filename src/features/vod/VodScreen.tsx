import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { CategoryList } from "../live/CategoryList";
import { Input } from "@/components/ui/input";
import { PosterGrid, type PosterItem } from "@/components/shared/PosterGrid";
import { PlayerModal } from "@/features/player/PlayerModal";
import { buildStreamUrl } from "@/features/player/streamUrl";
import { useAuthStore } from "@/stores/authStore";
import { useFavoriteStore } from "@/stores/favoriteStore";
import { usePlayMedia } from "@/features/player/usePlayMedia";
import { getVodCategories, getVodStreams } from "@/lib/xtream/api";
import { ALL_CATEGORIES_ID } from "@/lib/xtream/constants";
import { useDebounce } from "@/lib/hooks/useDebounce";
import type { VodStream } from "@/lib/xtream/types";

type VodCard = PosterItem & VodStream;

export function VodScreen() {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 150);

    const activePlaylist = useAuthStore((s) => s.activePlaylist);
    const activeId = useAuthStore((s) => s.activeId);
    const { toggleVod, isVodFav } = useFavoriteStore();
    const { activeMovie, setActiveMovie, playMovie } = usePlayMedia();

    const categoriesQuery = useQuery({
        queryKey: ["vod-categories", activePlaylist?.id],
        queryFn: getVodCategories,
        enabled: !!activePlaylist && activePlaylist.type === "xtream",
    });

    const streamsQuery = useQuery({
        queryKey: ["vod-streams", selectedCategoryId, activePlaylist?.id],
        queryFn: () => {
            if (selectedCategoryId === ALL_CATEGORIES_ID) {
                return getVodStreams();
            }
            return getVodStreams(selectedCategoryId ?? undefined);
        },
        enabled: !!selectedCategoryId && !!activePlaylist && activePlaylist.type === "xtream",
    });

    const cards = useMemo<VodCard[]>(() => {
        const movies = streamsQuery.data ?? [];

        const searchTerms = debouncedSearch.toLowerCase().trim().split(/\s+/);

        const filtered = !debouncedSearch.trim()
            ? movies
            : movies.filter((m) => {
                const movieName = m.name.toLowerCase();
                return searchTerms.every((term) => movieName.includes(term));
            });

        return filtered.map((m) => ({
            ...m,
            id: m.stream_id,
            title: m.name,
            image: m.stream_icon,
            isFav: activeId ? isVodFav(m.stream_id, activeId) : false,
        }));
    }, [streamsQuery.data, debouncedSearch, activeId, isVodFav]);

    const getMovieUrl = () => {
        if (!activeMovie || !activePlaylist || activePlaylist.type !== "xtream") return null;
        return buildStreamUrl(
            activePlaylist,
            activeMovie.stream_id,
            "movie",
            activeMovie.container_extension || "mp4",
        );
    };

    if (activePlaylist?.type === "m3u") {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground p-8 text-center">
                Movies are not available for M3U playlists. Switch to an Xtream playlist to browse VOD.
            </div>
        );
    }

    return (
        <div className="flex h-full overflow-hidden bg-background">
            <div className="w-64 flex-shrink-0">
                <CategoryList
                    categories={categoriesQuery.data ?? []}
                    selectedId={selectedCategoryId}
                    onSelect={setSelectedCategoryId}
                    allLabel="All Movies"
                />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-3 border-b border-border">
                    <div className="relative">
                        <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={
                                selectedCategoryId ? "Search movies…" : "Select a category to search"
                            }
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 h-9"
                            disabled={!selectedCategoryId}
                        />
                    </div>
                    {streamsQuery.data && (
                        <p className="text-xs text-muted-foreground mt-2">
                            {cards.length} of {streamsQuery.data.length} movies
                        </p>
                    )}
                </div>

                <div className="flex-1 overflow-hidden">
                    {!selectedCategoryId && (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            Select a category to browse movies
                        </div>
                    )}

                    {streamsQuery.isLoading && (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            Loading movies…
                        </div>
                    )}

                    {streamsQuery.error && (
                        <div className="h-full flex items-center justify-center text-destructive">
                            Error: {(streamsQuery.error as Error).message}
                        </div>
                    )}

                    {selectedCategoryId && streamsQuery.data && (
                        <PosterGrid<VodCard>
                            items={cards}
                            onClick={(card) => playMovie(card)}
                            onToggleFav={(card) => activeId && toggleVod(card, activeId)}
                        />
                    )}
                </div>
            </div>

            <PlayerModal
                url={getMovieUrl()}
                title={activeMovie?.name || "Movie"}
                icon={activeMovie?.stream_icon}
                onClose={() => setActiveMovie(null)}
            />
        </div>
    );
}