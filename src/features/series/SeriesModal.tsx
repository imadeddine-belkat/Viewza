import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Play } from "lucide-react";
import { getSeriesInfo } from "@/lib/xtream/api";
import { usePlayMedia } from "@/features/player/usePlayMedia";
import type { SeriesItem } from "@/lib/xtream/types";

interface Props {
    series: SeriesItem;
    onClose: () => void;
}

export function SeriesModal({ series, onClose }: Props) {
    const { playEpisode } = usePlayMedia();

    const infoQuery = useQuery({
        queryKey: ["series-info", series.series_id],
        queryFn: () => getSeriesInfo(series.series_id),
    });

    const episodes = useMemo(() => {
        if (!infoQuery.data?.episodes) return [];
        const epsData = infoQuery.data.episodes;
        if (Array.isArray(epsData)) return [];

        const all: any[] = [];
        for (const seasonNum in epsData) {
            const seasonArray = epsData[seasonNum];
            if (Array.isArray(seasonArray)) {
                all.push(...seasonArray);
            }
        }
        return all;
    }, [infoQuery.data]);

    return (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 lg:p-12 backdrop-blur-sm">
            <div className="bg-card border border-border w-full max-w-5xl h-full max-h-[80vh] rounded-xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between p-4 border-b border-border bg-card">
                    <h2 className="text-xl font-bold">{series.name}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-accent rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {infoQuery.isLoading ? (
                        <div className="flex items-center justify-center h-full">Loading episodes…</div>
                    ) : (
                        <div className="space-y-2">
                            {episodes.length === 0 && (
                                <div className="text-center text-muted-foreground mt-10">
                                    No episodes found.
                                </div>
                            )}

                            {episodes.map((ep, idx) => (
                                <div
                                    key={ep.id || idx}
                                    onClick={() =>
                                        playEpisode(
                                            ep.id,
                                            ep.title || `Episode ${ep.episode_num}`,
                                            ep.container_extension,
                                        )
                                    }
                                    className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg hover:bg-accent cursor-pointer transition-colors group"
                                >
                                    <div className="flex-shrink-0 w-10 h-10 bg-primary/20 text-primary rounded flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <Play className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">
                                            S{ep.season} E{ep.episode_num} -{" "}
                                            {ep.title || `Episode ${ep.episode_num}`}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}