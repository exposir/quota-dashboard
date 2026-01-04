// 配额获取服务 - 主入口
import { AccountQuota, ProviderType } from '../types'
import { fetchClaudeCodeQuotas } from './claudeCode'
import { fetchAntigravityQuotas } from './antigravity'
import { fetchCopilotQuotas } from './copilot'
import { fetchCodexQuotas } from './codex'

export async function fetchAllQuotas(): Promise<AccountQuota[]> {
  const results: AccountQuota[] = []
  
  // 并发获取所有提供商的配额
  const [claudeQuotas, antigravityQuotas, copilotQuotas, codexQuotas] = await Promise.allSettled([
    fetchClaudeCodeQuotas(),
    fetchAntigravityQuotas(),
    fetchCopilotQuotas(),
    fetchCodexQuotas(),
  ])
  
  // 处理 Claude Code 结果
  if (claudeQuotas.status === 'fulfilled') {
    results.push(...claudeQuotas.value)
  }
  
  // 处理 Antigravity 结果
  if (antigravityQuotas.status === 'fulfilled') {
    results.push(...antigravityQuotas.value)
  }
  
  // 处理 GitHub Copilot 结果
  if (copilotQuotas.status === 'fulfilled') {
    results.push(...copilotQuotas.value)
  }
  
  // 处理 Codex 结果
  if (codexQuotas.status === 'fulfilled') {
    results.push(...codexQuotas.value)
  }
  
  return results
}
