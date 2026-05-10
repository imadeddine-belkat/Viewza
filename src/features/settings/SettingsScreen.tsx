import { useState } from "react";
import { xtreamSetSession, xtreamLogin } from "@/lib/tauri";
import { open } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { Trash2, CheckCircle2, Plus, MonitorPlay } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { usePlatformStore } from "@/stores/platformStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useAuthStore } from "@/stores/authStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {useFavoriteStore} from "@/stores/favoriteStore.ts";

export function SettingsScreen() {
    const { playerType, setPlayerType, vlcPath, setVlcPath } = useSettingsStore();
    const { playlists, activeId, removePlaylist, setActivePlaylist } = useAuthStore();
    const [isAddingNew, setIsAddingNew] = useState(false);
    const isDesktop = usePlatformStore((s) => s.isDesktop);

    const pruneFavorites = useFavoriteStore((s) => s.pruneByPlaylist);

    const handleBrowseVlc = async () => {
        try {
            const selectedPath = await open({
                multiple: false,
                directory: false,
                title: "Select VLC Executable",
            });
            if (selectedPath && typeof selectedPath === "string") {
                setVlcPath(selectedPath);
            }
        } catch (err) {
            console.error("Failed to open dialog:", err);
        }
    };

    const queryClient = useQueryClient();

    // This is the magic function that switches playlists in Rust!
    const handleConnect = async (id: string) => {
        const targetPlaylist = playlists.find(p => p.id === id);
        if (!targetPlaylist) return;

        try {
            // 1. Switch Rust session
            await xtreamSetSession({
                host: targetPlaylist.host,
                port: targetPlaylist.port,
                username: targetPlaylist.username,
                password: targetPlaylist.password,
            });

            // 2. Switch active playlist in Zustand
            setActivePlaylist(id);

            // 3. Wipe React Query cache so screens refetch with new credentials
            queryClient.clear();

            toast.success(`Connected to ${targetPlaylist.name}`);
        } catch (error) {
            toast.error("Failed to connect to playlist.");
        }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage your player preferences and IPTV playlists.</p>
            </div>

            {/* --- PLAYER SETTINGS --- */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold border-b border-border pb-2">Video Player</h2>
                <div className="flex flex-col gap-4 p-4 bg-card border border-border rounded-lg">
                    <div className="flex gap-4">
                        <label className="flex items-start gap-3 cursor-pointer p-3 border rounded-md hover:bg-accent transition-colors flex-1">
                            <input
                                type="radio"
                                name="playerType"
                                value="artplayer"
                                checked={playerType === "artplayer"}
                                onChange={() => setPlayerType("artplayer")}
                                className="w-4 h-4 mt-1"
                            />
                            <div>
                                <div className="font-medium">Web Player (Artplayer)</div>
                                <div className="text-xs text-muted-foreground">Best for seamless UI. Fails on 4K/Dolby.</div>
                            </div>
                        </label>

                        {isDesktop && (
                            <label className="flex items-start gap-3 cursor-pointer p-3 border rounded-md hover:bg-accent transition-colors flex-1">
                                <input
                                    type="radio"
                                    name="playerType"
                                    value="vlc"
                                    checked={playerType === "vlc"}
                                    onChange={() => setPlayerType("vlc")}
                                    className="w-4 h-4 mt-1"
                                />
                                <div>
                                    <div className="font-medium">Native VLC Player</div>
                                    <div className="text-xs text-muted-foreground">Opens the VLC desktop app. Best for 4K.</div>
                                </div>
                            </label>
                        )}
                    </div>

                    {isDesktop && playerType === "vlc" && (
                        <div className="pt-2 space-y-2">
                            <label className="text-sm font-medium">Custom VLC Path (Optional)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={vlcPath}
                                    onChange={(e) => setVlcPath(e.target.value)}
                                    placeholder="e.g. C:\Program Files\VideoLAN\VLC\vlc.exe"
                                    className="flex-1 p-2 bg-background border border-input rounded-md text-sm"
                                />
                                <button
                                    onClick={handleBrowseVlc}
                                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/80 transition-colors"
                                >
                                    Browse...
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- PLAYLIST MANAGEMENT --- */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                    <h2 className="text-xl font-semibold">IPTV Playlists</h2>
                    <Button variant="outline" size="sm" onClick={() => setIsAddingNew(!isAddingNew)}>
                        <Plus className="w-4 h-4 mr-2" /> Add Playlist
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Existing Playlists */}
                    {playlists.map((pl) => (
                        <div
                            key={pl.id}
                            className={`p-4 rounded-xl border flex flex-col justify-between ${
                                activeId === pl.id ? "border-primary bg-primary/5" : "border-border bg-card"
                            }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        <MonitorPlay className="w-5 h-5 text-muted-foreground" />
                                        {pl.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1">Host: {pl.host}:{pl.port}</p>
                                    <p className="text-xs text-muted-foreground">User: {pl.username}</p>
                                </div>
                                {activeId === pl.id && (
                                    <span className="flex items-center gap-1 text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-medium">
                                        <CheckCircle2 className="w-3 h-3" /> Active
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-2 mt-auto">
                                <Button
                                    className="flex-1"
                                    variant={activeId === pl.id ? "secondary" : "default"}
                                    onClick={() => handleConnect(pl.id)}
                                    disabled={activeId === pl.id}
                                >
                                    {activeId === pl.id ? "Connected" : "Connect"}
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => {
                                        pruneFavorites(pl.id);
                                        removePlaylist(pl.id);
                                        toast.info(`Deleted ${pl.name}`);
                                    }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {/* Add New Playlist Form */}
                    {isAddingNew && (
                        <div className="p-4 rounded-xl border border-primary/50 bg-card">
                            <XtreamSettingsForm onSuccess={() => setIsAddingNew(false)} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- SUB-COMPONENT: ADD PLAYLIST FORM ---
export function XtreamSettingsForm({ onSuccess }: { onSuccess?: () => void }) {
    // 1. Grab addPlaylist instead of setProfile!
    const addPlaylist = useAuthStore((s) => s.addPlaylist);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        host: "",
        port: "80",
        username: "",
        password: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const portNum = parseInt(formData.port, 10);
            if (isNaN(portNum)) throw new Error("Port must be a valid number");

            // Verify credentials with Rust
            const response = await xtreamLogin({
                host: formData.host,
                port: portNum,
                username: formData.username,
                password: formData.password,
            });

            // 2. Add to the new Zustand array!
            addPlaylist({
                id: crypto.randomUUID(), // Generate unique ID
                name: formData.name || formData.host, // Fallback to host if no name provided
                host: formData.host,
                port: portNum,
                username: formData.username,
                password: formData.password,
                status: response.user_info.status,
                maxConnections: parseInt(response.user_info.max_connections || "0"),
            });

            toast.success("Playlist added successfully!");
            if (onSuccess) onSuccess(); // Close form if it's in a modal/toggle
        } catch (error) {
            toast.error(`Failed to verify: ${String(error)}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-4 flex flex-col h-full bg-card border border-border p-4 rounded-xl">
            <h3 className="font-semibold text-sm">Add New Credentials</h3>

            <div className="space-y-1">
                <label className="text-xs font-medium">Playlist Name</label>
                <Input name="name" placeholder="e.g. My Premium IPTV" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-4 gap-2">
                <div className="col-span-3 space-y-1">
                    <label className="text-xs font-medium">Host / URL</label>
                    <Input name="host" placeholder="myprovider.com" value={formData.host} onChange={handleChange} required />
                </div>
                <div className="col-span-1 space-y-1">
                    <label className="text-xs font-medium">Port</label>
                    <Input name="port" type="number" value={formData.port} onChange={handleChange} required />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <label className="text-xs font-medium">Username</label>
                    <Input name="username" value={formData.username} onChange={handleChange} required />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium">Password</label>
                    <Input name="password" type="password" value={formData.password} onChange={handleChange} required />
                </div>
            </div>

            <div className="mt-auto pt-2 flex gap-2">
                {onSuccess && (
                    <Button type="button" variant="ghost" className="flex-1" onClick={onSuccess}>Cancel</Button>
                )}
                <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? "Checking..." : "Add & Connect"}
                </Button>
            </div>
        </form>
    );
}