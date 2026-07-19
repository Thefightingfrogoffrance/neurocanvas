import { useState, useRef, useCallback, useEffect } from 'react';
import { useEmotionStore } from './state/emotionStore';
import { autoConnect, connectSignalService, disconnectSignalService } from './state/wsClient';
import { AudioEngine } from './engines/audioEngine';
import { startSession, endSession, logEmotionSample } from './db/sessions';
import { saveMediaItem } from './db/media';
import { MediaCapture } from './engines/mediaCapture';
import VisualCanvas from './components/VisualCanvas';
import EmotionMeters from './components/EmotionMeters';
import SessionLog from './components/SessionLog';
import ConnectScreen from './components/ConnectScreen';
import MediaLibrary from './components/MediaLibrary';

type Mode = 'connect' | 'listen' | 'media' | 'log' | 'calibrate';

const MODE_TABS: { key: Mode; label: string }[] = [
  { key: 'connect', label: 'Connect' },
  { key: 'listen', label: 'Listen' },
  { key: 'media', label: 'Media Library' },
  { key: 'log', label: 'Session Log' },
  { key: 'calibrate', label: 'Calibrate' },
];

export default function App() {
  const [mode, setMode] = useState<Mode>('connect');
  const [verified, setVerified] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const audioRef = useRef<AudioEngine | null>(null);
  const sessionIdRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const captureRef = useRef<MediaCapture | null>(null);
  const { connected } = useEmotionStore();

  useEffect(() => {
    autoConnect();
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
      disconnectSignalService();
      audioRef.current?.stop();
    };
  }, []);

  const handleVerified = useCallback(() => {
    setVerified(true);
    setMode('listen');
  }, []);

  const handleStartSession = useCallback(async () => {
    const audio = new AudioEngine();
    audioRef.current = audio;
    await audio.start();

    connectSignalService('synthetic');
    sessionIdRef.current = await startSession('Muse S (simulated)', 'listen');
    setSessionActive(true);

    intervalRef.current = window.setInterval(() => {
      const state = useEmotionStore.getState();
      if (sessionIdRef.current !== null) {
        logEmotionSample(sessionIdRef.current, {
          tsMs: Date.now(),
          valence: state.valence,
          arousal: state.arousal,
          confidence: state.confidence,
          bands: { theta: 0, alpha: 0, beta: 0, gamma: 0 },
        });
      }
      audio.update(state.valence, state.arousal);
    }, 500);
  }, []);

  const handleStopSession = useCallback(async () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (sessionIdRef.current !== null) {
      await endSession(sessionIdRef.current);
      sessionIdRef.current = null;
    }
    disconnectSignalService();
    audioRef.current?.stop();
    setSessionActive(false);
  }, []);

  const handleSaveClip = useCallback(async () => {
    if (!sessionActive || !audioRef.current || !canvasRef.current) return;
    const capture = new MediaCapture(audioRef.current['synth'], canvasRef.current);
    captureRef.current = capture;
    capture.start();

    setTimeout(async () => {
      if (!captureRef.current || sessionIdRef.current === null) return;
      const result = await captureRef.current.stop(sessionIdRef.current);
      const filePath = `media/clip_${Date.now()}.webm`;
      await saveMediaItem({
        sessionId: result.sessionId,
        filePath,
        durationMs: result.durationMs,
        avgValence: result.avgValence,
        avgArousal: result.avgArousal,
        emotionLabel: result.emotionLabel,
        avgConfidence: result.avgConfidence,
        title: result.title,
      });
    }, 5000);
  }, [sessionActive]);

  const canNavigate = (tab: Mode) => {
    if (tab === 'connect') return true;
    return verified;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#111', color: '#eee' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: '#1a1a1a', borderBottom: '1px solid #333' }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>NeuroCanvas</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
            background: connected ? '#4ade80' : '#f87171',
          }} />
          <span style={{ fontSize: 12 }}>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </header>

      {verified && (
        <div style={{ display: 'flex', gap: 4, padding: '6px 16px', background: '#1a1a1a', borderBottom: '1px solid #333' }}>
          {MODE_TABS.filter((t) => t.key !== 'connect').map((m) => (
            <button
              key={m.key}
              onClick={() => canNavigate(m.key) && setMode(m.key)}
              style={{
                padding: '4px 12px', border: 'none', borderRadius: 4, cursor: canNavigate(m.key) ? 'pointer' : 'default',
                background: mode === m.key ? '#4a4a4a' : '#2a2a2a', color: '#eee', fontSize: 13,
                opacity: canNavigate(m.key) ? 1 : 0.4,
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!verified ? (
          <ConnectScreen onVerified={handleVerified} />
        ) : mode === 'listen' ? (
          <>
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <VisualCanvas canvasRef={canvasRef} />
              {sessionActive && (
                <button
                  onClick={handleSaveClip}
                  style={{
                    position: 'absolute', bottom: 12, right: 12,
                    padding: '8px 16px', background: '#8b5cf6', color: '#fff',
                    border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12,
                  }}
                >
                  Save Clip
                </button>
              )}
            </div>
            <EmotionMeters />
          </>
        ) : mode === 'media' ? (
          <MediaLibrary />
        ) : mode === 'log' ? (
          <SessionLog />
        ) : (
          <div style={{ padding: 24 }}>
            <h2>Calibration</h2>
            <p style={{ color: '#999' }}>
              Sit still and relax for 60 seconds to establish your baseline brain activity.
            </p>
            <p style={{ color: '#999' }}>Then, think of something that makes you happy for a positive-valence reference.</p>
          </div>
        )}
      </main>

      {verified && mode === 'listen' && (
        <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 12, borderTop: '1px solid #333' }}>
          {!sessionActive ? (
            <button
              onClick={handleStartSession}
              style={{
                padding: '8px 24px', background: '#4ade80', color: '#111',
                border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
              }}
            >
              Start Session
            </button>
          ) : (
            <button
              onClick={handleStopSession}
              style={{
                padding: '8px 24px', background: '#f87171', color: '#111',
                border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
              }}
            >
              Stop
            </button>
          )}
          <span style={{ fontSize: 12, color: '#666' }}>Mode: Listen</span>
        </footer>
      )}
    </div>
  );
}
