export interface EmotionFrame {
  timestampMs: number;
  valence: number;
  arousal: number;
  confidence: number;
}

export interface BandPowers {
  theta: number;
  alpha: number;
  beta: number;
  gamma: number;
}

export interface EmotionFrameWithBands extends EmotionFrame {
  bands: BandPowers;
}

export interface AudioParams {
  bpm: number;
  scaleMode: 'minor' | 'major' | 'dorian' | 'lydian';
  filterCutoffHz: number;
  noteDensity: number;
  reverbWet: number;
}

export interface VisualParams {
  hue: number;
  saturation: number;
  motionSpeed: number;
  particleCount: number;
  shapeSharpness: number;
}

export interface Session {
  id: number;
  started_at: string;
  ended_at: string | null;
  device_name: string;
  mode: 'listen' | 'calibrate';
  notes: string | null;
}

export interface EmotionSample {
  id: number;
  session_id: number;
  ts_ms: number;
  valence: number;
  arousal: number;
  confidence: number;
  band_theta: number | null;
  band_alpha: number | null;
  band_beta: number | null;
  band_gamma: number | null;
}

export interface CalibrationProfile {
  id: number;
  created_at: string;
  baseline_alpha: number;
  baseline_beta: number;
  faa_baseline: number;
  is_active: boolean;
}

export type EmotionLabel = 'excited' | 'content' | 'calm' | 'tense' | 'sad' | 'neutral';

export interface MediaItem {
  id: number;
  session_id: number;
  created_at: string;
  media_type: 'audio' | 'visual' | 'audio_visual';
  file_path: string;
  thumbnail_path: string | null;
  duration_ms: number;
  avg_valence: number;
  avg_arousal: number;
  emotion_label: EmotionLabel;
  avg_confidence: number;
  params_json: string | null;
  title: string | null;
  favorite: number;
}

export interface MediaFilter {
  emotionLabels?: EmotionLabel[];
  minConfidence?: number;
  favoritesOnly?: boolean;
  dateRange?: { from: string; to: string };
}

export type ConnectionStep = 'idle' | 'scanning' | 'connecting' | 'verifying' | 'verified' | 'failed';

export interface ChannelQuality {
  channelName: string;
  quality: number;
  status: 'good' | 'noisy' | 'off_head';
}

export interface ConnectionReport {
  step: ConnectionStep;
  deviceKey: string;
  overallQuality: number;
  channels: ChannelQuality[];
  message: string;
}
