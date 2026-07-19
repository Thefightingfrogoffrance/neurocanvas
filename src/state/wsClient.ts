import { useEmotionStore } from './emotionStore';

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let device = 'synthetic';

function connect() {
  if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) return;

  ws = new WebSocket('ws://localhost:8765/ws');
  ws.onopen = () => {
    ws?.send(JSON.stringify({ type: 'start_stream', device }));
    useEmotionStore.getState().setConnected(true);
  };
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'emotion_frame') {
      useEmotionStore.getState().setFrame(msg);
    }
  };
  ws.onclose = () => {
    useEmotionStore.getState().setConnected(false);
    reconnectTimer = setTimeout(connect, 2000);
  };
  ws.onerror = () => {
    ws?.close();
  };
}

export function connectSignalService(deviceKey?: string) {
  if (deviceKey) device = deviceKey;
  connect();
}

export function autoConnect() {
  connect();
}

export function disconnectSignalService() {
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  ws?.close();
  ws = null;
  useEmotionStore.getState().setConnected(false);
}
