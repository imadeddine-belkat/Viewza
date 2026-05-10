import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Category } from "@/lib/xtream/types";
import { ALL_CATEGORIES_ID } from "@/lib/xtream/constants";
import { cn } from "@/lib/utils";

interface Props {
    categories: Category[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    /** Label shown next to the "All" pseudo-category. e.g. "All Channels" / "All Movies" */
    allLabel?: string;
}

export function CategoryList({
                                 categories,
                                 selectedId,
                                 onSelect,
                                 allLabel = "All",
                             }: Props) {
    const [search, setSearch] = useState("");
    const parentRef = useRef<HTMLDivElement>(null);

    const filtered = useMemo(() => {
        if (!search.trim()) return categories;
        const q = search.toLowerCase();
        return categories.filter((c) =>
            c.category_name.toLowerCase().includes(q),
        );
    }, [categories, search]);

    const virtualizer = useVirtualizer({
        count: filtered.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 36,
        overscan: 8,
    });

    return (
        <div className="flex flex-col h-full border-r border-border bg-card">
            <div className="p-3 border-b border-border">
                <div className="relative">
                    <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search categories…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 h-8"
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    {filtered.length} of {categories.length}
                </p>
            </div>

            {/* Pinned "All" pseudo-category */}
            <button
                onClick={() => onSelect(ALL_CATEGORIES_ID)}
                className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm border-b border-border transition-colors",
                    selectedId === ALL_CATEGORIES_ID
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-accent/50",
                )}
            >
                <LayoutGrid className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium truncate">{allLabel}</span>
            </button>

            <div ref={parentRef} className="flex-1 overflow-auto">
                <div
                    style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        width: "100%",
                        position: "relative",
                    }}
                >
                    {virtualizer.getVirtualItems().map((vRow) => {
                        const cat = filtered[vRow.index];
                        return (
                            <button
                                key={cat.category_id}
                                onClick={() => onSelect(cat.category_id)}
                                className={cn(
                                    "absolute top-0 left-0 w-full text-left px-3 py-2 text-sm truncate transition-colors",
                                    selectedId === cat.category_id
                                        ? "bg-accent text-accent-foreground"
                                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                                )}
                                style={{
                                    height: `${vRow.size}px`,
                                    transform: `translateY(${vRow.start}px)`,
                                }}
                                title={cat.category_name}
                            >
                                {cat.category_name}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}