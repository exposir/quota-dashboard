/// <reference types="vite/client" />

interface ElectronAPI {
  getAllQuotas: () => Promise<{
    success: boolean
    data?: AccountQuota[]
    error?: string
  }>
}

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

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
