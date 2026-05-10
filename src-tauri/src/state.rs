use tokio::sync::Mutex;

#[derive(Debug, Clone)]
pub struct Session {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Default)]
pub struct AppStateInner {
    pub session: Option<Session>,
}

pub type AppState = Mutex<AppStateInner>;