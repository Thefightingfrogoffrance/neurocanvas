import Database from '@tauri-apps/plugin-sql';
import type { MediaItem, MediaFilter, EmotionLabel } from '../types';

let db: Database | null = null;
let importSessionId: number | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:neurocanvas.db');
  }
  return db;
}

async function getImportSessionId(): Promise<number> {
  if (importSessionId !== null) return importSessionId;
  const d = await getDb();
  const rows = await d.select<{ id: number }[]>(
    `SELECT id FROM sessions WHERE mode = 'listen' AND device_name = 'Imported Media' ORDER BY started_at DESC LIMIT 1`
  );
  if (rows.length > 0) {
    importSessionId = rows[0].id;
    return importSessionId;
  }
  const result = await d.execute(
    `INSERT INTO sessions (started_at, device_name, mode) VALUES ($1, $2, $3)`,
    [new Date().toISOString(), 'Imported Media', 'listen']
  );
  importSessionId = result.lastInsertId as number;
  return importSessionId;
}

export async function saveMediaItem(item: {
  sessionId: number; filePath: string; durationMs: number;
  avgValence: number; avgArousal: number; emotionLabel: EmotionLabel;
  avgConfidence: number; title?: string; mediaType?: string;
}): Promise<number> {
  const d = await getDb();
  const sid = item.sessionId || await getImportSessionId();
  const result = await d.execute(
    `INSERT INTO media_items
      (session_id, created_at, media_type, file_path, duration_ms,
       avg_valence, avg_arousal, emotion_label, avg_confidence, title, favorite)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0)`,
    [sid, new Date().toISOString(), item.mediaType ?? 'audio_visual',
     item.filePath, item.durationMs, item.avgValence, item.avgArousal,
     item.emotionLabel, item.avgConfidence, item.title ?? null]
  );
  return result.lastInsertId as number;
}

export async function queryMediaItems(filter: MediaFilter = {}): Promise<MediaItem[]> {
  const d = await getDb();
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (filter.emotionLabels?.length) {
    clauses.push(`emotion_label IN (${filter.emotionLabels.map(() => '?').join(',')})`);
    params.push(...filter.emotionLabels);
  }
  if (filter.minConfidence !== undefined) {
    clauses.push(`avg_confidence >= ?`);
    params.push(filter.minConfidence);
  }
  if (filter.favoritesOnly) {
    clauses.push(`favorite = 1`);
  }
  if (filter.dateRange) {
    clauses.push(`created_at BETWEEN ? AND ?`);
    params.push(filter.dateRange.from, filter.dateRange.to);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return d.select(`SELECT * FROM media_items ${where} ORDER BY created_at DESC`, params);
}

export async function toggleFavorite(mediaId: number) {
  const d = await getDb();
  await d.execute(`UPDATE media_items SET favorite = 1 - favorite WHERE id = $1`, [mediaId]);
}

export async function logDeviceConnection(report: {
  deviceName: string; deviceKey: string; verified: boolean;
  signalQualityAvg: number; channelReportJson: string; notes?: string;
}) {
  const d = await getDb();
  await d.execute(
    `INSERT INTO device_connections
      (device_name, device_key, connected_at, verified, signal_quality_avg, channel_report_json, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [report.deviceName, report.deviceKey, new Date().toISOString(),
     report.verified ? 1 : 0, report.signalQualityAvg, report.channelReportJson, report.notes ?? null]
  );
}

export async function getLastConnection(deviceKey: string): Promise<Record<string, unknown> | null> {
  const d = await getDb();
  const rows = await d.select<Record<string, unknown>[]>(
    `SELECT * FROM device_connections WHERE device_key = $1 ORDER BY connected_at DESC LIMIT 1`,
    [deviceKey]
  );
  return rows.length > 0 ? rows[0] : null;
}
