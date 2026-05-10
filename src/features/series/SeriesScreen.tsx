import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { CategoryList } from "../live/CategoryList";
import { Input } from "@/components/ui/input";
import { PosterGrid, type PosterItem } from "@/components/shared/PosterGrid";
import { SeriesModal } from "./SeriesModal";
import { useAuthStore } from "@/stores/authStore";
import { useFavoriteStore } from "@/stores/favoriteStore";
import { getSeriesCategories, getSeries } from "@/lib/xtream/api";
import { ALL_CATEGORIES_ID } from "@/lib/xtream/constants";
import { useDebounce } from "@/lib/hooks/useDebounce";
import type { SeriesItem } from "@/lib/xtream/types";

type SeriesCard = PosterItem & SeriesItem;

export function SeriesScreen() {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [activeSeries, setActiveSeries] = useState<SeriesItem | null>(null);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 150);

    const activeId = useAuthStore((s) => s.activeId);
    const { toggleSeries, isSeriesFav } = useFavoriteStore();

    const categoriesQuery = useQuery({
        queryKey: ["series-categories"],
        queryFn: getSeriesCategories,
    });

    const seriesQuery = useQuery({
        queryKey: ["series", selectedCategoryId],
        queryFn: () => {
            if (selectedCategoryId === ALL_CATEGORIES_ID) {
                return getSeries();
            }
            return getSeries(selectedCategoryId ?? undefined);
        },
        enabled: !!selectedCategoryId,
    });

    const cards = useMemo<SeriesCard[]>(() => {
        const series = seriesQuery.data ?? [];

        const searchTerms = debouncedSearch.toLowerCase().trim().split(/\s+/);

        const filtered = !debouncedSearch.trim()
            ? series
            : series.filter((s) => {
                const seriesName = s.name.toLowerCase();
                return searchTerms.every(term => seriesName.includes(term));
            });

        return filtered.map((s) => ({
            ...s,
            id: s.series_id,
            title: s.name,
            image: s.cover,
            isFav: activeId ? isSeriesFav(s.series_id, activeId) : false,
        }));
    }, [seriesQuery.data, debouncedSearch, activeId, isSeriesFav]);

    return (
        <div className="flex h-full overflow-hidden bg-background relative">
            <div className="w-64 flex-shrink-0">
                <CategoryList
                    categories={categoriesQuery.data ?? []}
                    selectedId={selectedCategoryId}
                    onSelect={setSelectedCategoryId}
                    allLabel="All Series"
                />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-3 border-b border-border">
                    <div className="relative">
                        <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={
                                selectedCategoryId
                                    ? "Search series…"
                                    : "Select a category to search"
                            }
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 h-9"
                            disabled={!selectedCategoryId}
                        />
                    </div>
                    {seriesQuery.data && (
                        <p className="text-xs text-muted-foreground mt-2">
                            {cards.length} of {seriesQuery.data.length} series
                        </p>
                    )}
                </div>

                <div className="flex-1 overflow-hidden">
                    {!selectedCategoryId && (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            Select a category to browse series
                        </div>
                    )}

                    {seriesQuery.isLoading && (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            Loading series…
                        </div>
                    )}

                    {seriesQuery.error && (
                        <div className="h-full flex items-center justify-center text-destructive">
                            Error: {(seriesQuery.error as Error).message}
                        </div>
                    )}

                    {selectedCategoryId && seriesQuery.data && (
                        <PosterGrid<SeriesCard>
                            items={cards}
                            onClick={(card) => setActiveSeries(card)}
                            onToggleFav={(card) =>
                                activeId && toggleSeries(card, activeId)
                            }
                        />
                    )}
                </div>
            </div>

            {activeSeries && (
                <SeriesModal
                    series={activeSeries}
                    onClose={() => setActiveSeries(null)}
                />
            )}
        </div>
    );
}