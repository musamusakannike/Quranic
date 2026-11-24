mod downloader;
mod http_proxy;

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, State, WindowEvent};

struct AppRuntimeState {
    close_to_tray: AtomicBool,
    tray_prayer_item: Mutex<Option<MenuItem<tauri::Wry>>>,
    tray_audio_item: Mutex<Option<MenuItem<tauri::Wry>>>,
}

impl AppRuntimeState {
    fn new() -> Self {
        Self {
            close_to_tray: AtomicBool::new(false),
            tray_prayer_item: Mutex::new(None),
            tray_audio_item: Mutex::new(None),
        }
    }
}

#[tauri::command]
fn set_close_to_tray(enabled: bool, state: State<'_, AppRuntimeState>) {
    state.close_to_tray.store(enabled, Ordering::Relaxed);
}

#[tauri::command]
fn update_tray_status(
    app: AppHandle,
    next_prayer_label: String,
    tooltip: String,
    is_playing: bool,
    state: State<'_, AppRuntimeState>,
) -> Result<(), String> {
    if let Ok(guard) = state.tray_prayer_item.lock() {
        if let Some(item) = guard.as_ref() {
            let _ = item.set_text(&next_prayer_label);
        }
    }
    if let Ok(guard) = state.tray_audio_item.lock() {
        if let Some(item) = guard.as_ref() {
            let _ = item.set_text(if is_playing {
                "Pause Audio"
            } else {
                "Resume Audio"
            });
        }
    }
    if let Some(tray) = app.tray_by_id("main-tray") {
        let _ = tray.set_tooltip(Some(tooltip.clone()));
        #[cfg(target_os = "macos")]
        {
            let _ = tray.set_title(Some(tooltip));
        }
    }
    Ok(())
}

#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(http_proxy::HttpState::new())
        .manage(downloader::DownloadManager::new())
        .manage(AppRuntimeState::new())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let prayer_item = MenuItem::with_id(
                app,
                "tray-next-prayer",
                "Quranic · Prayer Times",
                false,
                None::<&str>,
            )?;
            let show_item = MenuItem::with_id(app, "tray-show", "Show Quranic", true, None::<&str>)?;
            let audio_item =
                MenuItem::with_id(app, "tray-audio", "Pause / Resume Audio", true, None::<&str>)?;
            let sep = PredefinedMenuItem::separator(app)?;
            let quit_item = MenuItem::with_id(app, "tray-quit", "Quit Quranic", true, None::<&str>)?;

            let menu = Menu::with_items(
                app,
                &[&prayer_item, &sep, &show_item, &audio_item, &quit_item],
            )?;

            if let Ok(mut guard) = app.state::<AppRuntimeState>().tray_prayer_item.lock() {
                *guard = Some(prayer_item);
            }
            if let Ok(mut guard) = app.state::<AppRuntimeState>().tray_audio_item.lock() {
                *guard = Some(audio_item);
            }

            let mut tray_builder = TrayIconBuilder::with_id("main-tray")
                .menu(&menu)
                .tooltip("Quranic")
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "tray-show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.unminimize();
                            let _ = w.set_focus();
                        }
                    }
                    "tray-audio" => {
                        let _ = app.emit("tray-toggle-audio", ());
                    }
                    "tray-quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        if let Some(w) = tray.app_handle().get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.unminimize();
                            let _ = w.set_focus();
                        }
                    }
                });

            if let Some(icon) = app.default_window_icon() {
                tray_builder = tray_builder.icon(icon.clone());
            }

            let _ = tray_builder.build(app);
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                let state = window.state::<AppRuntimeState>();
                if state.close_to_tray.load(Ordering::Relaxed) {
                    api.prevent_close();
                    let _ = window.emit("close-to-tray-requested", ());
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            http_proxy::http_get_text,
            downloader::download_file,
            downloader::cancel_download,
            downloader::delete_app_file,
            downloader::app_file_exists,
            downloader::get_dir_size,
            set_close_to_tray,
            update_tray_status,
            quit_app,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Quranic Desktop");
}
