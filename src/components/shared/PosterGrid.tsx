import { VirtuosoGrid } from "react-virtuoso";
import { PosterFavoriteButton } from "./PosterFavoriteButton";
import { cn } from "@/lib/utils";

export interface PosterItem {
    id: string | number;       // unique key
    title: string;
    image?: string;             // poster URL
    isFav: boolean;
}

interface Props<T extends PosterItem> {
    items: T[];
    onClick: (item: T) => void;
    onToggleFav: (item: T) => void;
    /** Optional: custom subtitle below the title */
    renderSubtitle?: (item: T) => React.ReactNode;
}

export function PosterGrid<T extends PosterItem>({
                                                     items,
                                                     onClick,
                                                     onToggleFav,
                                                     renderSubtitle,
                                                 }: Props<T>) {
    return (
        <VirtuosoGrid
            style={{ height: "100%" }}
            totalCount={items.length}
            overscan={400}      // pixels of buffer above/below viewport
            listClassName="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4"
            itemContent={(index) => {
                const item = items[index];
                if (!item) return null;
                return (
                    <PosterCard
                        item={item}
                        onClick={() => onClick(item)}
                        onToggleFav={() => onToggleFav(item)}
                        subtitle={renderSubtitle?.(item)}
                    />
                );
            }}
        />
    );
}

interface CardProps<T extends PosterItem> {
    item: T;
    onClick: () => void;
    onToggleFav: () => void;
    subtitle?: React.ReactNode;
}

function PosterCard<T extends PosterItem>({
                                              item,
                                              onClick,
                                              onToggleFav,
                                              subtitle,
                                          }: CardProps<T>) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "cursor-pointer group rounded-lg overflow-hidden",
                "border border-border bg-card relative",
                "hover:border-primary transition-colors",
            )}
        >
            <PosterFavoriteButton isFav={item.isFav} onClick={onToggleFav} />
            <div className="aspect-[2/3] bg-muted relative">
                {item.image ? (
                    <img
                        src={item.image}
                        alt={item.title}
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
                {item.title}
            </div>
            {subtitle && (
                <div className="px-2 pb-2 text-xs text-muted-foreground truncate">
                    {subtitle}
                </div>
            )}
        </div>
    );
}