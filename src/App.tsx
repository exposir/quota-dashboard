import { useState, useEffect, useCallback } from 'react'
import ProviderCard from './components/ProviderCard'

interface AccountQuota {
  email: string
  provider: string
  quota: {
    models: Array<{
      name: string
      percentage: number
      resetTime: string
      used?: number
      limit?: number
    }>
    lastUpdated: string
    isForbidden: boolean
    planType?: string
  }
}

function App() {
  const [quotas, setQuotas] = useState<AccountQuota[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchQuotas = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 检查是否在 Electron 环境中
      if (window.electronAPI) {
        const result = await window.electronAPI.getAllQuotas()
        if (result.success && result.data) {
          setQuotas(result.data)
          setLastRefresh(new Date())
        } else {
          setError(result.error || 'Failed to fetch quotas')
        }
      } else {
        // 开发模式：使用模拟数据
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
    
    // 每 5 分钟自动刷新
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
          {Object.entries(groupedQuotas).map(([provider, accounts]) => (
            <ProviderCard 
              key={provider} 
              provider={provider} 
              accounts={accounts} 
            />
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
