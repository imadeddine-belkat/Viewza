import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import App from "./App";
import "./App.css";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,        // 5 min — catalog doesn't change minute-to-minute
            refetchOnWindowFocus: false,     // desktop app, no need
            retry: 1,                        // fail fast for bad credentials
        },
    },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <App />
                <Toaster />
            </BrowserRouter>
        </QueryClientProvider>
    </React.StrictMode>,
);