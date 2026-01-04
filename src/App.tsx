import { useState, useEffect, useCallback, useRef } from 'react'
import ProviderCard from './components/ProviderCard'

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

interface SortOrder {
  providers: string[]
  models: Record<string, string[]>
}

const STORAGE_KEY = 'quota-dashboard-sort-order'

function loadSortOrder(): SortOrder {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {
    // ignore
  }
  return { providers: [], models: {} }
}

function saveSortOrder(order: SortOrder): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(order))
}

function App() {
  const [quotas, setQuotas] = useState<AccountQuota[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>(loadSortOrder)
  const [draggedProvider, setDraggedProvider] = useState<string | null>(null)

  const fetchQuotas = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.getAllQuotas()
        if (result.success && result.data) {
          setQuotas(result.data)
          setLastRefresh(new Date())
        } else {
          setError(result.error || 'Failed to fetch quotas')
        }
      } else {
        setQuotas(getMockData())
        setLastRefresh(new Date())
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQuotas()
    const interval = setInterval(fetchQuotas, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchQuotas])

  // 按提供商分组
  const groupedQuotas = quotas.reduce((acc, quota) => {
    if (!acc[quota.provider]) {
      acc[quota.provider] = []
    }
    acc[quota.provider].push(quota)
    return acc
  }, {} as Record<string, AccountQuota[]>)

  // 根据保存的顺序排列 providers
  const sortedProviders = (() => {
    const allProviders = Object.keys(groupedQuotas)
    const savedOrder = sortOrder.providers.filter(p => allProviders.includes(p))
    const newProviders = allProviders.filter(p => !savedOrder.includes(p))
    return [...savedOrder, ...newProviders]
  })()

  // Provider 拖拽处理
  const handleProviderDragStart = (provider: string) => {
    setDraggedProvider(provider)
  }

  const handleProviderDragOver = (e: React.DragEvent, provider: string) => {
    e.preventDefault()
    if (!draggedProvider || draggedProvider === provider) return
    
    const newOrder = [...sortedProviders]
    const draggedIdx = newOrder.indexOf(draggedProvider)
    const targetIdx = newOrder.indexOf(provider)
    
    newOrder.splice(draggedIdx, 1)
    newOrder.splice(targetIdx, 0, draggedProvider)
    
    const newSortOrder = { ...sortOrder, providers: newOrder }
    setSortOrder(newSortOrder)
    saveSortOrder(newSortOrder)
  }

  const handleProviderDragEnd = () => {
    setDraggedProvider(null)
  }

  // Model 排序处理
  const handleModelReorder = (provider: string, modelNames: string[]) => {
    const newSortOrder = {
      ...sortOrder,
      models: { ...sortOrder.models, [provider]: modelNames }
    }
    setSortOrder(newSortOrder)
    saveSortOrder(newSortOrder)
  }

  // 获取排序后的 models
  const getSortedModels = (provider: string, accounts: AccountQuota[]): AccountQuota[] => {
    const savedModelOrder = sortOrder.models[provider]
    if (!savedModelOrder || savedModelOrder.length === 0) return accounts

    return accounts.map(account => ({
      ...account,
      quota: {
        ...account.quota,
        models: [...account.quota.models].sort((a, b) => {
          const aIdx = savedModelOrder.indexOf(a.name)
          const bIdx = savedModelOrder.indexOf(b.name)
          if (aIdx === -1 && bIdx === -1) return 0
          if (aIdx === -1) return 1
          if (bIdx === -1) return -1
          return aIdx - bIdx
        })
      }
    }))
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Quota Dashboard</h1>
        <div className="header-actions">
          {lastRefresh && (
            <span className="last-refresh">
              Updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button 
            className="refresh-btn" 
            onClick={fetchQuotas}
            disabled={loading}
          >
            {loading ? '⟳' : '↻'} Refresh
          </button>
        </div>
      </header>

      <main className="main">
        {loading && quotas.length === 0 && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading quotas...</p>
          </div>
        )}

        {error && (
          <div className="error">
            <p>⚠️ {error}</p>
            <button onClick={fetchQuotas}>Retry</button>
          </div>
        )}

        {!loading && quotas.length === 0 && !error && (
          <div className="empty">
            <p>No configured accounts found.</p>
            <p className="hint">
              Please log in to Claude Code, Codex CLI, or other AI coding tools first.
            </p>
          </div>
        )}

        <div className="providers-grid">
          {sortedProviders.map((provider) => (
            <div
              key={provider}
              draggable
              onDragStart={() => handleProviderDragStart(provider)}
              onDragOver={(e) => handleProviderDragOver(e, provider)}
              onDragEnd={handleProviderDragEnd}
              className={`provider-wrapper ${draggedProvider === provider ? 'dragging' : ''}`}
            >
              <ProviderCard 
                provider={provider} 
                accounts={getSortedModels(provider, groupedQuotas[provider])}
                onModelReorder={(modelNames) => handleModelReorder(provider, modelNames)}
                modelOrder={sortOrder.models[provider] || []}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

// 开发模式模拟数据
function getMockData(): AccountQuota[] {
  return [
    {
      email: 'user@example.com',
      provider: 'claude-code',
      quota: {
        models: [
          { name: 'five-hour-session', percentage: 75, resetTime: new Date(Date.now() + 3600000).toISOString() },
          { name: 'seven-day-weekly', percentage: 45, resetTime: new Date(Date.now() + 86400000 * 3).toISOString() },
        ],
        lastUpdated: new Date().toISOString(),
        isForbidden: false,
        planType: 'Max',
      },
    },
    {
      email: 'dev@gmail.com',
      provider: 'antigravity',
      quota: {
        models: [
          { name: 'gemini-3-pro', percentage: 88, resetTime: new Date(Date.now() + 7200000).toISOString() },
          { name: 'gemini-3-flash', percentage: 62, resetTime: new Date(Date.now() + 7200000).toISOString() },
        ],
        lastUpdated: new Date().toISOString(),
        isForbidden: false,
        planType: 'Pro',
      },
    },
    {
      email: 'github-user',
      provider: 'github-copilot',
      quota: {
        models: [
          { name: 'copilot-chat', percentage: 90, resetTime: new Date(Date.now() + 86400000 * 7).toISOString() },
          { name: 'copilot-completions', percentage: 95, resetTime: new Date(Date.now() + 86400000 * 7).toISOString() },
        ],
        lastUpdated: new Date().toISOString(),
        isForbidden: false,
        planType: 'Pro',
      },
    },
  ]
}

export default App
