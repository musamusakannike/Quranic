use reqwest::Client;
use std::time::Duration;
use tauri::State;

pub struct HttpState {
    pub client: Client,
}

impl HttpState {
    pub fn new() -> Self {
        let client = Client::builder()
            .user_agent("QuranicDesktop/1.0 (+https://github.com/musamusakannike/Quranic)")
            .timeout(Duration::from_secs(30))
            .connect_timeout(Duration::from_secs(10))
            .build()
            .expect("failed to build reqwest client");
        Self { client }
    }
}

impl Default for HttpState {
    fn default() -> Self {
        Self::new()
    }
}

/// Perform a Rust-side HTTP GET returning UTF-8 text.
/// Bypasses webview CORS restrictions for third-party APIs.
#[tauri::command]
pub async fn http_get_text(url: String, state: State<'_, HttpState>) -> Result<String, String> {
    if !url.starts_with("https://") && !url.starts_with("http://") {
        return Err("Only http/https URLs are supported".to_string());
    }
    let resp = state
        .client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Network request failed: {e}"))?;

    let status = resp.status();
    if !status.is_success() {
        return Err(format!("HTTP error {}", status.as_u16()));
    }
    resp.text()
        .await
        .map_err(|e| format!("Failed to read response body: {e}"))
}
