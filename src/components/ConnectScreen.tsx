import { useRef } from 'react';
import { useConnectionStore, verifyConnection } from '../state/connectionStore';
import { logDeviceConnection } from '../db/media';

const DEVICES = [
  { key: 'muse_s', label: 'Muse S' },
  { key: 'muse_2', label: 'Muse 2' },
  { key: 'openbci_cyton', label: 'OpenBCI Cyton' },
  { key: 'synthetic', label: 'Demo mode (no headset)' },
];

export default function ConnectScreen({ onVerified }: { onVerified: () => void }) {
  const { step, deviceKey, overallQuality, channels, message, setDeviceKey, applyReport } = useConnectionStore();
  const wsRef = useRef<WebSocket | null>(null);

  const handleVerify = () => {
    wsRef.current = verifyConnection(deviceKey);
  };

  const handleSkipDemo = () => {
    applyReport({
      step: 'verified', overallQuality: 0, channels: [],
      message: 'Demo mode — using synthetic data.',
    });
  };

  if (step === 'verified') {
    const deviceLabel = DEVICES.find((d) => d.key === deviceKey)?.label ?? deviceKey;
    logDeviceConnection({
      deviceName: deviceLabel, deviceKey, verified: true,
      signalQualityAvg: overallQuality,
      channelReportJson: JSON.stringify(channels),
    });
    onVerified();
    return null;
  }

  return (
    <div style={{ padding: 32, maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Connect Your Headset</h1>
      <p style={{ color: '#999', marginBottom: 24 }}>
        Pair your EEG headset and verify the connection before using the app.
      </p>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, color: '#999', marginBottom: 4 }}>Device</label>
        <select
          value={deviceKey}
          onChange={(e) => setDeviceKey(e.target.value)}
          disabled={step === 'connecting' || step === 'verifying'}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #444',
            background: '#222', color: '#eee', fontSize: 14,
          }}
        >
          {DEVICES.map((d) => (
            <option key={d.key} value={d.key}>{d.label}</option>
          ))}
        </select>
      </div>

      <div style={{
        padding: 16, marginBottom: 16, borderRadius: 8,
        background: step === 'failed' ? '#3d1f1f' : '#1a1a1a',
        border: `1px solid ${step === 'failed' ? '#f87171' : '#333'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{
            display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
            background: step === 'failed' ? '#f87171'
              : step === 'idle' ? '#666' : '#fbbf24',
          }} />
          <span>{message || 'Not connected'}</span>
        </div>

        {channels.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {channels.map((c) => (
              <div key={c.channelName} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ width: 48, fontSize: 13 }}>{c.channelName}</span>
                <div style={{ flex: 1, height: 8, background: '#333', borderRadius: 4 }}>
                  <div style={{
                    height: 8, borderRadius: 4, transition: 'width 0.3s',
                    background: c.status === 'good' ? '#4ade80'
                      : c.status === 'noisy' ? '#fbbf24' : '#f87171',
                    width: `${c.quality * 100}%`,
                  }} />
                </div>
                <span style={{ width: 120, fontSize: 12, color: '#999', textAlign: 'right' }}>
                  {Math.round(c.quality * 100)}% {c.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {channels.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 13, color: '#999' }}>
            Overall signal quality: {Math.round(overallQuality * 100)}% (needs 60%+ to verify)
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={handleVerify}
          disabled={step === 'connecting' || step === 'verifying'}
          style={{
            padding: '10px 24px', background: '#3b82f6', color: '#fff',
            border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 14,
            opacity: (step === 'connecting' || step === 'verifying') ? 0.6 : 1,
          }}
        >
          {step === 'connecting' || step === 'verifying' ? 'Verifying…' : 'Verify Connection'}
        </button>
        <button
          onClick={handleSkipDemo}
          style={{
            padding: '10px 24px', background: 'transparent', color: '#999',
            border: '1px solid #444', borderRadius: 6, cursor: 'pointer', fontSize: 14,
          }}
        >
          Skip (demo mode)
        </button>
      </div>

      {step === 'failed' && (
        <div style={{ marginTop: 12, padding: 12, background: '#3d1f1f', borderRadius: 6, fontSize: 13, color: '#fca5a5' }}>
          {message}
        </div>
      )}
    </div>
  );
}
