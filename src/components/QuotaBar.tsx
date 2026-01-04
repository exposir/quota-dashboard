interface QuotaBarProps {
  percentage: number
}

export default function QuotaBar({ percentage }: QuotaBarProps) {
  // 处理未知配额 (-1)
  if (percentage < 0) {
    return (
      <div className="quota-bar unknown">
        <div className="quota-bar-fill" style={{ width: '100%' }}></div>
        <span className="quota-bar-text">Unknown</span>
      </div>
    )
  }
  
  // 根据百分比确定颜色
  const getColor = (pct: number): string => {
    if (pct >= 60) return 'var(--color-success)'
    if (pct >= 30) return 'var(--color-warning)'
    return 'var(--color-danger)'
  }
  
  const clampedPct = Math.max(0, Math.min(100, percentage))
  
  return (
    <div className="quota-bar">
      <div 
        className="quota-bar-fill" 
        style={{ 
          width: `${clampedPct}%`,
          backgroundColor: getColor(clampedPct),
        }}
      ></div>
      <span className="quota-bar-text">
        {clampedPct.toFixed(0)}%
      </span>
    </div>
  )
}
