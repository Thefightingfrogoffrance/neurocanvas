import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:neurocanvas.db');
  }
  return db;
}

export async function startSession(deviceName: string, mode: 'listen' | 'calibrate'): Promise<number> {
  const d = await getDb();
  const result = await d.execute(
    `INSERT INTO sessions (started_at, device_name, mode) VALUES ($1, $2, $3)`,
    [new Date().toISOString(), deviceName, mode]
  );
  return result.lastInsertId as number;
}

export async function logEmotionSample(sessionId: number, frame: {
  tsMs: number; valence: number; arousal: number; confidence: number;
  bands: { theta: number; alpha: number; beta: number; gamma: number };
}) {
  const d = await getDb();
  await d.execute(
    `INSERT INTO emotion_samples
      (session_id, ts_ms, valence, arousal, confidence, band_theta, band_alpha, band_beta, band_gamma)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [sessionId, frame.tsMs, frame.valence, frame.arousal, frame.confidence,
     frame.bands.theta, frame.bands.alpha, frame.bands.beta, frame.bands.gamma]
  );
}

export async function endSession(sessionId: number) {
  const d = await getDb();
  await d.execute(
    `UPDATE sessions SET ended_at = $1 WHERE id = $2`,
    [new Date().toISOString(), sessionId]
  );
}

export async function getSessions(): Promise<Array<{
  id: number; started_at: string; ended_at: string | null;
  device_name: string; mode: string; notes: string | null;
}>> {
  const d = await getDb();
  return d.select(`SELECT * FROM sessions ORDER BY started_at DESC`);
}

export async function getSessionEmotionSamples(sessionId: number) {
  const d = await getDb();
  return d.select(
    `SELECT ts_ms, valence, arousal, confidence FROM emotion_samples WHERE session_id = $1 ORDER BY ts_ms`,
    [sessionId]
  );
}

export async function saveCalibrationProfile(profile: {
  baselineAlpha: number; baselineBeta: number; faaBaseline: number;
}) {
  const d = await getDb();
  await d.execute(`UPDATE calibration_profiles SET is_active = 0 WHERE is_active = 1`);
  await d.execute(
    `INSERT INTO calibration_profiles (created_at, baseline_alpha, baseline_beta, faa_baseline, is_active)
    VALUES ($1, $2, $3, $4, 1)`,
    [new Date().toISOString(), profile.baselineAlpha, profile.baselineBeta, profile.faaBaseline]
  );
}
