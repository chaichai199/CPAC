import { CalendarView } from '@/components/calendar/CalendarView'
import { STATUS_COLOR, STATUS_LABEL_TH, BOOKING_STATUSES } from '@/types'

export function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">ปฏิทินคิวจัดส่งคอนกรีต</h1>
          <p className="mt-1 text-sm text-stone-500">ภาพรวมตารางส่งมอบคอนกรีตผสมเสร็จรายเดือน แบบเรียลไทม์</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {BOOKING_STATUSES.map((s) => (
            <div key={s} className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
              <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLOR[s].dot}`} />
              {STATUS_LABEL_TH[s]}
            </div>
          ))}
        </div>
      </div>

      <CalendarView />
    </div>
  )
}
