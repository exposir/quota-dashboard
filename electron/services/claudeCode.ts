// Claude Code 配额获取
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { AccountQuota, ModelQuota, ProviderQuotaData } from '../types'

const AUTH_DIR = path.join(os.homedir(), '.cli-proxy-api')
const USAGE_API = 'https://api.anthropic.com/api/oauth/usage'

interface ClaudeAuthFile {
  access_token: string
  email?: string
  refresh_token?: string
}

interface ClaudeUsageResponse {
  five_hour?: { utilization: number; resets_at: string }
  seven_day?: { utilization: number; resets_at: string }
  seven_day_sonnet?: { utilization: number; resets_at: string }
  seven_day_opus?: { utilization: number; resets_at: string }
  extra_usage?: { is_enabled: boolean; utilization?: number }
}

export async function fetchClaudeCodeQuotas(): Promise<AccountQuota[]> {
  const results: AccountQuota[] = []
  
  if (!fs.existsSync(AUTH_DIR)) {
    return results
  }
  
  const files = fs.readdirSync(AUTH_DIR)
    .filter(f => f.startsWith('claude-') && f.endsWith('.json'))
  
  for (const file of files) {
    try {
      const filePath = path.join(AUTH_DIR, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const authFile: ClaudeAuthFile = JSON.parse(content)
      
      if (!authFile.access_token) continue
      
      const quota = await fetchUsageFromAPI(authFile.access_token)
      if (quota) {
        results.push({
          email: authFile.email || extractEmailFromFilename(file),
          provider: 'claude-code',
          quota,
        })
      }
    } catch (error) {
      console.error(`Failed to fetch Claude quota for ${file}:`, error)
    }
  }
  
  return results
}

async function fetchUsageFromAPI(accessToken: string): Promise<ProviderQuotaData | null> {
  try {
    const response = await fetch(USAGE_API, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'anthropic-beta': 'oauth-2025-04-20',
      },
    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json() as ClaudeUsageResponse
    const models: ModelQuota[] = []
    
    if (data.five_hour) {
      models.push({
        name: 'five-hour-session',
        percentage: Math.max(0, 100 - data.five_hour.utilization),
        resetTime: data.five_hour.resets_at || '',
      })
    }
    
    if (data.seven_day) {
      models.push({
        name: 'seven-day-weekly',
        percentage: Math.max(0, 100 - data.seven_day.utilization),
        resetTime: data.seven_day.resets_at || '',
      })
    }
    
    if (data.seven_day_sonnet) {
      models.push({
        name: 'seven-day-sonnet',
        percentage: Math.max(0, 100 - data.seven_day_sonnet.utilization),
        resetTime: data.seven_day_sonnet.resets_at || '',
      })
    }
    
    if (data.seven_day_opus) {
      models.push({
        name: 'seven-day-opus',
        percentage: Math.max(0, 100 - data.seven_day_opus.utilization),
        resetTime: data.seven_day_opus.resets_at || '',
      })
    }
    
    if (data.extra_usage?.is_enabled && data.extra_usage.utilization !== undefined) {
      models.push({
        name: 'extra-usage',
        percentage: Math.max(0, 100 - data.extra_usage.utilization),
        resetTime: '',
      })
    }
    
    return {
      models,
      lastUpdated: new Date(),
      isForbidden: false,
    }
  } catch (error) {
    console.error('Claude API error:', error)
    return null
  }
}

function extractEmailFromFilename(filename: string): string {
  // claude-user_example_com.json -> user@example.com
  return filename
    .replace('claude-', '')
    .replace('.json', '')
    .replace(/_/g, '.')
    .replace('.gmail.com', '@gmail.com')
}
