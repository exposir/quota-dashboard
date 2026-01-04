// Antigravity 配额获取
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { AccountQuota, ModelQuota, ProviderQuotaData } from '../types'

const AUTH_DIR = path.join(os.homedir(), '.cli-proxy-api')
const QUOTA_API = 'https://cloudcode-pa.googleapis.com/v1internal:fetchAvailableModels'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const CLIENT_ID = '1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com'
const CLIENT_SECRET = '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'

interface AntigravityAuthFile {
  access_token: string
  email: string
  expired?: string
  refresh_token?: string
}

interface QuotaAPIResponse {
  models: Record<string, { quotaInfo?: { remainingFraction?: number; resetTime?: string } }>
}

export async function fetchAntigravityQuotas(): Promise<AccountQuota[]> {
  const results: AccountQuota[] = []
  
  if (!fs.existsSync(AUTH_DIR)) {
    return results
  }
  
  const files = fs.readdirSync(AUTH_DIR)
    .filter(f => f.startsWith('antigravity-') && f.endsWith('.json'))
  
  for (const file of files) {
    try {
      const filePath = path.join(AUTH_DIR, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const authFile: AntigravityAuthFile = JSON.parse(content)
      
      let accessToken = authFile.access_token
      
      // 检查 token 是否过期，如果过期则刷新
      if (isTokenExpired(authFile.expired) && authFile.refresh_token) {
        const newToken = await refreshAccessToken(authFile.refresh_token)
        if (newToken) {
          accessToken = newToken
          // 更新本地文件
          authFile.access_token = newToken
          authFile.expired = new Date(Date.now() + 3600 * 1000).toISOString()
          fs.writeFileSync(filePath, JSON.stringify(authFile, null, 2))
        }
      }
      
      const quota = await fetchQuotaFromAPI(accessToken)
      if (quota) {
        results.push({
          email: authFile.email || extractEmailFromFilename(file),
          provider: 'antigravity',
          quota,
        })
      }
    } catch (error) {
      console.error(`Failed to fetch Antigravity quota for ${file}:`, error)
    }
  }
  
  return results
}

function isTokenExpired(expiredStr?: string): boolean {
  if (!expiredStr) return true
  try {
    const expiry = new Date(expiredStr)
    return Date.now() > expiry.getTime()
  } catch {
    return true
  }
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    })
    
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    
    if (!response.ok) return null
    
    const data = await response.json() as { access_token: string }
    return data.access_token
  } catch {
    return null
  }
}

async function fetchQuotaFromAPI(accessToken: string): Promise<ProviderQuotaData | null> {
  try {
    const response = await fetch(QUOTA_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'antigravity/1.11.3 Darwin/arm64',
      },
      body: JSON.stringify({}),
    })
    
    if (response.status === 403) {
      return { models: [], lastUpdated: new Date(), isForbidden: true }
    }
    
    if (!response.ok) return null
    
    const data = await response.json() as QuotaAPIResponse
    const models: ModelQuota[] = []
    
    for (const [name, info] of Object.entries(data.models)) {
      // 只显示 Gemini 和 Claude 模型
      if (!name.includes('gemini') && !name.includes('claude')) continue
      
      if (info.quotaInfo) {
        models.push({
          name,
          percentage: (info.quotaInfo.remainingFraction || 0) * 100,
          resetTime: info.quotaInfo.resetTime || '',
        })
      }
    }
    
    return {
      models,
      lastUpdated: new Date(),
      isForbidden: false,
    }
  } catch (error) {
    console.error('Antigravity API error:', error)
    return null
  }
}

function extractEmailFromFilename(filename: string): string {
  return filename
    .replace('antigravity-', '')
    .replace('.json', '')
    .replace(/_/g, '.')
    .replace('.gmail.com', '@gmail.com')
}
