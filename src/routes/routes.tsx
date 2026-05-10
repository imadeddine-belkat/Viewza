import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import { AppShell } from "@/components/shared/AppShell";
import { LoginScreen } from "@/features/auth/LoginScreen";
import { LiveScreen } from "@/features/live/LiveScreen";
import { VodScreen } from "@/features/vod/VodScreen";
import { SeriesScreen } from "@/features/series/SeriesScreen";
import { SettingsScreen } from "@/features/settings/SettingsScreen";
import { useAuthStore } from "@/stores/authStore";
import {FavoritesScreen} from "@/features/favorites/FavoritesScreen.tsx";

function ProtectedRoute() {
    const profile = useAuthStore((s) => s.profile);
    if (!profile) return <Navigate to="/login" replace />;
    return <Outlet />;
}

export function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route element={<ProtectedRoute />}>
                <Route element={<AppShell />}>
                    <Route path="/" element={<Navigate to="/live" replace />} />
                    <Route path="/live" element={<LiveScreen />} />
                    <Route path="/vod" element={<VodScreen />} />
                    <Route path="/series" element={<SeriesScreen />} />
                    <Route path="/settings" element={<SettingsScreen />} />
                    <Route path="/favorites" element={<FavoritesScreen />} />
                </Route>
            </Route>
        </Routes>
    );
}