import { useEffect, useState } from 'react';
import { queryMediaItems, toggleFavorite } from '../db/media';
import ImportMedia from './ImportMedia';
import type { EmotionLabel, MediaFilter, MediaItem } from '../types';

const ALL_LABELS: EmotionLabel[] = ['excited', 'content', 'calm', 'tense', 'sad', 'neutral'];

const LABEL_COLORS: Record<EmotionLabel, string> = {
  excited: '#f97316',
  content: '#4ade80',
  calm: '#60a5fa',
  tense: '#ef4444',
  sad: '#8b5cf6',
  neutral: '#9ca3af',
};

export default function MediaLibrary() {
  const [selected, setSelected] = useState<EmotionLabel[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [showImport, setShowImport] = useState(false);

  const loadItems = () => {
    const filter: MediaFilter = {
      emotionLabels: selected.length ? selected : undefined,
      favoritesOnly: favoritesOnly || undefined,
      minConfidence: 0.3,
    };
    queryMediaItems(filter).then(setItems);
  };

  useEffect(() => { loadItems(); }, [selected, favoritesOnly]);

  const toggleLabel = (label: EmotionLabel) =>
    setSelected((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));

  const handleToggleFavorite = async (id: number) => {
    await toggleFavorite(id);
    setItems((prev) => prev.map((item) =>
      item.id === id ? { ...item, favorite: item.favorite ? 0 : 1 } : item
    ));
  };

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Media Library</h2>
        <button
          onClick={() => setShowImport(true)}
          style={{
            padding: '8px 16px', background: '#3b82f6', color: '#fff',
            border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13,
          }}
        >
          + Import Media
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {ALL_LABELS.map((label) => (
          <button
            key={label}
            onClick={() => toggleLabel(label)}
            style={{
              padding: '4px 14px', borderRadius: 20, border: '1px solid',
              borderColor: selected.includes(label) ? LABEL_COLORS[label] : '#444',
              background: selected.includes(label) ? LABEL_COLORS[label] : 'transparent',
              color: selected.includes(label) ? '#111' : '#ccc',
              cursor: 'pointer', fontSize: 13,
            }}
          >
            {label}
          </button>
        ))}
        <label style={{ marginLeft: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#999' }}>
          <input type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} />
          Favorites only
        </label>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {items.length === 0 ? (
          <p style={{ color: '#666', padding: 24, textAlign: 'center' }}>
            No clips match this filter yet. Import media or record something in Listen mode!
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {items.map((item) => (
              <div key={item.id} style={{
                background: '#1a1a1a', borderRadius: 8, overflow: 'hidden',
                border: '1px solid #333',
              }}>
                <div style={{
                  aspectRatio: '16/9', background: '#2a2a2a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: '#555',
                }}>
                  {item.thumbnail_path ? (
                    <img src={item.thumbnail_path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    item.media_type === 'audio' ? '🎵' : item.media_type === 'visual' ? '🖼' : '🎬'
                  )}
                </div>
                <div style={{ padding: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {item.title ?? `Clip #${item.id}`}
                    </span>
                    <button
                      onClick={() => handleToggleFavorite(item.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
                        color: item.favorite ? '#fbbf24' : '#555', flexShrink: 0,
                      }}
                    >
                      ★
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <span style={{
                      padding: '1px 8px', borderRadius: 10, fontSize: 11,
                      background: LABEL_COLORS[item.emotion_label] + '33',
                      color: LABEL_COLORS[item.emotion_label],
                    }}>
                      {item.emotion_label}
                    </span>
                    <span style={{ fontSize: 11, color: '#666' }}>
                      {item.duration_ms > 0 ? `${(item.duration_ms / 1000).toFixed(1)}s` : '—'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                    {Math.round(item.avg_confidence * 100)}% confidence
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showImport && (
        <ImportMedia sessionId={0} onDone={() => { setShowImport(false); loadItems(); }} />
      )}
    </div>
  );
}
