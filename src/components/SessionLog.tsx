import { useState, useEffect } from 'react';
import { getSessions, getSessionEmotionSamples } from '../db/sessions';

interface Session {
  id: number; started_at: string; ended_at: string | null;
  device_name: string; mode: string; notes: string | null;
}

interface EmotionSample {
  ts_ms: number; valence: number; arousal: number; confidence: number;
}

export default function SessionLog() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [samples, setSamples] = useState<EmotionSample[]>([]);

  useEffect(() => {
    getSessions().then(setSessions);
  }, []);

  useEffect(() => {
    if (selected !== null) {
      getSessionEmotionSamples(selected).then(setSamples as any);
    }
  }, [selected]);

  return (
    <div style={{ padding: 16, display: 'flex', gap: 16, height: '100%' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <h2>Session Log</h2>
        {sessions.length === 0 && (
          <p style={{ color: '#666' }}>No sessions yet — try Listen mode!</p>
        )}
        {sessions.map((s) => (
          <div
            key={s.id}
            onClick={() => setSelected(s.id)}
            style={{
              padding: 8,
              marginBottom: 4,
              background: selected === s.id ? '#333' : '#222',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            <div>{new Date(s.started_at).toLocaleString()}</div>
            <div style={{ fontSize: 12, color: '#999' }}>
              {s.device_name} · {s.mode} · {s.ended_at ? 'Completed' : 'In progress'}
            </div>
          </div>
        ))}
      </div>

      {selected !== null && (
        <div style={{ flex: 2, overflow: 'auto' }}>
          <h3>Session Timeline</h3>
          {samples.length === 0 ? (
            <p style={{ color: '#666' }}>No emotion data recorded.</p>
          ) : (
            <div>
              <div style={{ position: 'relative', height: 200 }}>
                <svg width="100%" height="200" viewBox={`0 0 ${samples.length} 200`}>
                  <polyline
                    fill="none"
                    stroke="#4ade80"
                    strokeWidth={1}
                    points={samples.map((s, i) => `${i},${100 - s.valence * 50}`).join(' ')}
                  />
                  <polyline
                    fill="none"
                    stroke="#fb923c"
                    strokeWidth={1}
                    points={samples.map((s, i) => `${i},${100 - s.arousal * 50}`).join(' ')}
                  />
                </svg>
              </div>
              <div style={{ fontSize: 12, color: '#999' }}>
                <span style={{ color: '#4ade80' }}>Valence</span> · <span style={{ color: '#fb923c' }}>Arousal</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
