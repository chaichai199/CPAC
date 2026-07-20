import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import clsx from 'clsx'
import { useData } from '@/context/DataContext'
import { formatThaiMonthYear, todayStr } from '@/utils/format'
import { StatusDot } from '@/components/calendar/StatusBadge'
import { DayModal } from '@/components/calendar/DayModal'
import type { Booking } from '@/types'
import { STATUS_COLOR } from '@/types'

const WEEKDAYS_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

const MAX_VISIBLE_PER_DAY = 2

export function CalendarView() {
  const { bookings } = useData()
  const [cursor, setCursor] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>()
    for (const b of bookings) {
      const list = map.get(b.deliveryDate) ?? []
      list.push(b)
      map.set(b.deliveryDate, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.deliveryTime.localeCompare(b.deliveryTime))
    }
    return map
  }, [bookings])

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [cursor])

  const today = todayStr()

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand-200/70 px-5 py-4 sm:px-6">
        <h2 className="font-display text-xl font-bold text-stone-900 sm:text-2xl">
          {formatThaiMonthYear(cursor)}
        </h2>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary !px-2.5"
            onClick={() => setCursor((c) => subMonths(c, 1))}
            aria-label="เดือนก่อนหน้า"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="btn-secondary text-xs" onClick={() => setCursor(new Date())}>
            วันนี้
          </button>
          <button
            className="btn-secondary !px-2.5"
            onClick={() => setCursor((c) => addMonths(c, 1))}
            aria-label="เดือนถัดไป"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-sand-200/70 bg-sand-50/60">
        {WEEKDAYS_TH.map((w) => (
          <div key={w} className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-stone-500">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayBookings = bookingsByDate.get(dateStr) ?? []
          const inMonth = isSameMonth(day, cursor)
          const isCurrentDay = dateStr === today

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={clsx(
                'group relative flex min-h-[104px] flex-col gap-1 border-b border-r border-sand-200/50 p-2 text-left transition-colors sm:min-h-[124px] sm:p-2.5',
                inMonth ? 'bg-white/60 hover:bg-sand-50' : 'bg-stone-50/40 text-stone-400 hover:bg-stone-50',
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={clsx(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold font-mono',
                    isCurrentDay && 'bg-stone-800 text-cream-50',
                    !isCurrentDay && inMonth && 'text-stone-700',
                  )}
                >
                  {format(day, 'd')}
                </span>
                {dayBookings.length > 0 && (
                  <span className="flex items-center gap-0.5">
                    {Array.from(new Set(dayBookings.map((b) => b.status)))
                      .slice(0, 4)
                      .map((s) => (
                        <StatusDot key={s} status={s} />
                      ))}
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-1">
                {dayBookings.slice(0, MAX_VISIBLE_PER_DAY).map((b) => {
                  const c = STATUS_COLOR[b.status]
                  return (
                    <div
                      key={b.id}
                      className={clsx('truncate rounded-md px-1.5 py-1 text-[10px] font-medium leading-tight sm:text-[11px]', c.bg, c.text)}
                    >
                      <span className="font-mono">{b.deliveryTime}</span> {b.customerName}
                    </div>
                  )
                })}
                {dayBookings.length > MAX_VISIBLE_PER_DAY && (
                  <span className="mt-auto flex items-center gap-1 rounded-md bg-stone-800/5 px-1.5 py-1 text-[10px] font-semibold text-stone-600 hover:bg-stone-800/10">
                    <MoreHorizontal className="h-3 w-3" />
                    ดูคิวส่งทั้งหมด ({dayBookings.length})
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {selectedDate && (
        <DayModal
          date={selectedDate}
          bookings={bookingsByDate.get(selectedDate) ?? []}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  )
}
