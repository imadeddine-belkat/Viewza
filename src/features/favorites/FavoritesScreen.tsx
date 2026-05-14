import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Star, Tv, Film, ListVideo } from "lucide-react";

import { useFavoriteStore } from "@/stores/favoriteStore";
import { useAuthStore } from "@/stores/authStore";
import { usePlayMedia } from "@/features/player/usePlayMedia";
import { PlayerModal } from "@/features/player/PlayerModal";
import { SeriesModal } from "@/features/series/SeriesModal";
import { buildStreamUrl } from "@/features/player/streamUrl";
import { PosterFavoriteButton } from "@/components/shared/PosterFavoriteButton";
import type { SeriesItem } from "@/lib/xtream/types";

export function FavoritesScreen() {
    const activeId = useAuthStore((s) => s.activeId);
    const activePlaylist = useAuthStore((s) => s.activePlaylist);
    const { live, vod, series, toggleLive, toggleVod, toggleSeries } = useFavoriteStore();

    const {
        activeLive,
        activeMovie,
        setActiveLive,
        setActiveMovie,
        playLive,
        playMovie,
    } = usePlayMedia();

    const [activeSeries, setActiveSeries] = useState<SeriesItem | null>(null);

    // Filter favorites to only those belonging to the active playlist
    const myLive = useMemo(
        () => (activeId ? live.filter((f) => f.playlistId === activeId) : []),
        [live, activeId],
    );
    const myVod = useMemo(
        () => (activeId ? vod.filter((f) => f.playlistId === activeId) : []),
        [vod, activeId],
    );
    const mySeries = useMemo(
        () => (activeId ? series.filter((f) => f.playlistId === activeId) : []),
        [series, activeId],
    );

    const totalCount = myLive.length + myVod.length + mySeries.length;

    return (
        <div className="h-full overflow-y-auto">
            <div className="p-6 max-w-7xl mx-auto space-y-4">
                <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Star className="text-yellow-500 fill-yellow-500" /> Favorites
                </h1>

                {totalCount === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                        <Star className="w-12 h-12 mb-4 opacity-30" />
                        <p>No favorites yet for this playlist.</p>
                        <p className="text-sm mt-1">
                            Tap the star icon on any channel, movie, or series to save it.
                        </p>
                    </div>
                ) : (
                    <>
                        <FavoriteSection
                            title="Live Channels"
                            icon={<Tv className="w-4 h-4" />}
                            count={myLive.length}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {myLive.map((item) => (
                                    <div
                                        key={item.stream_id}
                                        onClick={() => playLive(item)}
                                        className="p-2 border rounded-md flex items-center gap-3 bg-card cursor-pointer hover:bg-accent transition-colors group"
                                    >
                                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {item.stream_icon ? (
                                                <img
                                                    src={item.stream_icon}
                                                    alt=""
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = "none";
                                                    }}
                                                />
                                            ) : (
                                                <Tv className="w-5 h-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <span className="text-sm font-medium truncate flex-1 min-w-0">
                                            {item.name}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (activeId) toggleLive(item, activeId);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-yellow-500"
                                            aria-label="Remove from favorites"
                                        >
                                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </FavoriteSection>

                        <FavoriteSection
                            title="Movies"
                            icon={<Film className="w-4 h-4" />}
                            count={myVod.length}
                        >
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {myVod.map((item) => (
                                    <div
                                        key={item.stream_id}
                                        onClick={() => playMovie(item)}
                                        className="cursor-pointer group rounded-lg overflow-hidden border border-border bg-card hover:border-primary transition-colors relative"
                                    >
                                        <PosterFavoriteButton
                                            isFav={true}
                                            onClick={() => activeId && toggleVod(item, activeId)}
                                        />
                                        <div className="aspect-[2/3] bg-muted relative">
                                            {item.stream_icon ? (
                                                <img
                                                    src={item.stream_icon}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                                                    No Cover
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-2 truncate text-sm font-medium">
                                            {item.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </FavoriteSection>

                        <FavoriteSection
                            title="Series"
                            icon={<ListVideo className="w-4 h-4" />}
                            count={mySeries.length}
                        >
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {mySeries.map((item) => (
                                    <div
                                        key={item.series_id}
                                        onClick={() => setActiveSeries(item)}
                                        className="cursor-pointer group rounded-lg overflow-hidden border border-border bg-card hover:border-primary transition-colors relative"
                                    >
                                        <PosterFavoriteButton
                                            isFav={true}
                                            onClick={() => activeId && toggleSeries(item, activeId)}
                                        />
                                        <div className="aspect-[2/3] bg-muted relative">
                                            {item.cover ? (
                                                <img
                                                    src={item.cover}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                                                    No Cover
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-2 truncate text-sm font-medium">
                                            {item.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </FavoriteSection>
                    </>
                )}
            </div>

            {/* Player modals */}
            <PlayerModal
                url={
                    activeLive && activePlaylist?.type === "xtream"
                        ? buildStreamUrl(activePlaylist, activeLive.stream_id)
                        : activeLive?.url ?? null
                }
                title={activeLive?.name || "Live Stream"}
                icon={activeLive?.stream_icon}
                onClose={() => setActiveLive(null)}
            />

            <PlayerModal
                url={
                    activeMovie && activePlaylist?.type === "xtream"
                        ? buildStreamUrl(
                            activePlaylist,
                            activeMovie.stream_id,
                            "movie",
                            activeMovie.container_extension || "mp4",
                        )
                        : null
                }
                title={activeMovie?.name || "Movie"}
                icon={activeMovie?.stream_icon}
                onClose={() => setActiveMovie(null)}
            />

            {activeSeries && (
                <SeriesModal series={activeSeries} onClose={() => setActiveSeries(null)} />
            )}
        </div>
    );
}

function FavoriteSection({
                             title,
                             icon,
                             count,
                             children,
                         }: {
    title: string;
    icon: React.ReactNode;
    count: number;
    children: React.ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(true);

    if (count === 0) return null;

    return (
        <div className="border rounded-xl overflow-hidden bg-card/50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {isOpen ? (
                        <ChevronDown className="w-4 h-4" />
                    ) : (
                        <ChevronRight className="w-4 h-4" />
                    )}
                    <div className="flex items-center gap-2 font-semibold">
                        {icon} {title}
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                            {count}
                        </span>
                    </div>
                </div>
            </button>
            {isOpen && <div className="p-4 pt-0">{children}</div>}
        </div>
    );
}