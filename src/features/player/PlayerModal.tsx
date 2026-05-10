import { useEffect } from "react";
import { X } from "lucide-react";
import { useArtPlayer } from "./useArtPlayer";
import { toast } from "sonner";

interface Props {
    url: string | null;
    title: string;
    subtitle?: string;
    icon?: string;
    onClose: () => void;
}

const ART_CONTAINER_ID = "art-player-container";

export function PlayerModal({ url, title, subtitle, icon, onClose }: Props) {
    useArtPlayer({
        containerId: ART_CONTAINER_ID,
        url,
        onError: (msg) => toast.error(msg),
    });

    // Close on Escape
    useEffect(() => {
        if (!url) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [url, onClose]);

    if (!url) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
                <div className="flex items-center gap-3 min-w-0">
                    {icon && (
                        <img
                            src={icon}
                            alt=""
                            className="w-8 h-8 object-contain flex-shrink-0"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                            {subtitle || "Video on Demand"}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-md hover:bg-accent transition-colors"
                    aria-label="Close player"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
                <div
                    id={ART_CONTAINER_ID}
                    className="w-full h-full max-w-7xl"
                />
            </div>
        </div>
    );
}