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
    NotAuthenticated,

    #[error("parse error: {0}")]
    Parse(#[from] serde_json::Error),
}

impl serde::Serialize for XtreamError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.to_string())
    }
}

pub struct XtreamClient {
    http: Client,
}

// Helper to keep logging consistent across endpoints.
// Prints the first 500 chars of the response body when parsing fails,
// so you can see what the provider actually returned.
fn try_parse<T: serde::de::DeserializeOwned>(
    endpoint: &str,
    body: &str,
) -> Result<T, XtreamError> {
    match serde_json::from_str::<T>(body) {
        Ok(v) => Ok(v),
        Err(e) => {
            let preview: String = body.chars().take(500).collect();
            println!("[{endpoint}] parse error: {e}\nRaw body preview:\n{preview}");
            Err(XtreamError::Parse(e))
        }
    }
}

impl XtreamClient {
    pub fn new() -> Self {
        Self {
            http: Client::builder()
                .user_agent("IPTVSmartersPro")
                .timeout(std::time::Duration::from_secs(30))
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
            "http://{host}:{port}/player_api.php?username={}&password={}",
            encode(username),
            encode(password)
        );

        let body = self.http.get(&url).send().await?.text().await?;
        let parsed: LoginResponse = try_parse("login", &body)?;

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
        let body = self.http.get(&url).send().await?.text().await?;
        if body.trim().is_empty() {
            return Ok(Vec::new());
        }
        try_parse("get_live_categories", &body)
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
            url.push_str(&format!("&category_id={}", encode(cat)));
        }
        let body = self.http.get(&url).send().await?.text().await?;
        if body.trim().is_empty() {
            return Ok(Vec::new());
        }
        try_parse("get_live_streams", &body)
    }

    pub async fn get_vod_categories(
        &self,
        host: &str,
        port: u16,
        username: &str,
        password: &str,
    ) -> Result<Vec<Category>, XtreamError> {
        let url = format!(
            "http://{host}:{port}/player_api.php?username={username}&password={password}&action=get_vod_categories"
        );
        let body = self.http.get(&url).send().await?.text().await?;
        if body.trim().is_empty() {
            return Ok(Vec::new());
        }
        try_parse("get_vod_categories", &body)
    }

    pub async fn get_vod_streams(
        &self,
        host: &str,
        port: u16,
        username: &str,
        password: &str,
        category_id: Option<&str>,
    ) -> Result<Vec<VodStream>, XtreamError> {
        let mut url = format!(
            "http://{host}:{port}/player_api.php?username={username}&password={password}&action=get_vod_streams"
        );
        if let Some(cat) = category_id {
            url.push_str(&format!("&category_id={}", encode(cat)));
        }
        let body = self.http.get(&url).send().await?.text().await?;
        if body.trim().is_empty() {
            return Ok(Vec::new());
        }
        try_parse("get_vod_streams", &body)
    }

    pub async fn get_series_categories(
        &self,
        host: &str,
        port: u16,
        username: &str,
        password: &str,
    ) -> Result<Vec<Category>, XtreamError> {
        let url = format!(
            "http://{host}:{port}/player_api.php?username={username}&password={password}&action=get_series_categories"
        );
        let body = self.http.get(&url).send().await?.text().await?;
        if body.trim().is_empty() {
            return Ok(Vec::new());
        }
        try_parse("get_series_categories", &body)
    }

    pub async fn get_series(
        &self,
        host: &str,
        port: u16,
        username: &str,
        password: &str,
        category_id: Option<&str>,
    ) -> Result<Vec<SeriesItem>, XtreamError> {
        let mut url = format!(
            "http://{host}:{port}/player_api.php?username={username}&password={password}&action=get_series"
        );
        if let Some(cat) = category_id {
            url.push_str(&format!("&category_id={}", encode(cat)));
        }
        let body = self.http.get(&url).send().await?.text().await?;
        if body.trim().is_empty() {
            return Ok(Vec::new());
        }
        try_parse("get_series", &body)
    }

    pub async fn get_short_epg(
        &self,
        host: &str,
        port: u16,
        username: &str,
        password: &str,
        stream_id: i64,
    ) -> Result<EpgResponse, XtreamError> {
        let url = format!(
            "http://{host}:{port}/player_api.php?username={username}&password={password}&action=get_short_epg&stream_id={stream_id}&limit=10"
        );
        let body = self.http.get(&url).send().await?.text().await?;
        try_parse("get_short_epg", &body)
    }

    pub async fn get_series_info(
        &self,
        host: &str,
        port: u16,
        username: &str,
        password: &str,
        series_id: i64,
    ) -> Result<SeriesInfoResponse, XtreamError> {
        let url = format!(
            "http://{host}:{port}/player_api.php?username={username}&password={password}&action=get_series_info&series_id={series_id}"
        );
        let body = self.http.get(&url).send().await?.text().await?;
        try_parse("get_series_info", &body)
    }
}