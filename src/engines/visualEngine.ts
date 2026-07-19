export function mapEmotionToVisualParams(valence: number, arousal: number) {
  return {
    hue: ((valence + 1) * 0.5) * 200,
    saturation: 0.6 + (arousal * 0.3),
    motionSpeed: (arousal + 1) * 0.75,
    particleCount: Math.round(100 + (arousal + 1) * 150),
    shapeSharpness: (valence + 1) * 0.5,
  };
}
