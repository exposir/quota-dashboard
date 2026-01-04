// 配额数据类型定义

export interface ModelQuota {
  name: string
  percentage: number  // 剩余百分比 (0-100)，-1 表示未知
  resetTime: string   // ISO8601 格式的重置时间
  used?: number       // 已使用量
  limit?: number      // 总额度
}

export interface ProviderQuotaData {
  models: ModelQuota[]
  lastUpdated: Date
  isForbidden: boolean
  planType?: string
}

export interface AccountQuota {
  email: string
  provider: ProviderType
  quota: ProviderQuotaData
}

export type ProviderType = 
  | 'claude-code'
  | 'antigravity'
  | 'github-copilot'
  | 'openai-codex'
  | 'gemini-cli'

export interface ProviderInfo {
  id: ProviderType
  name: string
  icon: string
  color: string
}

export const PROVIDERS: Record<ProviderType, ProviderInfo> = {
  'claude-code': {
    id: 'claude-code',
    name: 'Claude Code',
    icon: '🤖',
    color: '#cc785c',
  },
  'antigravity': {
    id: 'antigravity',
    name: 'Antigravity',
    icon: '🚀',
    color: '#4285f4',
  },
  'github-copilot': {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    icon: '🐙',
    color: '#238636',
  },
  'openai-codex': {
    id: 'openai-codex',
    name: 'OpenAI Codex',
    icon: '💡',
    color: '#10a37f',
  },
  'gemini-cli': {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    icon: '✨',
    color: '#8e44ad',
  },
}

// 模型名称映射
export function getModelDisplayName(name: string): string {
  const displayNames: Record<string, string> = {
    // Claude Code
    'five-hour-session': 'Session (5h)',
    'seven-day-weekly': 'Weekly',
    'seven-day-sonnet': 'Sonnet',
    'seven-day-opus': 'Opus',
    'extra-usage': 'Extra',
    // Antigravity
    'gemini-3-pro': 'Gemini 3 Pro',
    'gemini-3-flash': 'Gemini 3 Flash',
    'claude-sonnet-4-5': 'Claude Sonnet 4.5',
    'claude-opus-4': 'Claude Opus 4',
    // Copilot
    'copilot-chat': 'Chat',
    'copilot-completions': 'Completions',
    'copilot-premium': 'Premium',
    // Codex
    'codex-session': 'Session',
    'codex-weekly': 'Weekly',
  }
  return displayNames[name] || name
}

// 格式化重置时间
export function formatResetTime(isoString: string): string {
  if (!isoString) return '—'
  
  const resetDate = new Date(isoString)
  const now = new Date()
  const diffMs = resetDate.getTime() - now.getTime()
  
  if (diffMs <= 0) return 'now'
  
  const minutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else {
    return `${Math.max(1, minutes)}m`
  }
}
