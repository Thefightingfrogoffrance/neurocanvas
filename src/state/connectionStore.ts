import { create } from 'zustand';
import type { ConnectionStep, ChannelQuality } from '../types';

interface ConnectionState {
  step: ConnectionStep;
  deviceKey: string;
  overallQuality: number;
  channels: ChannelQuality[];
  message: string;
  setDeviceKey: (k: string) => void;
  applyReport: (r: { step: ConnectionStep; overallQuality: number; channels: ChannelQuality[]; message: string }) => void;
  reset: () => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  step: 'idle',
  deviceKey: 'synthetic',
  overallQuality: 0,
  channels: [],
  message: '',
  setDeviceKey: (k) => set({ deviceKey: k }),
  applyReport: (r) => set(r),
  reset: () => set({ step: 'idle', overallQuality: 0, channels: [], message: '' }),
}));

export function verifyConnection(deviceKey: string): WebSocket {
  const store = useConnectionStore.getState();
  store.applyReport({ step: 'connecting', overallQuality: 0, channels: [], message: 'Connecting to headset…' });

  const ws = new WebSocket('ws://localhost:8765/ws/verify');
  ws.onopen = () => ws.send(JSON.stringify({ device: deviceKey }));
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'verify_result') {
      useConnectionStore.getState().applyReport({
        step: msg.step,
        overallQuality: msg.overallQuality ?? 0,
        channels: msg.channels ?? [],
        message: msg.message,
      });
    }
  };
  ws.onerror = () => {
    useConnectionStore.getState().applyReport({
      step: 'failed', overallQuality: 0, channels: [],
      message: 'Could not reach the signal service — is it running?',
    });
  };
  return ws;
}
