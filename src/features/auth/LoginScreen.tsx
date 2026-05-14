import { useState } from "react";
import { xtreamLogin } from "@/lib/tauri";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { MonitorPlay, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

import { useAuthStore } from "@/stores/authStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type TabType = "xtream" | "m3u";

interface XtreamForm {
    name: string;
    host: string;
    port: string;
    username: string;
    password: string;
}

interface M3UForm {
    name: string;
    m3uUrl: string;
}

const initialXtream: XtreamForm = {
    name: "",
    host: "",
    port: "80",
    username: "",
    password: "",
};

const initialM3U: M3UForm = {
    name: "",
    m3uUrl: "",
};

export function LoginScreen() {
    const addPlaylist = useAuthStore((s) => s.addPlaylist);
    const setActivePlaylist = useAuthStore((s) => s.setActivePlaylist);
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("xtream");

    // Separate state per tab — switching tabs no longer leaks data between them
    const [xtreamForm, setXtreamForm] = useState<XtreamForm>(initialXtream);
    const [m3uForm, setM3uForm] = useState<M3UForm>(initialM3U);

    const handleXtreamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setXtreamForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError(null);
    };

    const handleM3UChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setM3uForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError(null);
    };

    const handleTabChange = (val: string) => {
        setActiveTab(val as TabType);
        setError(null);
    };

    const handleXtreamSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const portNum = parseInt(xtreamForm.port, 10);
            if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
                throw new Error("Port must be between 1 and 65535");
            }

            // Strip http(s):// from host if user pasted a full URL
            const cleanHost = xtreamForm.host
                .trim()
                .replace(/^https?:\/\//, "")
                .replace(/\/$/, "");

            if (!cleanHost) throw new Error("Host is required");

            const response = await xtreamLogin({
                host: cleanHost,
                port: portNum,
                username: xtreamForm.username.trim(),
                password: xtreamForm.password,
            });

            const newId = crypto.randomUUID();
            addPlaylist({
                id: newId,
                name: xtreamForm.name.trim() || cleanHost,
                type: "xtream",
                host: cleanHost,
                port: portNum,
                username: xtreamForm.username.trim(),
                password: xtreamForm.password,
                status: response.user_info.status,
                maxConnections: parseInt(response.user_info.max_connections || "0"),
            });

            setActivePlaylist(newId);
            toast.success("Connected successfully");
            navigate("/live");
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleM3USubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const url = m3uForm.m3uUrl.trim();
            if (!url) throw new Error("M3U URL is required");

            // Basic URL sanity check
            try {
                new URL(url);
            } catch {
                throw new Error("Invalid URL format");
            }

            const newId = crypto.randomUUID();
            addPlaylist({
                id: newId,
                name: m3uForm.name.trim() || "M3U Playlist",
                type: "m3u",
                m3uUrl: url,
            });

            setActivePlaylist(newId);
            toast.success("Playlist added");
            navigate("/live");
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md bg-card border border-border p-8 rounded-2xl shadow-xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-primary/20 text-primary rounded-2xl flex items-center justify-center mb-4">
                        <MonitorPlay className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold">Welcome to Viewza</h1>
                    <p className="text-muted-foreground text-sm">Add your IPTV provider</p>
                </div>

                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6 h-10">
                        <TabsTrigger value="xtream" disabled={isLoading}>Xtream Codes</TabsTrigger>
                        <TabsTrigger value="m3u" disabled={isLoading}>M3U Playlist</TabsTrigger>
                    </TabsList>

                    {error && (
                        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span className="break-words">{error}</span>
                        </div>
                    )}

                    {/* XTREAM */}
                    <TabsContent value="xtream">
                        <form onSubmit={handleXtreamSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Playlist Name <span className="text-muted-foreground">(optional)</span></label>
                                <Input
                                    name="name"
                                    placeholder="My Provider"
                                    value={xtreamForm.name}
                                    onChange={handleXtreamChange}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="grid grid-cols-4 gap-3">
                                <div className="col-span-3 space-y-1">
                                    <label className="text-sm font-medium">Host</label>
                                    <Input
                                        name="host"
                                        placeholder="provider.com"
                                        value={xtreamForm.host}
                                        onChange={handleXtreamChange}
                                        disabled={isLoading}
                                        required
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="col-span-1 space-y-1">
                                    <label className="text-sm font-medium">Port</label>
                                    <Input
                                        name="port"
                                        type="number"
                                        min={1}
                                        max={65535}
                                        value={xtreamForm.port}
                                        onChange={handleXtreamChange}
                                        disabled={isLoading}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Username</label>
                                <Input
                                    name="username"
                                    value={xtreamForm.username}
                                    onChange={handleXtreamChange}
                                    disabled={isLoading}
                                    required
                                    autoComplete="username"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Password</label>
                                <div className="relative">
                                    <Input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={xtreamForm.password}
                                        onChange={handleXtreamChange}
                                        disabled={isLoading}
                                        required
                                        autoComplete="current-password"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((s) => !s)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        tabIndex={-1}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button type="submit" disabled={isLoading} className="w-full mt-6 h-12 text-base font-medium">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Connecting…
                                    </>
                                ) : (
                                    "Connect"
                                )}
                            </Button>
                        </form>
                    </TabsContent>

                    {/* M3U */}
                    <TabsContent value="m3u">
                        <form onSubmit={handleM3USubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Playlist Name <span className="text-muted-foreground">(optional)</span></label>
                                <Input
                                    name="name"
                                    placeholder="My M3U List"
                                    value={m3uForm.name}
                                    onChange={handleM3UChange}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">M3U URL</label>
                                <Input
                                    name="m3uUrl"
                                    type="url"
                                    placeholder="https://example.com/playlist.m3u"
                                    value={m3uForm.m3uUrl}
                                    onChange={handleM3UChange}
                                    disabled={isLoading}
                                    required
                                    autoComplete="off"
                                />
                                <p className="text-xs text-muted-foreground pt-1">
                                    The URL of your .m3u or .m3u8 playlist file.
                                </p>
                            </div>

                            <Button type="submit" disabled={isLoading} className="w-full mt-6 h-12 text-base font-medium">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Adding…
                                    </>
                                ) : (
                                    "Add Playlist"
                                )}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}