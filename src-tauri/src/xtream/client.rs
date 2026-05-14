use crate::xtream::types::{
    Category, LiveStream, LoginResponse, VodStream, SeriesItem, EpgResponse, SeriesInfoResponse
};
use reqwest::Client;
use thiserror::Error;
use urlencoding::encode;

#[derive(Debug, Error)]
pub enum XtreamError {
    #[error("network error: {0}")]
    Network(#[from] reqwest::Error),

    #[error("invalid url: {0}")]
    InvalidUrl(String),

    #[error("authentication failed")]
    AuthFailed,

    #[error("not authenticated")]
    NotAuthenticated,    // ← new

    #[error("parse error: {0}")]
    Parse(#[from] serde_json::Error),
}

// Tauri commands return Results that need to serialize to JS.
// String error type keeps things simple on the TS side.
impl serde::Serialize for XtreamError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.to_string())
    }
}

pub struct XtreamClient {
    http: Client,
}

impl XtreamClient {
    pub fn new() -> Self {
        Self {
            http: Client::builder()
            .user_agent("IPTVSmartersPro") // <-- Pretend to be IPTV Smarters
            .timeout(std::time::Duration::from_secs(15))
            .build()
            .expect("reqwest client builds"),
        }
    }

    pub async fn login(
        &self,
        host: &str,
        port: u16,
        username: &str,
        password: &str,
    ) -> Result<LoginResponse, XtreamError> {
        let url = format!(
            "http://{host}:{port}/player_api.php?username={}&password={}&action=get_live_categories",
            encode(username),
            encode(password)
        );

        let resp = self.http.get(&url).send().await?;
        let body = resp.text().await?;

        let parsed: LoginResponse = serde_json::from_str(&body)?;

        if parsed.user_info.auth != 1 {
            return Err(XtreamError::AuthFailed);
        }

        Ok(parsed)
    }

    pub async fn get_live_categories(
            &self,
            host: &str,
            port: u16,
            username: &str,
            password: &str,
        ) -> Result<Vec<Category>, XtreamError> {
            let url = format!(
                "http://{host}:{port}/player_api.php?username={username}&password={password}&action=get_live_categories"
            );

            let resp = self.http.get(&url).send().await?;
            let body = resp.text().await?;

            // 1. Check if the body is completely empty
            if body.trim().is_empty() {
                println!("Xtream warning: server returned empty body for live categories");
                return Ok(Vec::new()); // Return empty list instead of crashing
            }

            // 2. Attempt to parse, but print the raw body if it fails
            match serde_json::from_str::<Vec<Category>>(&body) {
                Ok(parsed) => Ok(parsed),
                Err(e) => {
                    println!("Xtream parse error! Raw response body:\n{}", body);
                    Err(XtreamError::Parse(e))
                }
            }
        }

    pub async fn get_live_streams(
        &self,
        host: &str,
        port: u16,
        username: &str,
        password: &str,
        category_id: Option<&str>,
    ) -> Result<Vec<LiveStream>, XtreamError> {
        let mut url = format!(
            "http://{host}:{port}/player_api.php?username={username}&password={password}&action=get_live_streams"
        );
        if let Some(cat) = category_id {
            url.push_str(&format!("&category_id={}", cat));
        }

        let resp = self.http.get(&url).send().await?;
        let body = resp.text().await?;

        let parsed: Vec<LiveStream> = serde_json::from_str(&body)?;
        Ok(parsed)
    }

    pub async fn get_vod_categories(
            &self, host: &str, port: u16, username: &str, password: &str,
        ) -> Result<Vec<Category>, XtreamError> {
            let url = format!("http://{host}:{port}/player_api.php?username={username}&password={password}&action=get_vod_categories");
            let resp = self.http.get(&url).send().await?;
            Ok(serde_json::from_str(&resp.text().await?)?)
        }

        pub async fn get_vod_streams(
            &self, host: &str, port: u16, username: &str, password: &str, category_id: Option<&str>,
        ) -> Result<Vec<VodStream>, XtreamError> {
            let mut url = format!("http://{host}:{port}/player_api.php?username={username}&password={password}&action=get_vod_streams");
            if let Some(cat) = category_id { url.push_str(&format!("&category_id={}", cat)); }
            let resp = self.http.get(&url).send().await?;
            Ok(serde_json::from_str(&resp.text().await?)?)
        }

        pub async fn get_series_categories(
            &self, host: &str, port: u16, username: &str, password: &str,
        ) -> Result<Vec<Category>, XtreamError> {
            let url = format!("http://{host}:{port}/player_api.php?username={username}&password={password}&action=get_series_categories");
            let resp = self.http.get(&url).send().await?;
            Ok(serde_json::from_str(&resp.text().await?)?)
        }

        pub async fn get_series(
            &self, host: &str, port: u16, username: &str, password: &str, category_id: Option<&str>,
        ) -> Result<Vec<SeriesItem>, XtreamError> {
            let mut url = format!("http://{host}:{port}/player_api.php?username={username}&password={password}&action=get_series");
            if let Some(cat) = category_id { url.push_str(&format!("&category_id={}", cat)); }
            let resp = self.http.get(&url).send().await?;
            Ok(serde_json::from_str(&resp.text().await?)?)
        }

        pub async fn get_short_epg(
            &self, host: &str, port: u16, username: &str, password: &str, stream_id: i64,
        ) -> Result<EpgResponse, XtreamError> {
            let url = format!(
                "http://{host}:{port}/player_api.php?username={username}&password={password}&action=get_short_epg&stream_id={stream_id}&limit=10"
            );
            let resp = self.http.get(&url).send().await?;
            Ok(serde_json::from_str(&resp.text().await?)?)
        }

            /// Fetches all Seasons and Episodes for a specific TV Series
        pub async fn get_series_info(
            &self, host: &str, port: u16, username: &str, password: &str, series_id: i64,
        ) -> Result<SeriesInfoResponse, XtreamError> {
            let url = format!(
                "http://{host}:{port}/player_api.php?username={username}&password={password}&action=get_series_info&series_id={series_id}"
            );
            let resp = self.http.get(&url).send().await?;
            Ok(serde_json::from_str(&resp.text().await?)?)
        }
}