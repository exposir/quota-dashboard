# AI Quota Dashboard

A sleek Electron desktop application to monitor usage quotas for AI coding assistants.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

English | **[中文](./README.md)**

## Features

- 📊 **Unified Dashboard** — View all your AI tool quotas in one place
- 🔄 **Auto Refresh** — Automatically updates every 5 minutes
- 🎨 **Modern UI** — Clean, responsive interface with dark mode support
- ⚡ **Lightweight** — Built with Electron + React + Vite
- 🔀 **Drag & Drop** — Reorder providers and models with drag and drop

## Documentation

- [Technical Docs](./docs/README.md) — Implementation details

## Supported Tools

| Provider       | Status     |
| -------------- | ---------- |
| Claude Code    | 🟢 Planned |
| GitHub Copilot | 🟢 Planned |
| Antigravity    | 🟢 Planned |
| OpenAI Codex   | 🟢 Planned |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/exposir/quota-dashboard.git
cd quota-dashboard

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Build

```bash
npm run build
```

## Tech Stack

- **Framework**: Electron 33
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Vanilla CSS

## Project Structure

```
quota-dashboard/
├── electron/          # Electron main process
│   ├── main.ts
│   ├── preload.ts
│   └── services/      # Quota fetching services
├── src/               # React renderer
│   ├── App.tsx
│   └── components/
├── docs/              # Technical docs
├── index.html
└── package.json
```

## License

MIT © [exposir](https://github.com/exposir)
