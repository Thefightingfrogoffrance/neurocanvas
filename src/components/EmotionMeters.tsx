import { useEmotionStore } from '../state/emotionStore';

export default function EmotionMeters() {
  const { valence, arousal, confidence } = useEmotionStore();

  const barStyle = (value: number): React.CSSProperties => ({
    width: `${((value + 1) / 2) * 100}%`,
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s ease',
  });

  return (
    <div style={{ padding: '8px 16px', fontSize: 14 }}>
      <div style={{ marginBottom: 6 }}>
        <strong>Valence</strong>
        <div style={{ background: '#333', height: 12, borderRadius: 4, width: '100%' }}>
          <div style={{
            ...barStyle(valence),
            background: valence >= 0 ? '#4ade80' : '#f87171',
          }} />
        </div>
      </div>

      <div style={{ marginBottom: 6 }}>
        <strong>Arousal</strong>
        <div style={{ background: '#333', height: 12, borderRadius: 4, width: '100%' }}>
          <div style={{
            ...barStyle(arousal),
            background: arousal >= 0 ? '#fb923c' : '#60a5fa',
          }} />
        </div>
      </div>

      <div>
        <strong>Confidence</strong>
        <div style={{ background: '#333', height: 12, borderRadius: 4, width: '100%' }}>
          <div style={{
            ...barStyle(confidence * 2 - 1),
            background: '#a78bfa',
          }} />
        </div>
        <span style={{ fontSize: 12, color: '#999' }}>{Math.round(confidence * 100)}%</span>
      </div>
    </div>
  );
}
