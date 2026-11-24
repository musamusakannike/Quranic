use futures_util::StreamExt;
use reqwest::Client;
use serde::Serialize;
use std::collections::HashMap;
use std::path::{Component, Path, PathBuf};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::fs;
use tokio::io::AsyncWriteExt;
use tokio::sync::{watch, Mutex};

use crate::http_proxy::HttpState;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgressPayload {
    pub id: String,
    pub received_bytes: u64,
    pub total_bytes: Option<u64>,
    pub progress: f64,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadResult {
    pub id: String,
    pub path: String,
    pub bytes: u64,
}

pub struct DownloadManager {
    active: Arc<Mutex<HashMap<String, watch::Sender<bool>>>>,
}

impl DownloadManager {
    pub fn new() -> Self {
        Self {
            active: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

impl Default for DownloadManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Sanitize a relative path so it cannot escape the app data root.
pub fn safe_join_relative(base: &Path, relative: &str) -> Result<PathBuf, String> {
    let rel_path = Path::new(relative);
    if rel_path.is_absolute() {
        return Err("Relative path must not be absolute".to_string());
    }
    let mut clean = PathBuf::new();
    for comp in rel_path.components() {
        match comp {
            Component::Normal(p) => clean.push(p),
            Component::CurDir => {}
            _ => return Err("Path traversal components are not allowed".to_string()),
        }
    }
    if clean.as_os_str().is_empty() {
        return Err("Relative path must not be empty".to_string());
    }
    Ok(base.join(clean))
}

/// Compute progress ratio safely, guarding against division by zero.
pub fn compute_progress(received: u64, total: Option<u64>) -> f64 {
    match total {
        Some(t) if t > 0 => (received as f64 / t as f64).clamp(0.0, 1.0),
        _ => 0.0,
    }
}

/// Core streaming download logic with cancellation and `.part` cleanup.
pub async fn stream_download_to_path<F>(
    client: &Client,
    url: &str,
    dest: &Path,
    mut cancel_rx: watch::Receiver<bool>,
    mut on_progress: F,
) -> Result<u64, String>
where
    F: FnMut(u64, Option<u64>, f64),
{
    if let Some(parent) = dest.parent() {
        fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("Failed to create destination directory: {e}"))?;
    }

    let part_path = dest.with_extension(format!(
        "{}.part",
        dest.extension().and_then(|s| s.to_str()).unwrap_or("bin")
    ));

    let resp = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Failed to connect: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!("HTTP error {}", resp.status().as_u16()));
    }

    let total_bytes = resp.content_length().filter(|&n| n > 0);
    let mut file = fs::File::create(&part_path)
        .await
        .map_err(|e| format!("Failed to create temp file: {e}"))?;

    let mut stream = resp.bytes_stream();
    let mut received: u64 = 0;

    while let Some(chunk_res) = stream.next().await {
        if *cancel_rx.borrow() {
            drop(file);
            let _ = fs::remove_file(&part_path).await;
            return Err("Download cancelled".to_string());
        }

        let chunk = match chunk_res {
            Ok(c) => c,
            Err(e) => {
                drop(file);
                let _ = fs::remove_file(&part_path).await;
                return Err(format!("Stream error: {e}"));
            }
        };

        if let Err(e) = file.write_all(&chunk).await {
            drop(file);
            let _ = fs::remove_file(&part_path).await;
            return Err(format!("Write error: {e}"));
        }

        received = received.saturating_add(chunk.len() as u64);
        on_progress(received, total_bytes, compute_progress(received, total_bytes));

        // Check cancellation again if signaled mid-write
        if cancel_rx.has_changed().unwrap_or(false) && *cancel_rx.borrow_and_update() {
            drop(file);
            let _ = fs::remove_file(&part_path).await;
            return Err("Download cancelled".to_string());
        }
    }

    file.flush()
        .await
        .map_err(|e| format!("Flush error: {e}"))?;
    drop(file);

    fs::rename(&part_path, dest).await.map_err(|e| {
        let _ = std::fs::remove_file(&part_path);
        format!("Failed to finalize download: {e}")
    })?;

    Ok(received)
}

#[tauri::command]
pub async fn download_file(
    app: AppHandle,
    id: String,
    url: String,
    relative_path: String,
    http_state: State<'_, HttpState>,
    dl_state: State<'_, DownloadManager>,
) -> Result<DownloadResult, String> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app_data_dir: {e}"))?;
    let dest = safe_join_relative(&app_data, &relative_path)?;

    let (tx, rx) = watch::channel(false);
    {
        let mut map = dl_state.active.lock().await;
        map.insert(id.clone(), tx);
    }

    let mut last_emitted: u64 = 0;
    let app_clone = app.clone();
    let id_clone = id.clone();

    let result = stream_download_to_path(&http_state.client, &url, &dest, rx, |rec, tot, prog| {
        // Throttle progress events to every ~64 KB or completion
        if rec.saturating_sub(last_emitted) >= 65_536 || tot.is_some_and(|t| rec >= t) {
            last_emitted = rec;
            let _ = app_clone.emit(
                "download-progress",
                DownloadProgressPayload {
                    id: id_clone.clone(),
                    received_bytes: rec,
                    total_bytes: tot,
                    progress: prog,
                },
            );
        }
    })
    .await;

    {
        let mut map = dl_state.active.lock().await;
        map.remove(&id);
    }

    let bytes = result?;
    Ok(DownloadResult {
        id,
        path: dest.to_string_lossy().to_string(),
        bytes,
    })
}

