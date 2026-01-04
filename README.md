# AI Quota Dashboard

监控 AI 代码助手使用配额的 Electron 桌面应用。

![License](https://img.shields.io/badge/license-MIT-blue.svg)

**[English](./README_EN.md)** | 中文

## 功能特性

- 📊 **统一面板** — 在一处查看所有 AI 工具配额
- 🔄 **自动刷新** — 每 5 分钟自动更新
- 🎨 **现代界面** — 简洁响应式设计，支持深色模式
- ⚡ **轻量级** — 基于 Electron + React + Vite 构建
- 🔀 **拖拽排序** — 支持拖拽调整 Provider 和 Model 顺序

## 文档

- [技术方案存档](./docs/README.md) — 实现细节与技术文档

## 支持的工具

| 服务商         | 状态      |
| -------------- | --------- |
| Claude Code    | 🟢 计划中 |
| GitHub Copilot | 🟢 计划中 |
| Antigravity    | 🟢 计划中 |
| OpenAI Codex   | 🟢 计划中 |

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装

```bash
# 克隆仓库
git clone https://github.com/exposir/quota-dashboard.git
cd quota-dashboard

# 安装依赖
npm install

# 开发模式运行
npm run dev
```

### 构建

```bash
npm run build
```

## 技术栈

- **框架**: Electron 33
- **前端**: React 18 + TypeScript
- **构建工具**: Vite 6
- **样式**: Vanilla CSS

## 项目结构

```
quota-dashboard/
├── electron/          # Electron 主进程
│   ├── main.ts
│   ├── preload.ts
│   └── services/      # 配额获取服务
├── src/               # React 渲染进程
│   ├── App.tsx
│   └── components/
├── docs/              # 技术文档
├── index.html
└── package.json
```

## 许可证

MIT © [exposir](https://github.com/exposir)
