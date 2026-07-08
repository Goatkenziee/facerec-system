# FaceRec - Real-time Facial Detection System

A real-time facial detection web app that uses your browser camera. All processing happens on-device — no images are sent to any server.

## Features

- **Live camera feed** with start/stop controls
- **FaceDetector API** (Chrome) — bounding boxes + facial landmarks
- **Skin-tone heuristic fallback** for other browsers
- **Real-time status dashboard** — camera status, detection status, face count
- **Privacy-first** — everything runs in-browser

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click "Start Camera" to begin.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Web APIs (MediaDevices, Canvas, FaceDetector)

## Browser Support

- **Chrome/Edge** — Full support with FaceDetector API (bounding boxes + landmarks)
- **Firefox/Safari** — Skin-tone heuristic fallback
