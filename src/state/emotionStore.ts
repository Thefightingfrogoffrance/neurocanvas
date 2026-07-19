import { create } from 'zustand';

interface EmotionState {
  valence: number;
  arousal: number;
  confidence: number;
  connected: boolean;
  setFrame: (f: { valence: number; arousal: number; confidence: number }) => void;
  setConnected: (c: boolean) => void;
}

export const useEmotionStore = create<EmotionState>((set) => ({
  valence: 0,
  arousal: 0,
  confidence: 0,
  connected: false,
  setFrame: (f) => set((prev) => ({
    valence: prev.valence * 0.7 + f.valence * 0.3,
    arousal: prev.arousal * 0.7 + f.arousal * 0.3,
    confidence: f.confidence,
  })),
  setConnected: (c) => set({ connected: c }),
}));
