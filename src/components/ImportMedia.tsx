import { useState, useRef } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { saveMediaItem } from '../db/media';
import type { EmotionLabel } from '../types';

export default function ImportMedia({ sessionId, onDone }: { sessionId: number; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [label, setLabel] = useState<EmotionLabel>('neutral');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const fileInfoRef = useRef<{ path: string; name: string } | null>(null);

  const handlePickFile = async () => {
    try {
      const result = await open({
        multiple: false,
        filters: [{
          name: 'Media',
          extensions: ['mp3', 'wav', 'ogg', 'flac', 'mp4', 'webm', 'avi', 'mov', 'png', 'jpg', 'gif'],
        }],
      });
      if (result) {
        const path = result as string;
        const name = path.split('\\').pop()?.split('/').pop() ?? path;
        fileInfoRef.current = { path, name };
        if (!title) setTitle(name.replace(/\.[^/.]+$/, ''));
      }
    } catch (e) {
      setError(String(e));
    }
  };

  const handleImport = async () => {
    if (!fileInfoRef.current) return;
    setImporting(true);
    setError('');
    try {
      const ext = fileInfoRef.current.name.split('.').pop()?.toLowerCase() ?? '';
      const mediaType = ['mp3', 'wav', 'ogg', 'flac'].includes(ext) ? 'audio'
        : ['png', 'jpg', 'gif', 'jpeg'].includes(ext) ? 'visual'
        : 'audio_visual';

      await saveMediaItem({
        sessionId,
        filePath: fileInfoRef.current.path,
        durationMs: 0,
        avgValence: 0,
        avgArousal: 0,
        emotionLabel: label,
        avgConfidence: 1,
        title: title || fileInfoRef.current.name.replace(/\.[^/.]+$/, ''),
        mediaType,
      });
      onDone();
    } catch (e) {
      setError(String(e));
      setImporting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        background: '#1a1a1a', borderRadius: 12, padding: 24,
        maxWidth: 480, width: '100%', border: '1px solid #333',
      }}>
        <h3 style={{ marginBottom: 16 }}>Import Media</h3>

        <button
          onClick={handlePickFile}
          style={{
            width: '100%', padding: 12, marginBottom: 16,
            background: '#2a2a2a', border: '2px dashed #555',
            borderRadius: 8, color: '#ccc', cursor: 'pointer', fontSize: 14,
          }}
        >
          {fileInfoRef.current ? fileInfoRef.current.name : 'Click to select a file…'}
        </button>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#999', marginBottom: 4 }}>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 6,
              border: '1px solid #444', background: '#222', color: '#eee', fontSize: 14,
            }}
            placeholder="My clip"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#999', marginBottom: 4 }}>Emotion Tag</label>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {(['excited', 'content', 'calm', 'tense', 'sad', 'neutral'] as EmotionLabel[]).map((l) => (
              <button
                key={l}
                onClick={() => setLabel(l)}
                style={{
                  padding: '4px 12px', borderRadius: 16, border: '1px solid',
                  borderColor: label === l ? '#3b82f6' : '#444',
                  background: label === l ? '#3b82f633' : 'transparent',
                  color: label === l ? '#60a5fa' : '#ccc',
                  cursor: 'pointer', fontSize: 12,
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 8 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onDone}
            style={{
              padding: '8px 16px', background: 'transparent', color: '#999',
              border: '1px solid #444', borderRadius: 6, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!fileInfoRef.current || importing}
            style={{
              padding: '8px 16px', background: fileInfoRef.current ? '#3b82f6' : '#333',
              color: fileInfoRef.current ? '#fff' : '#666',
              border: 'none', borderRadius: 6, cursor: fileInfoRef.current ? 'pointer' : 'default',
            }}
          >
            {importing ? 'Importing…' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
