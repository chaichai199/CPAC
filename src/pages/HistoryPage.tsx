import { Clock, History as HistoryIcon, PlusCircle, RefreshCcw } from 'lucide-react'
import { useData } from '@/context/DataContext'

function iconFor(action: string) {
  if (action.includes('สร้าง')) return <PlusCircle className="h-4 w-4 text-green-600" />
  if (action.includes('เปลี่ยนสถานะ')) return <RefreshCcw className="h-4 w-4 text-sand-600" />
  return <HistoryIcon className="h-4 w-4 text-stone-500" />
}

export function HistoryPage() {
  const { activityLog } = useData()

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">ประวัติระบบ</h1>
        <p className="mt-1 text-sm text-stone-500">บันทึกการทำรายการทั้งหมดในระบบแบบเรียลไทม์</p>
      </div>

      <div className="card divide-y divide-sand-100">
        {activityLog.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-stone-400">ยังไม่มีประวัติการทำรายการ</p>
        ) : (
          activityLog.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 px-5 py-4 sm:px-6">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand-50">
                {iconFor(entry.action)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <p className="text-sm font-semibold text-stone-800">
                    {entry.userName}
                    <span className="ml-2 rounded-full bg-stone-800/5 px-2 py-0.5 font-mono text-[10px] uppercase text-stone-500">
                      {entry.userRole}
                    </span>
                  </p>
                  <p className="flex items-center gap-1 font-mono text-[11px] text-stone-400">
                    <Clock className="h-3 w-3" />
                    {new Date(entry.timestamp).toLocaleString('th-TH')}
                  </p>
                </div>
                <p className="mt-0.5 text-sm text-stone-600">{entry.detail}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
