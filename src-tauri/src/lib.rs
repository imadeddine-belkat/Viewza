mod state;
mod xtream;
mod proxy;

use state::{AppState, AppStateInner, Session};
use xtream::client::{XtreamClient, XtreamError};
use xtream::types::LoginResponse;

#[tauri::command]
async fn xtream_login(
    host: String,
    port: u16,
    username: String,
    password: String,
    state: tauri::State<'_, AppState>,
) -> Result<LoginResponse, XtreamError> {
    let client = XtreamClient::new();
    let response = client.login(&host, port, &username, &password).await?;

    // On success, persist credentials in app state for subsequent calls
    let mut guard = state.lock().await;
    guard.session = Some(Session {
        host,
        port,
        username,
        password,
    });

    Ok(response)
}

/// Called by the frontend on app startup if a profile is already persisted in Zustand,
/// so Rust knows about the existing session without requiring a fresh login.
#[tauri::command]
async fn xtream_set_session(
    host: String,
    port: u16,
    username: String,
    password: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let mut guard = state.lock().await;
    guard.session = Some(Session {
        host,
        port,
        username,
        password,
    });
    Ok(())
}

/// Clear session on logout.
#[tauri::command]
async fn xtream_clear_session(state: tauri::State<'_, AppState>) -> Result<(), String> {
    let mut guard = state.lock().await;
    guard.session = None;
    Ok(())
}

#[tauri::command]
async fn xtream_get_live_categories(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<xtream::types::Category>, XtreamError> {
    // Snapshot the session, drop the lock before the HTTP call
    let session = {
        let guard = state.lock().await;
        guard
            .session
            .clone()
            .ok_or(XtreamError::NotAuthenticated)?
    };

    let client = XtreamClient::new();
    client
        .get_live_categories(&session.host, session.port, &session.username, &session.password)
        .await
}

#[tauri::command]
fn play_in_vlc(url: String, vlc_path: Option<String>) -> Result<(), String> {
    let mut spawned = false;

    // 1. If the user provided a custom path, try it first!
    if let Some(custom_path) = vlc_path {
        if !custom_path.is_empty() {
            if std::process::Command::new(&custom_path).arg(&url).spawn().is_ok() {
                return Ok(()); // Success! Custom path worked.
            } else {
                eprintln!("Failed to launch VLC from custom path: {}", custom_path);
                // We don't error out yet; we fall through to the default paths below
            }
        }
    }

    // 2. Fallback: Look for VLC in common OS installation paths
    #[cfg(target_os = "windows")]
    let default_paths = [
        "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe",
        "C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe",
        "vlc"
    ];

    #[cfg(target_os = "macos")]
    let default_paths = ["/Applications/VLC.app/Contents/MacOS/VLC", "vlc"];

    #[cfg(target_os = "linux")]
    let default_paths = ["vlc"];

    for path in default_paths.iter() {
        if std::process::Command::new(path).arg(&url).spawn().is_ok() {
            spawned = true;
            break;
        }
    }

    if !spawned {
        return Err("Could not launch VLC. Check your custom path in Settings or ensure VLC is installed.".into());
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|_app| {
            tauri::async_runtime::spawn(async {
                proxy::start_proxy().await;
            });
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage::<AppState>(AppState::new(AppStateInner::default()))
        .invoke_handler(tauri::generate_handler![
                    xtream_login,
                    xtream_set_session,
                    xtream_clear_session,
                    xtream_get_live_categories,
                    xtream_get_live_streams,
                    xtream_get_vod_categories,
                    xtream_get_vod_streams,
                    xtream_get_series_categories,
                    xtream_get_series,
                    xtream_get_series_info,
                    xtream_get_short_epg,
                    play_in_vlc,
                ])
                .run(tauri::generate_context!())
                .expect("error while running tauri application");
}

#[tauri::command]
async fn xtream_get_live_streams(
    category_id: Option<String>,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<xtream::types::LiveStream>, XtreamError> {
    let session = {
        let guard = state.lock().await;
        guard
            .session
            .clone()
            .ok_or(XtreamError::NotAuthenticated)?
    };

    let client = XtreamClient::new();
    client
        .get_live_streams(
            &session.host,
            session.port,
            &session.username,
            &session.password,
            category_id.as_deref(),
        )
        .await
}

#[tauri::command]
async fn xtream_get_vod_categories(state: tauri::State<'_, AppState>) -> Result<Vec<xtream::types::Category>, String> {
    let session = state.lock().await.session.clone().ok_or("Not auth")?;
    XtreamClient::new().get_vod_categories(&session.host, session.port, &session.username, &session.password).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn xtream_get_vod_streams(category_id: Option<String>, state: tauri::State<'_, AppState>) -> Result<Vec<xtream::types::VodStream>, String> {
    let session = state.lock().await.session.clone().ok_or("Not auth")?;
    XtreamClient::new().get_vod_streams(&session.host, session.port, &session.username, &session.password, category_id.as_deref()).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn xtream_get_short_epg(stream_id: i64, state: tauri::State<'_, AppState>) -> Result<xtream::types::EpgResponse, String> {
    let session = state.lock().await.session.clone().ok_or("Not auth")?;
    XtreamClient::new().get_short_epg(&session.host, session.port, &session.username, &session.password, stream_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn xtream_get_series_info(series_id: i64, state: tauri::State<'_, AppState>) -> Result<xtream::types::SeriesInfoResponse, String> {
    let session = state.lock().await.session.clone().ok_or("Not auth")?;
    XtreamClient::new().get_series_info(&session.host, session.port, &session.username, &session.password, series_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn xtream_get_series_categories(state: tauri::State<'_, AppState>) -> Result<Vec<xtream::types::Category>, String> {
    let session = state.lock().await.session.clone().ok_or("Not auth")?;
    XtreamClient::new().get_series_categories(&session.host, session.port, &session.username, &session.password).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn xtream_get_series(category_id: Option<String>, state: tauri::State<'_, AppState>) -> Result<Vec<xtream::types::SeriesItem>, String> {
    let session = state.lock().await.session.clone().ok_or("Not auth")?;
    XtreamClient::new().get_series(&session.host, session.port, &session.username, &session.password, category_id.as_deref()).await.map_err(|e| e.to_string())
}