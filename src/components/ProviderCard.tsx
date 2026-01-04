import { useState, useRef } from 'react'
import QuotaBar from './QuotaBar'

interface ModelQuota {
  name: string
  percentage: number
  resetTime: string
  used?: number
  limit?: number
}

interface AccountQuota {
  email: string
  provider: string
  quota: {
    models: ModelQuota[]
    lastUpdated: string
    isForbidden: boolean
    planType?: string
  }
}

interface ProviderCardProps {
  provider: string
  accounts: AccountQuota[]
  onModelReorder: (modelNames: string[]) => void
  modelOrder: string[]
}

const PROVIDER_INFO: Record<string, { name: string; icon: string; color: string }> = {
  'claude-code': { name: 'Claude Code', icon: '🤖', color: '#cc785c' },
  'antigravity': { name: 'Antigravity', icon: '🚀', color: '#4285f4' },
  'github-copilot': { name: 'GitHub Copilot', icon: '🐙', color: '#238636' },
  'openai-codex': { name: 'OpenAI Codex', icon: '💡', color: '#10a37f' },
  'gemini-cli': { name: 'Gemini CLI', icon: '✨', color: '#8e44ad' },
}

const MODEL_NAMES: Record<string, string> = {
  'five-hour-session': 'Session (5h)',
  'seven-day-weekly': 'Weekly',
  'seven-day-sonnet': 'Sonnet',
  'seven-day-opus': 'Opus',
  'extra-usage': 'Extra',
  'gemini-3-pro': 'Gemini 3 Pro',
  'gemini-3-pro-high': 'Gemini 3 Pro',
  'gemini-3-flash': 'Gemini 3 Flash',
  'gemini-3-flash-high': 'Gemini 3 Flash',
  'claude-sonnet-4-5': 'Claude Sonnet 4.5',
  'claude-opus-4': 'Claude Opus 4',
  'copilot-chat': 'Chat',
  'copilot-completions': 'Completions',
  'copilot-premium': 'Premium',
  'codex-session': 'Session',
  'codex-weekly': 'Weekly',
}

function formatResetTime(isoString: string): string {
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

export default function ProviderCard({ provider, accounts, onModelReorder, modelOrder }: ProviderCardProps) {
  const info = PROVIDER_INFO[provider] || { name: provider, icon: '📊', color: '#666' }
  const [draggedModel, setDraggedModel] = useState<string | null>(null)
  
  // 获取所有模型（用于拖拽排序）
  const allModels = accounts.flatMap(account => account.quota.models)
  const modelNames = allModels.map(m => m.name)

  const handleModelDragStart = (e: React.DragEvent, modelName: string) => {
    e.stopPropagation()
    setDraggedModel(modelName)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleModelDragOver = (e: React.DragEvent, targetModelName: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!draggedModel || draggedModel === targetModelName) return

    const currentOrder = modelOrder.length ? modelOrder : modelNames
    const validOrder = currentOrder.filter(name => modelNames.includes(name))
    const newModels = modelNames.filter(name => !validOrder.includes(name))
    const fullOrder = [...validOrder, ...newModels]

    const draggedIdx = fullOrder.indexOf(draggedModel)
    const targetIdx = fullOrder.indexOf(targetModelName)
    
    if (draggedIdx === -1 || targetIdx === -1) return
    
    const newOrder = [...fullOrder]
    newOrder.splice(draggedIdx, 1)
    newOrder.splice(targetIdx, 0, draggedModel)
    
    onModelReorder(newOrder)
  }

  const handleModelDragEnd = (e: React.DragEvent) => {
    e.stopPropagation()
    setDraggedModel(null)
  }
  
  return (
    <div className="provider-card" style={{ '--accent-color': info.color } as React.CSSProperties}>
      <div className="provider-header">
        <span className="provider-icon">{info.icon}</span>
        <h2 className="provider-name">{info.name}</h2>
        <span className="drag-hint">⋮⋮</span>
      </div>
      
      <div className="accounts">
        {accounts.map((account, index) => (
          <div key={`${account.email}-${index}`} className="account">
            <div className="account-header">
              <span className="account-email">{account.email}</span>
              {account.quota.planType && (
                <span className="account-plan">{account.quota.planType}</span>
              )}
            </div>
            
            {account.quota.isForbidden && (
              <div className="quota-forbidden">
                ⚠️ Rate limited
              </div>
            )}
            
            <div className="models">
              {account.quota.models.map((model) => (
                <div 
                  key={model.name} 
                  className={`model ${draggedModel === model.name ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleModelDragStart(e, model.name)}
                  onDragOver={(e) => handleModelDragOver(e, model.name)}
                  onDragEnd={handleModelDragEnd}
                >
                  <div className="model-drag-handle">⋮</div>
                  <div className="model-content">
                    <div className="model-info">
                      <span className="model-name">
                        {MODEL_NAMES[model.name] || model.name}
                      </span>
                      <span className="model-reset">
                        {formatResetTime(model.resetTime)}
                      </span>
                    </div>
                    <QuotaBar percentage={model.percentage} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
