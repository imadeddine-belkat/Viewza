use serde::{Deserialize, Serialize};

// --- SAFETY HELPERS ---

pub fn de_int_from_any<'de, D>(deserializer: D) -> Result<i64, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let v = serde_json::Value::deserialize(deserializer)?;
    match v {
        serde_json::Value::Number(n) => Ok(n.as_i64().unwrap_or(0)),
        serde_json::Value::String(s) => Ok(s.parse::<i64>().unwrap_or(0)),
        serde_json::Value::Bool(b) => Ok(if b { 1 } else { 0 }),
        _ => Ok(0),
    }
}

pub fn de_int_from_any_opt<'de, D>(deserializer: D) -> Result<Option<i64>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let v = serde_json::Value::deserialize(deserializer)?;
    match v {
        serde_json::Value::Null => Ok(None),
        serde_json::Value::Number(n) => Ok(n.as_i64()),
        serde_json::Value::String(s) => {
            if s.is_empty() { Ok(None) } else { Ok(s.parse::<i64>().ok()) }
        }
        _ => Ok(None),
    }
}

pub fn de_string_from_any<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let v = serde_json::Value::deserialize(deserializer)?;
    match v {
        serde_json::Value::String(s) => Ok(s),
        serde_json::Value::Number(n) => Ok(n.to_string()),
        serde_json::Value::Bool(b) => Ok(b.to_string()),
        serde_json::Value::Null => Ok(String::new()),
        _ => Ok(String::new()),
    }
}

pub fn de_string_from_any_opt<'de, D>(deserializer: D) -> Result<Option<String>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let v = serde_json::Value::deserialize(deserializer)?;
    match v {
        serde_json::Value::String(s) => Ok(Some(s)),
        serde_json::Value::Number(n) => Ok(Some(n.to_string())),
        serde_json::Value::Null => Ok(None),
        _ => Ok(None),
    }
}

// --- STRUCTS ---

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserInfo {
    #[serde(default, deserialize_with = "de_string_from_any")]
    pub username: String,
    #[serde(default, deserialize_with = "de_string_from_any")]
    pub password: String,
    #[serde(default, deserialize_with = "de_int_from_any")]
    pub auth: i64,
    #[serde(default, deserialize_with = "de_string_from_any")]
    pub status: String,
    #[serde(default)]
    pub exp_date: Option<String>,
    #[serde(default)]
    pub is_trial: Option<String>,
    #[serde(default)]
    pub active_cons: Option<String>,
    #[serde(default)]
    pub created_at: Option<String>,
    #[serde(default)]
    pub max_connections: Option<String>,
    #[serde(default)]
    pub allowed_output_formats: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServerInfo {
    #[serde(default)]
    pub url: String,
    #[serde(default)]
    pub port: String,
    #[serde(default)]
    pub https_port: String,
    #[serde(default)]
    pub server_protocol: String,
    #[serde(default)]
    pub timezone: String,
    #[serde(default)]
    pub time_now: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LoginResponse {
    pub user_info: UserInfo,
    pub server_info: ServerInfo,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Category {
    #[serde(deserialize_with = "de_string_from_any")]
    pub category_id: String,
    #[serde(deserialize_with = "de_string_from_any")]
    pub category_name: String,
    #[serde(default, deserialize_with = "de_int_from_any")]
    pub parent_id: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LiveStream {
    #[serde(default, deserialize_with = "de_int_from_any_opt")]
    pub num: Option<i64>,
    #[serde(default, deserialize_with = "de_string_from_any")]
    pub name: String,
    #[serde(default, deserialize_with = "de_string_from_any")]
    pub stream_type: String,
    #[serde(default, deserialize_with = "de_int_from_any")]
    pub stream_id: i64,
    #[serde(default, deserialize_with = "de_string_from_any")]
    pub stream_icon: String,
    #[serde(default, deserialize_with = "de_string_from_any_opt")]
    pub epg_channel_id: Option<String>,
    #[serde(default, deserialize_with = "de_string_from_any")]
    pub category_id: String,
    #[serde(default, deserialize_with = "de_int_from_any")]
    pub tv_archive: i64,
    #[serde(default, deserialize_with = "de_int_from_any")]
    pub tv_archive_duration: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VodStream {
    #[serde(default, deserialize_with = "de_int_from_any_opt")]
    pub num: Option<i64>,
    #[serde(default, deserialize_with = "de_string_from_any")]
    pub name: String,
    #[serde(default, deserialize_with = "de_string_from_any")]
    pub stream_type: String,
    #[serde(default, deserialize_with = "de_int_from_any")]
    pub stream_id: i64,
    #[serde(default, deserialize_with = "de_string_from_any")]
    pub stream_icon: String,
    #[serde(default, deserialize_with = "de_string_from_any")]
    pub category_id: String,
    #[serde(default, deserialize_with = "de_string_from_any")]
    pub container_extension: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SeriesItem {
    #[serde(default, deserialize_with = "de_int_from_any_opt")]
    pub num: Option<i64>,
    #[serde(default, deserialize_with = "de_string_from_any")]
    pub name: String,
    #[serde(default, deserialize_with = "de_int_from_any")]
    pub series_id: i64,
    #[serde(default, deserialize_with = "de_string_from_any")]
    pub cover: String,
    #[serde(default, deserialize_with = "de_string_from_any")]
    pub category_id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EpgListing {
    #[serde(default, deserialize_with = "de_string_from_any")]
    pub id: String,
    #[serde(default, deserialize_with = "de_string_from_any")]
    pub epg_id: String,
    #[serde(default, deserialize_with = "de_string_from_any")]
    pub title: String,
    #[serde(default, deserialize_with = "de_string_from_any")]
    pub start: String,
    #[serde(default, deserialize_with = "de_string_from_any")]
    pub end: String,
    #[serde(default, deserialize_with = "de_string_from_any")]
    pub description: String,
    #[serde(default, deserialize_with = "de_string_from_any")]
    pub start_timestamp: String,
    #[serde(default, deserialize_with = "de_string_from_any")]
    pub stop_timestamp: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EpgResponse {
    #[serde(default)]
    pub epg_listings: Vec<EpgListing>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SeriesInfoResponse {
    #[serde(default = "default_value")]
    pub episodes: serde_json::Value,
    #[serde(default = "default_value")]
    pub info: serde_json::Value,
    #[serde(default = "default_value")]
    pub seasons: serde_json::Value,
}

fn default_value() -> serde_json::Value {
    serde_json::Value::Null
}