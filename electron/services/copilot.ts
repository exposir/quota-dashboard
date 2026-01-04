// GitHub Copilot 配额获取
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { AccountQuota, ModelQuota, ProviderQuotaData } from '../types'

const AUTH_DIR = path.join(os.homedir(), '.cli-proxy-api')
const ENTITLEMENT_URL = 'https://api.github.com/copilot_internal/user'

interface CopilotAuthFile {
  access_token: string
  username?: string
}

interface CopilotQuotaSnapshot {
  remaining?: number
  entitlement?: number
  percent_remaining?: number
  unlimited?: boolean
}

interface CopilotEntitlement {
  access_type_sku?: string
  copilot_plan?: string
  quota_reset_date?: string
  quota_reset_date_utc?: string
  quota_snapshots?: {
    chat?: CopilotQuotaSnapshot
    completions?: CopilotQuotaSnapshot
    premium_interactions?: CopilotQuotaSnapshot
  }
}

export async function fetchCopilotQuotas(): Promise<AccountQuota[]> {
  const results: AccountQuota[] = []
  
  if (!fs.existsSync(AUTH_DIR)) {
    return results
  }
  
  const files = fs.readdirSync(AUTH_DIR)
    .filter(f => f.startsWith('github-copilot-') && f.endsWith('.json'))
  
  for (const file of files) {
    try {
      const filePath = path.join(AUTH_DIR, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const authFile: CopilotAuthFile = JSON.parse(content)
      
      if (!authFile.access_token) continue
      
      const quota = await fetchEntitlementFromAPI(authFile.access_token)
      if (quota) {
        results.push({
          email: authFile.username || extractUsernameFromFilename(file),
          provider: 'github-copilot',
          quota,
        })
      }
    } catch (error) {
      console.error(`Failed to fetch Copilot quota for ${file}:`, error)
    }
  }
  
  return results
}

async function fetchEntitlementFromAPI(accessToken: string): Promise<ProviderQuotaData | null> {
  try {
    const response = await fetch(ENTITLEMENT_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
    
    if (response.status === 401 || response.status === 403) {
      return { models: [], lastUpdated: new Date(), isForbidden: true }
    }
    
    if (!response.ok) return null
    const data = await response.json() as CopilotEntitlement
    const models: ModelQuota[] = []
    const resetDate = data.quota_reset_date_utc || data.quota_reset_date || ''
    
    if (data.quota_snapshots) {
      const { chat, completions, premium_interactions } = data.quota_snapshots
      
      if (chat && !chat.unlimited) {
        models.push({
          name: 'copilot-chat',
          percentage: calculatePercent(chat, 50),
          resetTime: resetDate,
        })
      }
      
      if (completions && !completions.unlimited) {
        models.push({
          name: 'copilot-completions',
          percentage: calculatePercent(completions, 2000),
          resetTime: resetDate,
        })
      }
      
      if (premium_interactions && !premium_interactions.unlimited) {
        models.push({
          name: 'copilot-premium',
          percentage: calculatePercent(premium_interactions, 50),
          resetTime: resetDate,
        })
      }
    }
    
    // 获取计划类型
    let planType: string | undefined
    const sku = data.access_type_sku?.toLowerCase() || ''
    const plan = data.copilot_plan?.toLowerCase() || ''
    
    if (sku.includes('pro') || plan.includes('pro') || plan === 'individual') {
      planType = 'Pro'
    } else if (sku.includes('business')) {
      planType = 'Business'
    } else if (sku.includes('free')) {
      planType = 'Free'
    }
    
    return {
      models,
      lastUpdated: new Date(),
      isForbidden: false,
      planType,
    }
  } catch (error) {
    console.error('Copilot API error:', error)
    return null
  }
}

function calculatePercent(snapshot: CopilotQuotaSnapshot, defaultTotal: number): number {
  if (snapshot.percent_remaining !== undefined) {
    return snapshot.percent_remaining
  }
  const remaining = snapshot.remaining || 0
  const total = snapshot.entitlement || defaultTotal
  return total > 0 ? (remaining / total) * 100 : 0
}

function extractUsernameFromFilename(filename: string): string {
  return filename
    .replace('github-copilot-', '')
    .replace('.json', '')
}
