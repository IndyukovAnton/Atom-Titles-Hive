use rand::distributions::Alphanumeric;
use rand::Rng;
use std::sync::{Arc, Mutex};
use tauri::Emitter;
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;
use std::env;
use std::path::Path;


use tauri::Manager;

/// Состояние backend процесса
pub struct BackendState {
    pub child: Option<CommandChild>,
    pub port: Option<u16>,
}

impl Default for BackendState {
    fn default() -> Self {
        Self {
            child: None,
            port: None,
        }
    }
}

/// Генерирует случайный порт в диапазоне 1000-9999
fn generate_random_port() -> u16 {
    let mut rng = rand::thread_rng();
    rng.gen_range(1000..=9999)
}

fn load_or_create_jwt_secret(app_data_dir: &Path) -> Result<String, String> {
    let secret_path = app_data_dir.join("jwt_secret.txt");

    if secret_path.exists() {
        let existing = std::fs::read_to_string(&secret_path)
            .map_err(|e| format!("Failed to read jwt secret file: {}", e))?;
        let secret = existing.trim().to_string();
        if secret.len() < 32 {
            return Err("JWT secret in file is too short (< 32 chars)".to_string());
        }
        return Ok(secret);
    }

    let secret: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(64)
        .map(char::from)
        .collect();

    std::fs::write(&secret_path, &secret)
        .map_err(|e| format!("Failed to write jwt secret file: {}", e))?;

    Ok(secret)
}

/// Запускает backend sidecar с указанным портом
pub fn spawn_backend(app: &tauri::AppHandle, port: u16) -> Result<CommandChild, String> {
    let is_dev = cfg!(debug_assertions);

    // Получаем переменные окружения
    let jwt_expires_in = env::var("JWT_EXPIRES_IN").unwrap_or_else(|_| "1d".to_string());
    
    // Определяем путь к базе данных в директории данных приложения
    let app_data_dir = app.path().app_data_dir().map_err(|e| format!("Failed to get app data dir: {}", e))?;
    if !app_data_dir.exists() {
        std::fs::create_dir_all(&app_data_dir).map_err(|e| format!("Failed to create app data dir: {}", e))?;
    }

    // JWT secret:
    // - Dev: allow override via env, otherwise generate ephemeral secret
    // - Release: generate and persist in app data dir (no default secrets in bundle)
    let jwt_secret = if is_dev {
        env::var("JWT_SECRET").unwrap_or_else(|_| {
            rand::thread_rng()
                .sample_iter(&Alphanumeric)
                .take(64)
                .map(char::from)
                .collect()
        })
    } else {
        load_or_create_jwt_secret(&app_data_dir)?
    };

    let database_path = app_data_dir.join("database.sqlite");
    let database_path_str = database_path.to_str().ok_or("Failed to convert db path to string")?.to_string();

    let log_dir = app_data_dir.join("logs");
    let log_dir_str = log_dir.to_str().ok_or("Failed to convert log path to string")?.to_string();

    log::info!("Backend using database at: {}", database_path_str);
    log::info!("Backend using logs at: {}", log_dir_str);

    let node_env = if is_dev { "development" } else { "production" };
    let typeorm_synchronize = if is_dev {
        env::var("TYPEORM_SYNCHRONIZE").unwrap_or_else(|_| "true".to_string())
    } else {
        "false".to_string()
    };

    let sidecar = app
        .shell()
        .sidecar("backend")
        .map_err(|e| format!("Failed to create sidecar command: {}", e))?
        .env("PORT", port.to_string())
        .env("NODE_ENV", node_env)
        .env("JWT_SECRET", jwt_secret)
        .env("JWT_EXPIRES_IN", jwt_expires_in)
        .env("DATABASE_PATH", database_path_str)
        .env("LOG_DIR", log_dir_str)
        .env("TYPEORM_SYNCHRONIZE", typeorm_synchronize);

    let (mut rx, child) = sidecar
        .spawn()
        .map_err(|e| format!("Failed to spawn sidecar: {}", e))?;

    let app_handle = app.clone();

    // Слушаем stdout для маркера готовности
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line_bytes) => {
                    let line = String::from_utf8_lossy(&line_bytes);
                    log::info!("[Backend stdout]: {}", line.trim());

                    // Ищем маркер готовности
                    if line.starts_with("BACKEND_READY:") {
                        if let Some(port_str) = line.trim().strip_prefix("BACKEND_READY:") {
                            if let Ok(actual_port) = port_str.parse::<u16>() {
                                log::info!("Backend ready on port {}", actual_port);
                                
                                // Отправляем событие во frontend
                                let _ = app_handle.emit("backend-ready", actual_port);
                            }
                        }
                    }
                }
                CommandEvent::Stderr(line_bytes) => {
                    let line = String::from_utf8_lossy(&line_bytes);
                    log::warn!("[Backend stderr]: {}", line.trim());
                }
                CommandEvent::Error(error) => {
                    log::error!("[Backend error]: {}", error);
                    let _ = app_handle.emit("backend-error", error.clone());
                }
                CommandEvent::Terminated(payload) => {
                    log::info!("[Backend terminated]: {:?}", payload);
                    let _ = app_handle.emit("backend-terminated", ());
                }
                _ => {}
            }
        }
    });

    Ok(child)
}

/// Команда для получения порта backend'а
#[tauri::command]
fn get_backend_port(state: tauri::State<Arc<Mutex<BackendState>>>) -> Option<u16> {
    let state = state.lock().unwrap();
    state.port
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let backend_state = Arc::new(Mutex::new(BackendState::default()));
    let cleanup_state = backend_state.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(backend_state.clone())
        .invoke_handler(tauri::generate_handler![get_backend_port])
        .setup(move |app| {
            // Логирование (включено всегда для отладки продакшена)
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(log::LevelFilter::Info)
                    .build(),
            )?;

            // Логирование в debug режиме и загрузка .env
            if cfg!(debug_assertions) {
                // Загружаем .env файл в dev режиме
                // Мы находимся в src-tauri, поэтому ищем .env в родительской директории
                if let Err(e) = dotenvy::from_path("../.env") {
                    log::warn!("Failed to load .env file: {}", e);
                }
            }

            // Генерируем случайный порт
            let port = generate_random_port();
            log::info!("Starting backend sidecar on port {}", port);

            // Запускаем backend sidecar
            match spawn_backend(app.handle(), port) {
                Ok(child) => {
                    let mut state = backend_state.lock().unwrap();
                    state.child = Some(child);
                    state.port = Some(port);
                    log::info!("Backend sidecar spawned successfully");
                }
                Err(e) => {
                    log::error!("Failed to spawn backend: {}", e);
                    // Продолжаем работу приложения, frontend покажет ошибку
                }
            }

            Ok(())
        })
        .on_window_event(move |window, event| {
            // Cleanup при закрытии главного окна
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                if window.label() == "main" {
                    log::info!("Main window closing, terminating backend...");
                    if let Ok(mut state) = cleanup_state.lock() {
                        if let Some(child) = state.child.take() {
                            if let Err(e) = child.kill() {
                                log::warn!("Failed to kill backend process: {}", e);
                            } else {
                                log::info!("Backend process terminated");
                            }
                        }
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
