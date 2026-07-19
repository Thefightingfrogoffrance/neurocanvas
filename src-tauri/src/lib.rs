use tauri_plugin_sql::{Migration, MigrationKind};
use tauri_plugin_shell::ShellExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let migrations = vec![
    Migration {
      version: 1,
      description: "create tables",
      sql: "
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  device_name TEXT NOT NULL,
  mode TEXT NOT NULL,
  notes TEXT
);
CREATE TABLE IF NOT EXISTS emotion_samples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  ts_ms INTEGER NOT NULL,
  valence REAL NOT NULL,
  arousal REAL NOT NULL,
  confidence REAL NOT NULL,
  band_theta REAL, band_alpha REAL, band_beta REAL, band_gamma REAL
);
CREATE TABLE IF NOT EXISTS calibration_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  baseline_alpha REAL NOT NULL,
  baseline_beta REAL NOT NULL,
  faa_baseline REAL NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS media_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  media_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  thumbnail_path TEXT,
  duration_ms INTEGER NOT NULL,
  avg_valence REAL NOT NULL,
  avg_arousal REAL NOT NULL,
  emotion_label TEXT NOT NULL,
  avg_confidence REAL NOT NULL,
  params_json TEXT,
  title TEXT,
  favorite INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS device_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_name TEXT NOT NULL,
  device_key TEXT NOT NULL,
  connected_at TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  signal_quality_avg REAL,
  channel_report_json TEXT,
  notes TEXT
);",
      kind: MigrationKind::Up,
    },
  ];

  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(
      tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:neurocanvas.db", migrations)
        .build(),
    )
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Spawn the sidecar gracefully — log a warning on failure instead of crashing.
      match app.shell().sidecar("neurocanvas-signal") {
        Ok(cmd) => {
          if let Err(e) = cmd.spawn() {
            log::warn!("Failed to spawn signal service sidecar: {}. App will run without it.", e);
          }
        }
        Err(e) => {
          log::warn!("Sidecar binary not found: {}. App will run without it.", e);
        }
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
