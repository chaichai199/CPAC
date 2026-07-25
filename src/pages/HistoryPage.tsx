import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, History as HistoryIcon, PlusCircle, RefreshCcw, Search, X } from 'lucide-react'
import { useData } from '@/context/DataContext'

const PAGE_SIZE = 15
const ROLE_LABEL: Record<string, string> = { admin: 'ADMIN', staff: 'STAFF' }

function iconFor(action: string) {
  if (action.includes('สร้าง') || action.includes('เพิ่ม')) return <PlusCircle className="h-4 w-4 text-green-600" />
  if (action.includes('เปลี่ยนสถานะ')) return <RefreshCcw className="h-4 w-4 text-sand-600" />
  return <HistoryIcon className="h-4 w-4 text-stone-500" />
}

export function HistoryPage() {
  const { activityLog } = useData()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  const actionOptions = useMemo(() => Array.from(new Set(activityLog.map((e) => e.action))).sort(), [activityLog])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return activityLog.filter((entry) => {
      if (roleFilter && entry.userRole !== roleFilter) return false
      if (actionFilter && entry.action !== actionFilter) return false
      const entryDate = entry.timestamp.slice(0, 10)
      if (dateFrom && entryDate < dateFrom) return false
      if (dateTo && entryDate > dateTo) return false
      if (q) {
        const haystack = `${entry.userName} ${entry.detail} ${entry.bookingCode ?? ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [activityLog, search, roleFilter, actionFilter, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  useEffect(() => {
    setPage(1)
  }, [search, roleFilter, actionFilter, dateFrom, dateTo])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const hasActiveFilters = Boolean(search || roleFilter || actionFilter || dateFrom || dateTo)

  const clearFilters = () => {
    setSearch('')
    setRoleFilter('')
    setActionFilter('')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">ประวัติระบบ</h1>
        <p className="mt-1 text-sm text-stone-500">บันทึกการทำรายการทั้งหมดในระบบแบบเรียลไทม์</p>
      </div>

      <div className="card mb-4 space-y-3 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            className="input-field pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อผู้ใช้งาน, รายละเอียด, หรือรหัสใบสั่งจอง..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="field-label">สิทธิ์ผู้ใช้งาน</label>
            <select className="input-field text-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">ทั้งหมด</option>
              <option value="admin">ADMIN</option>
              <option value="staff">STAFF</option>
            </select>
          </div>
          <div>
            <label className="field-label">ประเภทกิจกรรม</label>
            <select className="input-field text-sm" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
              <option value="">ทั้งหมด</option>
              {actionOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">จากวันที่</label>
            <input
              type="date"
              className="input-field font-mono text-sm"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">ถึงวันที่</label>
            <input
              type="date"
              className="input-field font-mono text-sm"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="btn-ghost text-xs">
            <X className="h-3.5 w-3.5" />
            ล้างตัวกรองทั้งหมด
          </button>
        )}
      </div>

      <p className="mb-2 text-xs text-stone-500">
        พบ {filtered.length} รายการ{hasActiveFilters ? ' (กรองจากทั้งหมด ' + activityLog.length + ' รายการ)' : ''}
      </p>

      <div className="card divide-y divide-sand-100">
        {pageItems.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-stone-400">
            {hasActiveFilters ? 'ไม่พบรายการที่ตรงกับตัวกรอง' : 'ยังไม่มีประวัติการทำรายการ'}
          </p>
        ) : (
          pageItems.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 px-5 py-4 sm:px-6">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand-50">
                {iconFor(entry.action)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <p className="text-sm font-semibold text-stone-800">
                    {entry.userName}
                    <span className="ml-2 rounded-full bg-stone-800/5 px-2 py-0.5 font-mono text-[10px] uppercase text-stone-500">
                      {ROLE_LABEL[entry.userRole] ?? entry.userRole}
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

      {filtered.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-stone-500">
            แสดง {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} จาก {filtered.length} รายการ
          </p>
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary !px-2.5"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="หน้าก่อนหน้า"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-mono text-xs text-stone-600">
              หน้า {page} / {totalPages}
            </span>
            <button
              className="btn-secondary !px-2.5"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="หน้าถัดไป"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
