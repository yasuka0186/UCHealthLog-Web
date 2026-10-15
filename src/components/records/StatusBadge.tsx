import { CONDITION_LABELS } from '../../domain/record'
import type { ConditionStatus } from '../../domain/types'

const colors: Record<ConditionStatus, string> = {
  good: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  normal: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  bad: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
}

interface StatusBadgeProps {
  condition: ConditionStatus
}

export function StatusBadge({ condition }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${colors[condition]}`}>
      体調：{CONDITION_LABELS[condition]}
    </span>
  )
}

