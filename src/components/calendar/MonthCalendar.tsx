import { useMemo, useState } from 'react'
import { CONDITION_LABELS } from '../../domain/record'
import type { HealthRecordRow } from '../../domain/types'
import { fromDateKey, toDateKey } from '../../utils/date'
import { getCalendarDays } from './calendarUtils'

const weekdays = ['日', '月', '火', '水', '木', '金', '土']
const markerColors = {
  good: 'bg-emerald-500',
  normal: 'bg-amber-400',
  bad: 'bg-red-500',
} as const

interface MonthCalendarProps {
  selectedDateKey: string
  records: readonly HealthRecordRow[]
  onSelect: (dateKey: string) => void
}

export function MonthCalendar({ selectedDateKey, records, onSelect }: MonthCalendarProps) {
  const selectedDate = fromDateKey(selectedDateKey)
  const [displayedMonth, setDisplayedMonth] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  )

  const days = useMemo(() => getCalendarDays(displayedMonth), [displayedMonth])
  const recordsByDate = useMemo(
    () => new Map(records.map((record) => [record.dateKey, record])),
    [records],
  )

  const moveMonth = (amount: number) => {
    setDisplayedMonth(
      (month) => new Date(month.getFullYear(), month.getMonth() + amount, 1),
    )
  }

  return (
    <section aria-label="月間カレンダー" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <button aria-label="前月を表示" className="grid size-11 place-items-center rounded-xl text-xl text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950" onClick={() => moveMonth(-1)} type="button">‹</button>
        <h2 className="text-lg font-bold">{displayedMonth.getFullYear()}年{displayedMonth.getMonth() + 1}月</h2>
        <button aria-label="翌月を表示" className="grid size-11 place-items-center rounded-xl text-xl text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950" onClick={() => moveMonth(1)} type="button">›</button>
      </div>
      <div className="mt-3 grid grid-cols-7 text-center text-xs text-slate-500 dark:text-slate-400">
        {weekdays.map((weekday) => <span aria-hidden="true" key={weekday}>{weekday}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((date) => {
          const dateKey = toDateKey(date)
          const record = recordsByDate.get(dateKey)
          const selected = dateKey === selectedDateKey
          const currentMonth = date.getMonth() === displayedMonth.getMonth()
          const conditionText = record ? `、体調${CONDITION_LABELS[record.condition]}` : ''
          return (
            <button
              aria-label={`${date.getMonth() + 1}月${date.getDate()}日${conditionText}`}
              aria-pressed={selected}
              className={`relative flex min-h-12 flex-col items-center justify-center rounded-xl text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ${
                selected
                  ? 'bg-blue-600 font-bold text-white'
                  : currentMonth
                    ? 'text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800'
                    : 'text-slate-400 hover:bg-slate-100 dark:text-slate-600 dark:hover:bg-slate-800'
              }`}
              key={dateKey}
              onClick={() => {
                setDisplayedMonth(new Date(date.getFullYear(), date.getMonth(), 1))
                onSelect(dateKey)
              }}
              type="button"
            >
              {date.getDate()}
              {record && (
                <span aria-hidden="true" className={`mt-1 size-1.5 rounded-full ${markerColors[record.condition]}`} />
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