#[tauri::command]
pub async fn cancel_download(
    id: String,
    dl_state: State<'_, DownloadManager>,
) -> Result<bool, String> {
    let map = dl_state.active.lock().await;
    if let Some(tx) = map.get(&id) {
        let _ = tx.send(true);
        Ok(true)
    } else {
        Ok(false)
    }
}

#[tauri::command]
pub async fn delete_app_file(app: AppHandle, relative_path: String) -> Result<(), String> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app_data_dir: {e}"))?;
    let target = safe_join_relative(&app_data, &relative_path)?;
    if target.is_dir() {
        fs::remove_dir_all(&target)
            .await
            .map_err(|e| format!("Failed to remove directory: {e}"))?;
    } else if target.exists() {
        fs::remove_file(&target)
            .await
            .map_err(|e| format!("Failed to remove file: {e}"))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn app_file_exists(app: AppHandle, relative_path: String) -> Result<Option<String>, String> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app_data_dir: {e}"))?;
    let target = safe_join_relative(&app_data, &relative_path)?;
    if target.exists() {
        Ok(Some(target.to_string_lossy().to_string()))
    } else {
        Ok(None)
    }
}

fn dir_size_sync(path: &Path) -> u64 {
    let mut total = 0;
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_dir() {
                total += dir_size_sync(&p);
            } else if let Ok(meta) = entry.metadata() {
                total += meta.len();
            }
        }
    }
    total
}

#[tauri::command]
pub async fn get_dir_size(app: AppHandle, relative_path: String) -> Result<u64, String> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app_data_dir: {e}"))?;
    let target = safe_join_relative(&app_data, &relative_path)?;
    if !target.exists() {
        return Ok(0);
    }
    let size = tokio::task::spawn_blocking(move || dir_size_sync(&target))
        .await
        .map_err(|e| format!("Task join error: {e}"))?;
    Ok(size)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_safe_join_relative_valid() {
        let base = Path::new("/tmp/quranic-test");
        let joined = safe_join_relative(base, "downloads/audio/001.mp3").unwrap();
        assert_eq!(joined, PathBuf::from("/tmp/quranic-test/downloads/audio/001.mp3"));
    }

    #[test]
    fn test_safe_join_relative_blocks_traversal() {
        let base = Path::new("/tmp/quranic-test");
        assert!(safe_join_relative(base, "../etc/passwd").is_err());
        assert!(safe_join_relative(base, "/etc/passwd").is_err());
        assert!(safe_join_relative(base, "").is_err());
    }

    #[test]
    fn test_compute_progress_guards_zero_and_none() {
        assert_eq!(compute_progress(500, None), 0.0);
        assert_eq!(compute_progress(500, Some(0)), 0.0);
        assert_eq!(compute_progress(50, Some(100)), 0.5);
        assert_eq!(compute_progress(200, Some(100)), 1.0);
    }

    #[test]
    fn test_dir_size_sync() {
        let dir = tempdir().unwrap();
        let sub = dir.path().join("nested");
        std::fs::create_dir_all(&sub).unwrap();
        std::fs::write(dir.path().join("a.bin"), vec![0u8; 100]).unwrap();
        std::fs::write(sub.join("b.bin"), vec![0u8; 250]).unwrap();
        assert_eq!(dir_size_sync(dir.path()), 350);
    }
}
