import * as Tone from 'tone';

const SCALES: Record<string, string[]> = {
  minor: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4'],
  major: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'],
  dorian: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'Bb4'],
  lydian: ['C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'B4'],
};

export class AudioEngine {
  private synth: Tone.PolySynth;
  private filter: Tone.Filter;
  private reverb: Tone.Reverb;
  private loop: Tone.Loop | null = null;

  constructor() {
    this.reverb = new Tone.Reverb(2.5).toDestination();
    this.filter = new Tone.Filter(1200, 'lowpass').connect(this.reverb);
    this.synth = new Tone.PolySynth(Tone.Synth).connect(this.filter);
  }

  async start() {
    await Tone.start();
    Tone.Transport.start();
  }

  update(valence: number, arousal: number) {
    const bpm = 70 + (arousal + 1) * 35;
    const cutoff = 400 + (arousal + 1) * 3000;
    const scaleKey = valence >= 0 ? (arousal >= 0 ? 'lydian' : 'major') : (arousal >= 0 ? 'dorian' : 'minor');
    const density = 2 + Math.round((arousal + 1) * 3);

    Tone.Transport.bpm.rampTo(bpm, 1.5);
    this.filter.frequency.rampTo(cutoff, 1.5);
    this.reverb.wet.rampTo(0.6 - (arousal + 1) * 0.15, 1.5);

    if (this.loop) this.loop.dispose();
    const scale = SCALES[scaleKey];
    this.loop = new Tone.Loop((time) => {
      const note = scale[Math.floor(Math.random() * scale.length)];
      this.synth.triggerAttackRelease(note, '8n', time);
    }, `${(60 / density).toFixed(2)}n`).start(0);
  }

  stop() {
    Tone.Transport.stop();
    this.loop?.dispose();
  }
}
