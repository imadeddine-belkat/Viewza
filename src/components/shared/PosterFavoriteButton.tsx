import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    isFav: boolean;
    onClick: () => void;
    className?: string;
}

/**
 * Star button overlaid on poster cards (movies, series).
 * Always visible if favorited; only on hover otherwise.
 */
export function PosterFavoriteButton({ isFav, onClick, className }: Props) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={cn(
                "absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/60 backdrop-blur-sm transition-all",
                isFav
                    ? "opacity-100 text-yellow-500"
                    : "opacity-0 group-hover:opacity-100 text-white hover:text-yellow-500",
                className,
            )}
            aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
        >
            <Star className={cn("w-4 h-4", isFav && "fill-yellow-500")} />
        </button>
    );
}