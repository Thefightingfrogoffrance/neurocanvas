import * as Tone from 'tone';
import { useEmotionStore } from '../state/emotionStore';
import type { EmotionLabel } from '../types';

export function emotionLabel(valence: number, arousal: number): EmotionLabel {
  if (Math.abs(valence) < 0.15 && Math.abs(arousal) < 0.15) return 'neutral';
  if (valence >= 0 && arousal >= 0.3) return 'excited';
  if (valence >= 0 && arousal <= -0.3) return 'calm';
  if (valence >= 0) return 'content';
  if (valence < 0 && arousal >= 0.3) return 'tense';
  return 'sad';
}

interface EmotionSample { valence: number; arousal: number; confidence: number }

export class MediaCapture {
  private recorder: Tone.Recorder;
  private masterNode: Tone.ToneAudioNode;
  private canvasEl: HTMLCanvasElement;
  private canvasStream: MediaRecorder | null = null;
  private canvasChunks: Blob[] = [];
  private emotionSamples: EmotionSample[] = [];
  private sampleInterval: ReturnType<typeof setInterval> | null = null;

  constructor(masterNode: Tone.ToneAudioNode, canvasEl: HTMLCanvasElement) {
    this.masterNode = masterNode;
    this.canvasEl = canvasEl;
    this.recorder = new Tone.Recorder();
    this.masterNode.connect(this.recorder);
  }

  start() {
    this.emotionSamples = [];
    this.recorder.start();

    const stream = this.canvasEl.captureStream(30);
    this.canvasStream = new MediaRecorder(stream, { mimeType: 'video/webm' });
    this.canvasChunks = [];
    this.canvasStream.ondataavailable = (e) => this.canvasChunks.push(e.data);
    this.canvasStream.start();

    this.sampleInterval = setInterval(() => {
      const { valence, arousal, confidence } = useEmotionStore.getState();
      this.emotionSamples.push({ valence, arousal, confidence });
    }, 250);
  }

  async stop(sessionId: number, title?: string) {
    if (this.sampleInterval) clearInterval(this.sampleInterval);

    const audioBlob = await this.recorder.stop();

    const videoBlob: Blob = await new Promise((resolve) => {
      if (!this.canvasStream) { resolve(new Blob()); return; }
      this.canvasStream.onstop = () => resolve(new Blob(this.canvasChunks, { type: 'video/webm' }));
      this.canvasStream.stop();
    });

    const avgValence = average(this.emotionSamples.map((s) => s.valence));
    const avgArousal = average(this.emotionSamples.map((s) => s.arousal));
    const avgConfidence = average(this.emotionSamples.map((s) => s.confidence));

    return {
      sessionId,
      audioBlob,
      videoBlob,
      durationMs: this.emotionSamples.length * 250,
      avgValence,
      avgArousal,
      avgConfidence,
      emotionLabel: emotionLabel(avgValence, avgArousal),
      title,
    };
  }
}

function average(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}
