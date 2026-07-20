# NeuroCanvas

**EEG → Emotion → Audio/Visual Generator**

NeuroCanvas is a desktop app that reads live brainwave data from consumer EEG headsets (Muse S, Muse 2, OpenBCI Cyton), estimates emotional state (valence/arousal), and drives generative music + reactive visuals in real time.

Built with **Tauri + React + TypeScript** frontend and a **Python** signal-processing backend, communicating via WebSocket. Local-first and privacy-respecting — all data stays on your machine.

![TypeScript](https://img.shields.io/badge/language-TypeScript-3178C6) ![Rust](https://img.shields.io/badge/language-Rust-000000) ![React](https://img.shields.io/badge/framework-React-61DAFB) ![Tauri](https://img.shields.io/badge/desktop-Tauri-FFC131)

---

## Features

- **Connect & Verify** — Select your EEG headset (or use Demo mode), verify signal quality per channel
- **Listen Mode** — Live generative music (Tone.js) + 3D particle visuals (Three.js) driven by your emotions
- **Save Clips** — Record audio + video with emotion tags during sessions
- **Media Library** — Browse, filter by emotion label, favorite saved clips
- **Session Log** — View past sessions with SVG emotion timeline (valence/arousal over time)
- **Calibration** — Establish baseline brain activity for personalized mapping

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install) (for Tauri)
- [Python](https://www.python.org/) 3.10+ (optional, for signal service development)

### Quick Start (Development)

```bash
# Clone the repo
git clone https://github.com/Thefightingfrogoffrance/neurocanvas.git
cd neurocanvas

# Install JS dependencies
npm install

# Run in dev mode (hot-reload frontend + Tauri window)
npm run tauri dev
```

### Build for Distribution

```bash
npm run tauri build
```

The installer (`.msi` on Windows, `.dmg` on macOS, `.AppImage` on Linux) will be in `src-tauri/target/release/bundle/`.

---

## Usage

1. **Launch NeuroCanvas** — The app opens to the Connect screen.
2. **Select a device** — Choose your EEG headset from the dropdown, or pick "Demo mode (no headset)" to try without hardware.
3. **Verify connection** — Click "Verify Connection". The Python signal service checks channel quality. You need 60%+ overall quality to pass.
4. **Navigate to Listen** — Once verified, use the tab bar (Listen, Media Library, Session Log, Calibrate).
5. **Start a session** — Click "Start Session". The audio engine begins playing generative music, and 3D particles react to your emotion data in real time.
6. **Save clips** — Click "Save Clip" to record a 5-second audio/video capture tagged with the current emotion.
7. **Review** — Use Media Library to browse saved clips, Session Log to review emotion timelines.

### Emotion Mapping

| Valence | Arousal | Emotion |
|---------|---------|---------|
| ≥ 0     | ≥ 0.3   | Excited |
| ≥ 0     | < 0.3   | Content |
| ≥ 0     | ≤ -0.3  | Calm    |
| < 0     | ≥ 0.3   | Tense   |
| < 0     | < 0     | Sad     |
| ~ 0     | ~ 0     | Neutral |

---

## Project Structure

```
neurocanvas/
├── src/                          # React frontend
│   ├── components/
│   │   ├── ConnectScreen.tsx     # Device selector + verification UI
│   │   ├── VisualCanvas.tsx      # Three.js reactive particle system
│   │   ├── EmotionMeters.tsx     # Valence/arousal/confidence bars
│   │   ├── SessionLog.tsx        # Session history + SVG emotion timeline
│   │   ├── MediaLibrary.tsx      # Browse/filter saved clips
│   │   └── ImportMedia.tsx       # Import external files with emotion tags
│   ├── engines/
│   │   ├── audioEngine.ts        # Tone.js generative music engine
│   │   ├── visualEngine.ts       # Maps emotion params to visual settings
│   │   └── mediaCapture.ts       # Records audio+video with emotion data
│   ├── state/
│   │   ├── emotionStore.ts       # Zustand store with exponential smoothing
│   │   ├── wsClient.ts           # WebSocket client → Python signal service
│   │   └── connectionStore.ts    # Device verification state machine
│   ├── db/
│   │   ├── sessions.ts           # CRUD for sessions + emotion samples
│   │   └── media.ts              # CRUD for media items + device connections
│   ├── types/
│   │   └── index.ts              # All TypeScript interfaces
│   ├── App.tsx                   # Main app shell + tab routing
│   ├── main.tsx                  # React entry point
│   ├── App.css / index.css       # Styles
│   └── assets/                   # Static assets
│
├── src-tauri/                    # Tauri (Rust shell)
│   ├── src/
│   │   ├── main.rs               # Entry point
│   │   └── lib.rs                # Plugin setup, SQLite migrations, sidecar launch
│   ├── binaries/                 # Prebuilt Python signal service (sidecar)
│   ├── icons/                    # App icons
│   ├── tauri.conf.json           # Tauri configuration
│   └── Cargo.toml                # Rust dependencies
│
├── package.json                  # JS dependencies & scripts
├── vite.config.ts                # Vite bundler config
├── tsconfig.json                 # TypeScript config
└── .gitignore
```

### Key Data Flow

```
EEG Headset → Python Signal Service (WebSocket) → React App
                                                      ├── Emotion Store (Zustand)
                                                      ├── Audio Engine (Tone.js)
                                                      ├── Visual Canvas (Three.js)
                                                      └── SQLite DB (Tauri plugin)
```

### Database Tables

- **sessions** — Recording sessions with device name, timestamps
- **emotion_samples** — Time-series valence/arousal/confidence + band powers
- **media_items** — Saved clips with emotion labels, file paths, metadata
- **calibration_profiles** — Baseline brain activity references
- **device_connections** — Connection history with channel quality reports

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Tauri 2 (Rust) |
| Frontend | React 19 + TypeScript + Vite |
| 3D Graphics | Three.js + React Three Fiber |
| Audio Synthesis | Tone.js |
| State Management | Zustand |
| Database | SQLite (via tauri-plugin-sql) |
| Signal Processing | Python (BrainFlow, NumPy, SciPy) |
| Communication | WebSocket (Python ↔ Frontend) |

---

## Signal Service

The Python signal service is bundled as a Tauri sidecar binary. It handles:

- Reading raw EEG data from Muse / OpenBCI via BrainFlow
- Digital filtering (notch, bandpass, artifact rejection)
- Feature extraction (band powers, frontal alpha asymmetry)
- Heuristic emotion classification (valence/arousal from EEG features)
- Channel quality assessment for device verification

Source code and development instructions for the signal service are maintained separately. The prebuilt binary lives in `src-tauri/binaries/`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (browser-only) |
| `npm run build` | TypeScript check + Vite production build |
| `npm run tauri dev` | Run full Tauri desktop app in dev mode |
| `npm run tauri build` | Build distributable installer |
| `npm run lint` | Run Oxlint code analysis |
| `npm run preview` | Preview Vite production build |

---

## License

MIT
