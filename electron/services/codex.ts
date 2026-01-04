// OpenAI Codex 配额获取
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { AccountQuota, ModelQuota, ProviderQuotaData } from '../types'

const AUTH_FILE = path.join(os.homedir(), '.codex', 'auth.json')
const USAGE_URL = 'https://chatgpt.com/backend-api/wham/usage'
const REFRESH_URL = 'https://auth.openai.com/oauth/token'
const CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann'

interface CodexAuthFile {
  tokens?: {
    access_token?: string
    refresh_token?: string
    id_token?: string
  }
}

interface CodexUsageResponse {
  plan_type?: string
  rate_limit?: {
    limit_reached?: boolean
    primary_window?: { used_percent?: number; reset_at?: number }
    secondary_window?: { used_percent?: number; reset_at?: number }
  }
}

export async function fetchCodexQuotas(): Promise<AccountQuota[]> {
  const results: AccountQuota[] = []
  
  if (!fs.existsSync(AUTH_FILE)) {
    return results
  }
  
  try {
    const content = fs.readFileSync(AUTH_FILE, 'utf-8')
    const authFile: CodexAuthFile = JSON.parse(content)
    
    if (!authFile.tokens?.access_token) {
      return results
    }
    
    let accessToken = authFile.tokens.access_token
    
    // 检查 token 是否过期并刷新
    if (isTokenExpired(accessToken) && authFile.tokens.refresh_token) {
      const newToken = await refreshAccessToken(authFile.tokens.refresh_token)
      if (newToken) {
        accessToken = newToken
      }
    }
    
    // 从 id_token 解析邮箱
    const email = authFile.tokens.id_token 
      ? extractEmailFromJWT(authFile.tokens.id_token) 
      : 'Codex User'
    
    const quota = await fetchUsageFromAPI(accessToken)
    if (quota) {
      results.push({
        email,
        provider: 'openai-codex',
        quota,
      })
    }
  } catch (error) {
    console.error('Failed to fetch Codex quota:', error)
  }
  
  return results
}

function isTokenExpired(accessToken: string): boolean {
  try {
    const parts = accessToken.split('.')
    if (parts.length < 2) return true
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    const exp = payload.exp
    
    if (!exp) return true
    return Date.now() >= exp * 1000 - 60000 // 60 秒缓冲
  } catch {
    return true
  }
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch(REFRESH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
      }),
    })
    
    if (!response.ok) return null
    
    const data = await response.json() as { access_token: string }
    return data.access_token
  } catch {
    return null
  }
}

async function fetchUsageFromAPI(accessToken: string): Promise<ProviderQuotaData | null> {
  try {
    const response = await fetch(USAGE_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    })
    
    if (!response.ok) return null
    
    const data = await response.json() as CodexUsageResponse
    const models: ModelQuota[] = []
    
    if (data.rate_limit) {
      const { primary_window, secondary_window } = data.rate_limit
      
      // Session (3 hour window)
      if (primary_window) {
        models.push({
          name: 'codex-session',
          percentage: 100 - (primary_window.used_percent || 0),
          resetTime: primary_window.reset_at 
            ? new Date(primary_window.reset_at * 1000).toISOString() 
            : '',
        })
      }
      
      // Weekly window
      if (secondary_window) {
        models.push({
          name: 'codex-weekly',
          percentage: 100 - (secondary_window.used_percent || 0),
          resetTime: secondary_window.reset_at 
            ? new Date(secondary_window.reset_at * 1000).toISOString() 
            : '',
        })
      }
    }
    
    return {
      models,
      lastUpdated: new Date(),
      isForbidden: data.rate_limit?.limit_reached || false,
      planType: data.plan_type,
    }
  } catch (error) {
    console.error('Codex API error:', error)
    return null
  }
}

function extractEmailFromJWT(token: string): string {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return 'Codex User'
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    return payload.email || 'Codex User'
  } catch {
    return 'Codex User'
  }
}
