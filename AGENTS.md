# Quota Dashboard - AI Development Context

## 项目概述

这是一个 **Electron + React + TypeScript** 桌面应用，用于监控 AI 编程工具的配额使用情况。基于 Quotio 项目的配额获取逻辑实现。

## 技术栈

- **Electron** - 桌面应用框架
- **React 18** - 前端框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具

## 项目结构

```
quota-dashboard/
├── electron/                    # Electron 主进程 (CommonJS)
│   ├── main.ts                 # 窗口创建、IPC 处理
│   ├── preload.ts              # 安全桥接 (contextBridge)
│   ├── types.ts                # 共享类型定义
│   └── services/               # 配额获取服务
│       ├── quotaService.ts     # 主入口，聚合所有提供商
│       ├── claudeCode.ts       # Claude Code 配额
│       ├── antigravity.ts      # Antigravity (Gemini) 配额
│       ├── copilot.ts          # GitHub Copilot 配额
│       └── codex.ts            # OpenAI Codex 配额
├── src/                         # React 渲染进程 (ESM)
│   ├── main.tsx                # React 入口
│   ├── App.tsx                 # 主组件，数据获取逻辑
│   ├── index.css               # 深色主题样式
│   ├── vite-env.d.ts           # Electron API 类型声明
│   └── components/
│       ├── ProviderCard.tsx    # 提供商卡片
│       └── QuotaBar.tsx        # 配额进度条
├── package.json
├── vite.config.ts
├── tsconfig.json               # React 前端 TS 配置
├── tsconfig.electron.json      # Electron 主进程 TS 配置
└── tsconfig.node.json          # Vite 配置 TS 配置
```

## 已实现功能

### 配额获取

| 提供商         | API 端点                                                      | 配置文件位置                             | 状态 |
| -------------- | ------------------------------------------------------------- | ---------------------------------------- | ---- |
| Claude Code    | `api.anthropic.com/api/oauth/usage`                           | `~/.cli-proxy-api/claude-*.json`         | ✅   |
| Antigravity    | `cloudcode-pa.googleapis.com/v1internal:fetchAvailableModels` | `~/.cli-proxy-api/antigravity-*.json`    | ✅   |
| GitHub Copilot | `api.github.com/copilot_internal/user`                        | `~/.cli-proxy-api/github-copilot-*.json` | ✅   |
| OpenAI Codex   | `chatgpt.com/backend-api/wham/usage`                          | `~/.codex/auth.json`                     | ✅   |

### UI 功能

- ✅ 深色主题
- ✅ 配额进度条（颜色根据剩余百分比变化）
- ✅ 重置时间显示（相对时间格式）
- ✅ 自动刷新（每 5 分钟）
- ✅ 手动刷新按钮
- ✅ 开发模式使用模拟数据

## 运行命令

```bash
# 安装依赖
npm install

# 仅运行前端（开发预览，使用模拟数据）
npm run dev:vite

# 运行完整 Electron 应用
npm run dev

# 构建生产版本
npm run build
```

## IPC 通信

渲染进程通过 `window.electronAPI` 与主进程通信：

```typescript
// preload.ts 暴露的 API
window.electronAPI.getAllQuotas(); // 返回 Promise<{ success: boolean, data?: AccountQuota[] }>
```

## 待开发功能

### 高优先级

1. **Token 刷新优化** - 当 access_token 过期时自动使用 refresh_token 刷新
2. **错误处理改进** - 区分网络错误、认证错误、配额不可用等情况
3. **本地缓存** - 缓存配额数据，减少 API 调用
4. **系统托盘** - 菜单栏图标显示配额概览

### 中优先级

5. **通知功能** - 配额低于阈值时发送系统通知
6. **配置界面** - 让用户配置刷新间隔、通知阈值等
7. **更多提供商** - Cursor、Trae、Gemini CLI (仅账户信息)

### 低优先级

8. **应用打包** - 使用 electron-builder 打包为 .dmg/.exe
9. **自动更新** - 集成 Sparkle 或 electron-updater
10. **多语言支持** - 中英文切换

## 关键代码参考

### 配额数据类型 (electron/types.ts)

```typescript
interface ModelQuota {
  name: string; // 模型/配额名称
  percentage: number; // 剩余百分比 (0-100)，-1 表示未知
  resetTime: string; // ISO8601 格式重置时间
}

interface AccountQuota {
  email: string; // 账户标识
  provider: ProviderType;
  quota: ProviderQuotaData;
}
```

### API 调用模式 (以 Claude 为例)

```typescript
// 1. 读取本地配置文件获取 access_token
const authFile = JSON.parse(fs.readFileSync("~/.cli-proxy-api/claude-*.json"));
const accessToken = authFile.access_token;

// 2. 调用配额 API
const response = await fetch("https://api.anthropic.com/api/oauth/usage", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "anthropic-beta": "oauth-2025-04-20",
  },
});

// 3. 解析返回数据，计算剩余百分比
const data = await response.json();
const remaining = 100 - data.five_hour.utilization;
```

## 相关资源

- **原始项目 Quotio**: `/Users/menglingyu/My/quotio/` - Swift 实现的 macOS 原生应用
- **配额获取逻辑参考**: `Quotio/Services/QuotaFetchers/` 目录下的 Swift 实现

## 开发注意事项

1. **CORS 无限制** - Electron 主进程不受 CORS 限制，可直接调用任何 API
2. **类型断言** - `response.json()` 返回 `unknown`，需要 `as Type` 断言
3. **开发模式检测** - 使用 `app.isPackaged` 而非环境变量
4. **端口冲突** - Vite 可能使用 5173-5176 端口，main.ts 会自动尝试连接
