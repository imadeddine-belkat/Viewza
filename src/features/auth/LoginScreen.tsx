import { useState } from "react";
import { xtreamLogin } from "@/lib/tauri";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { MonitorPlay } from "lucide-react";

import { useAuthStore } from "@/stores/authStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginScreen() {
    // Grab the new addPlaylist function!
    const addPlaylist = useAuthStore((s) => s.addPlaylist);
    const setActivePlaylist = useAuthStore((s) => s.setActivePlaylist);
    const navigate = useNavigate();
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

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const portNum = parseInt(formData.port, 10);
            if (isNaN(portNum)) throw new Error("Port must be a valid number");

            // Verify with Rust
            const response = await xtreamLogin({
                host: formData.host,
                port: portNum,
                username: formData.username,
                password: formData.password,
            });

            // Save to the Zustand playlist array
            const newId = crypto.randomUUID();
            addPlaylist({
                id: newId,
                name: formData.name || formData.host,
                host: formData.host,
                port: portNum,
                username: formData.username,
                password: formData.password,
                status: response.user_info.status,
                maxConnections: parseInt(response.user_info.max_connections || "0"),
            });

            // Explicitly activate the new playlist — don't rely on addPlaylist's first-one default
            setActivePlaylist(newId);

            toast.success("Logged in successfully!");
            navigate("/live");
        } catch (error) {
            toast.error(`Login failed: ${String(error)}`);
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
                    <p className="text-muted-foreground text-sm">Enter your Xtream Codes credentials</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Playlist Name (Optional)</label>
                        <Input name="name" placeholder="My Provider" value={formData.name} onChange={handleChange} />
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-3 space-y-1">
                            <label className="text-sm font-medium">Host URL</label>
                            <Input name="host" placeholder="myprovider.com" value={formData.host} onChange={handleChange} required />
                        </div>
                        <div className="col-span-1 space-y-1">
                            <label className="text-sm font-medium">Port</label>
                            <Input name="port" type="number" value={formData.port} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">Username</label>
                        <Input name="username" value={formData.username} onChange={handleChange} required />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">Password</label>
                        <Input name="password" type="password" value={formData.password} onChange={handleChange} required />
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full mt-4 h-12 text-lg">
                        {isLoading ? "Connecting..." : "Connect"}
                    </Button>
                </form>
            </div>
        </div>
    );
}