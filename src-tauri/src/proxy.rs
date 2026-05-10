use axum::{
    extract::Query,
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::get,
    Router,
};
use std::process::Stdio;
use tokio::process::Command;
use tokio_util::io::ReaderStream;
use tower_http::cors::CorsLayer;

#[derive(serde::Deserialize)]
pub struct ProxyQuery {
    pub url: String,
}

pub async fn start_proxy() {
    let app = Router::new()
        .route("/proxy", get(proxy_handler))
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind("127.0.0.1:1421").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn proxy_handler(Query(params): Query<ProxyQuery>) -> impl IntoResponse {
    // We use tokio::process::Command to spawn an FFmpeg process
    let mut child = match Command::new("ffmpeg")
        .arg("-user_agent")
        .arg("VLC/3.0.9 LibVLC/3.0.9") // Keep our VLC spoofing!
        .arg("-i")
        .arg(&params.url)              // The IPTV Stream
        .arg("-c:v")
        .arg("copy")                   // COPY the video (crucial: avoids massive CPU usage)
        .arg("-c:a")
        .arg("aac")                    // TRANSCODE the audio to web-safe AAC
        .arg("-b:a")
        .arg("192k")                   // Audio bitrate
        .arg("-f")
        .arg("mpegts")                 // Output format is still MPEG-TS
        .arg("pipe:1")                 // Pipe the output to stdout
        .stdout(Stdio::piped())
        .stderr(Stdio::null())         // Hide FFmpeg logs
        .spawn()
    {
        Ok(child) => child,
        Err(e) => {
            eprintln!("Failed to spawn ffmpeg. Is it installed? {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, "FFmpeg failed").into_response();
        }
    };

    // Grab the stdout pipe from FFmpeg
    let stdout = child.stdout.take().expect("Failed to open stdout");

    // Convert the pipe into an async stream Axum can read
    let stream = ReaderStream::new(stdout);
    let body = axum::body::Body::from_stream(stream);

    let mut headers = HeaderMap::new();
    headers.insert("content-type", "video/mp2t".parse().unwrap());

    (StatusCode::OK, headers, body).into_response()
}