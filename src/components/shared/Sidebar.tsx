import { NavLink } from "react-router-dom";
import { Tv, Film, ListVideo, Settings, StarIcon, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlatformStore } from "@/stores/platformStore";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { invalidateM3uCache } from "@/lib/playlistManager";

const allItems = [
    { to: "/live", label: "Live TV", icon: Tv, xtreamOnly: false },
    { to: "/vod", label: "Movies", icon: Film, xtreamOnly: true },
    { to: "/series", label: "Series", icon: ListVideo, xtreamOnly: true },
    { to: "/favorites", label: "Favorites", icon: StarIcon, xtreamOnly: false },
    { to: "/settings", label: "Settings", icon: Settings, xtreamOnly: false },
];

export function Sidebar() {
    const refreshPlaylist = usePlatformStore((s) => s.refreshPlaylist);
    const isRefreshing = usePlatformStore((s) => s.isRefreshing);
    const activePlaylist = useAuthStore((s) => s.activePlaylist);

    // Filter nav based on playlist type — M3U has no VOD/Series concept
    const items = allItems.filter(
        (item) => !item.xtreamOnly || activePlaylist?.type === "xtream",
    );

    const handleRefresh = () => {
        // M3U: clear the parse cache so next fetch hits the network
        if (activePlaylist?.type === "m3u") {
            invalidateM3uCache(activePlaylist.m3uUrl);
        }

        toast.promise(refreshPlaylist(), {
            loading: "Refreshing playlist data...",
            success: "Playlist updated successfully!",
            error: "Failed to reach the provider. Try again later.",
        });
    };

    return (
        <aside className="w-56 border-r border-border bg-card flex flex-col">
            <div className="p-6 font-bold text-xl tracking-tight">Viewza</div>
            <nav className="flex-1 px-3 space-y-1">
                {items.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                            )
                        }
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </NavLink>
                ))}
            </nav>
            <div className="mt-auto p-4 border-t border-border">
                <Button
                    variant="ghost"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="w-full flex items-center justify-start gap-3 text-muted-foreground hover:text-foreground"
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    <span>Refresh Data</span>
                </Button>
            </div>
        </aside>
    );
}