// src-tauri/src/m3u.rs
//
// Why this exists: the webview's fetch() is subject to CORS just like a browser.
// Most M3U hosts don't send Access-Control-Allow-Origin headers, so the request
// fails before we ever see the body. Rust has no such restriction — it's just
// an HTTP client.
//
// This command is intentionally dumb: fetch text, return text. Parsing happens
// in TypeScript with `iptv-playlist-parser`, where it already works. Don't move
// parsing to Rust unless you have a measured reason to.

use std::time::Duration;

#[tauri::command]
pub async fn fetch_m3u(url: String) -> Result<String, String> {
    // Build a client with sensible timeouts. M3U files can be large (10+ MB)
    // and providers can be slow, so we're generous — but not infinite.
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(60))
        .connect_timeout(Duration::from_secs(10))
        // Some providers reject requests without a UA. Pretend to be a normal client.
        .user_agent("Viewza/1.0")
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {e}"))?;

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Network error: {e}"))?;

    // Don't silently accept 404s, 403s, etc. — we'd parse the error page as M3U.
    if !response.status().is_success() {
        return Err(format!("HTTP {} from M3U host", response.status()));
    }

    response
        .text()
        .await
        .map_err(|e| format!("Failed to read body: {e}"))
}