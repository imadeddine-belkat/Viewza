import { NavLink } from "react-router-dom";
import {Tv, Film, ListVideo, Settings, StarIcon, RefreshCw} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlatformStore } from '@/stores/platformStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const items = [
    { to: "/live", label: "Live TV", icon: Tv },
    { to: "/vod", label: "Movies", icon: Film },
    { to: "/series", label: "Series", icon: ListVideo },
    { to: "/favorites", label: "Favorites", icon: StarIcon }, // Moved above settings
    { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
    // Pull the new function and loading state from your store
    const refreshPlaylist = usePlatformStore(state => state.refreshPlaylist);
    const isRefreshing = usePlatformStore(state => state.isRefreshing);

    const handleRefresh = () => {
        // 2. You call the function empty, because the Rust backend already knows who is logged in!
        toast.promise(refreshPlaylist(), {
            loading: 'Refreshing playlist data...',
            success: 'Playlist updated successfully!',
            error: 'Failed to reach the provider. Try again later.',
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
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
            </Button>
            </div>
        </aside>
    );
}