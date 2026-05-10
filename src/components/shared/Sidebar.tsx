import { NavLink } from "react-router-dom";
import {Tv, Film, ListVideo, Settings, StarIcon} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
    { to: "/live", label: "Live TV", icon: Tv },
    { to: "/vod", label: "Movies", icon: Film },
    { to: "/series", label: "Series", icon: ListVideo },
    { to: "/favorites", label: "Favorites", icon: StarIcon }, // Moved above settings
    { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
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
        </aside>
    );
}