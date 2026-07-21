import { useEffect, useMemo, useState } from 'react'
import { endOfMonth, endOfWeek, eachDayOfInterval, format, parseISO, startOfMonth, startOfWeek, subDays } from 'date-fns'
import { CheckCircle2, Coins, Package, Printer, TrendingUp } from 'lucide-react'
import clsx from 'clsx'
import { useData } from '@/context/DataContext'
import { dataStore } from '@/lib/db'
import type { OptionItem } from '@/types'
import { StatCard } from '@/components/reports/StatCard'
import { SalesTrendChart, type TrendPoint } from '@/components/reports/SalesTrendChart'
import { SalesTable } from '@/components/reports/SalesTable'
import { formatCurrency, formatThaiDateFull, todayStr } from '@/utils/format'

type ReportType = 'daily' | 'weekly' | 'monthly'

const REPORT_TABS: { key: ReportType; label: string }[] = [
  { key: 'daily', label: 'รายวัน' },
  { key: 'weekly', label: 'รายสัปดาห์' },
  { key: 'monthly', label: 'รายเดือน' },
]

export function ReportsPage() {
  const { bookings } = useData()
  const [reportType, setReportType] = useState<ReportType>('daily')
  const [anchorDate, setAnchorDate] = useState(todayStr())
  const [sellerFilter, setSellerFilter] = useState('all')
  const [options, setOptions] = useState<OptionItem[]>(() => dataStore.getOptionsSnapshot())

  useEffect(() => dataStore.subscribeOptions(setOptions), [])

  const sellerOptions = useMemo(() => {
    const set = new Set<string>(options.filter((o) => o.listKey === 'seller' && o.active).map((o) => o.value))
    bookings.forEach((b) => set.add(b.sellerName))
    return Array.from(set)
  }, [options, bookings])

  const anchor = parseISO(anchorDate)

  const { rangeStart, rangeEnd, rangeLabel } = useMemo(() => {
    if (reportType === 'daily') {
      return { rangeStart: anchor, rangeEnd: anchor, rangeLabel: formatThaiDateFull(anchorDate) }
    }
    if (reportType === 'weekly') {
      const s = startOfWeek(anchor, { weekStartsOn: 0 })
      const e = endOfWeek(anchor, { weekStartsOn: 0 })
      return {
        rangeStart: s,
        rangeEnd: e,
        rangeLabel: `${formatThaiDateFull(format(s, 'yyyy-MM-dd'))} — ${formatThaiDateFull(format(e, 'yyyy-MM-dd'))}`,
      }
    }
    const s = startOfMonth(anchor)
    const e = endOfMonth(anchor)
    return {
      rangeStart: s,
      rangeEnd: e,
      rangeLabel: `เดือน ${format(anchor, 'MMMM yyyy')}`,
    }
  }, [reportType, anchor, anchorDate])

  const sellerFilteredBookings = useMemo(
    () => bookings.filter((b) => sellerFilter === 'all' || b.sellerName === sellerFilter),
    [bookings, sellerFilter],
  )

  const rangeStartStr = format(rangeStart, 'yyyy-MM-dd')
  const rangeEndStr = format(rangeEnd, 'yyyy-MM-dd')

  const periodBookings = useMemo(
    () =>
      sellerFilteredBookings
        .filter((b) => b.deliveryDate >= rangeStartStr && b.deliveryDate <= rangeEndStr)
        .sort((a, b) => (a.deliveryDate + a.deliveryTime).localeCompare(b.deliveryDate + b.deliveryTime)),
    [sellerFilteredBookings, rangeStartStr, rangeEndStr],
  )

  const stats = useMemo(() => {
    const nonCancelled = periodBookings.filter((b) => b.status !== 'cancelled')
    const totalVolume = nonCancelled.reduce((s, b) => s + b.volume, 0)
    const totalRevenue = nonCancelled.reduce((s, b) => s + b.totalPrice, 0)
    const avgPrice = totalVolume > 0 ? totalRevenue / totalVolume : 0
    const completedCount = periodBookings.filter((b) => b.status === 'completed').length
    const completedRate = periodBookings.length > 0 ? (completedCount / periodBookings.length) * 100 : 0
    return { totalVolume, totalRevenue, avgPrice, completedCount, completedRate, totalJobs: periodBookings.length }
  }, [periodBookings])

  const chartData: TrendPoint[] = useMemo(() => {
    let chartStart = rangeStart
    let chartEnd = rangeEnd
    if (reportType === 'daily') {
      chartStart = subDays(anchor, 6)
      chartEnd = anchor
    }
    const days = eachDayOfInterval({ start: chartStart, end: chartEnd })
    return days.map((d) => {
      const dateStr = format(d, 'yyyy-MM-dd')
      const dayBookings = sellerFilteredBookings.filter((b) => b.deliveryDate === dateStr && b.status !== 'cancelled')
      return {
        label: format(d, 'd MMM'),
        revenue: dayBookings.reduce((s, b) => s + b.totalPrice, 0),
        volume: dayBookings.reduce((s, b) => s + b.volume, 0),
      }
    })
  }, [reportType, anchor, rangeStart, rangeEnd, sellerFilteredBookings])

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 print-area">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">รายงานยอดขายเชิงลึก</h1>
          <p className="mt-1 text-sm text-stone-500">วิเคราะห์ยอดขายและแนวโน้มการจัดส่งคอนกรีต</p>
        </div>
        <button onClick={() => window.print()} className="btn-secondary">
          <Printer className="h-4 w-4" />
          พิมพ์รายงาน
        </button>
      </div>

      <div className="hidden print:block mb-4">
        <h1 className="font-display text-2xl font-bold text-stone-900">BURAPACONCRETE CPAC Booking — รายงานยอดขาย</h1>
        <p className="text-sm text-stone-500">
          ช่วงเวลา: {rangeLabel} · ผู้ขาย: {sellerFilter === 'all' ? 'ทั้งหมด' : sellerFilter} · พิมพ์เมื่อ{' '}
          {new Date().toLocaleString('th-TH')}
        </p>
      </div>

      <div className="no-print card mb-6 flex flex-wrap items-center gap-4 p-4">
        <div className="flex rounded-xl bg-sand-100 p-1">
          {REPORT_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setReportType(tab.key)}
              className={clsx(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                reportType === tab.key ? 'bg-stone-800 text-cream-50 shadow-soft' : 'text-stone-600 hover:bg-white/60',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            {reportType === 'monthly' ? 'เดือน' : 'วันที่'}
          </label>
          <input
            type={reportType === 'monthly' ? 'month' : 'date'}
            className="input-field !w-auto font-mono"
            value={reportType === 'monthly' ? anchorDate.slice(0, 7) : anchorDate}
            onChange={(e) => setAnchorDate(reportType === 'monthly' ? `${e.target.value}-01` : e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">ผู้ขาย</label>
          <select className="input-field !w-auto" value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)}>
            <option value="all">ทั้งหมด (All Sellers)</option>
            {sellerOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <span className="ml-auto text-sm text-stone-500">{rangeLabel}</span>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Package} label="ปริมาณยอดสั่งจองรวม" value={stats.totalVolume.toLocaleString('th-TH')} unit="คิว" accent="sand" />
        <StatCard icon={Coins} label="รายได้รวมทั้งหมด" value={formatCurrency(stats.totalRevenue)} unit="บาท" accent="green" />
        <StatCard icon={TrendingUp} label="ราคาเฉลี่ยต่อคิว" value={formatCurrency(stats.avgPrice)} unit="บาท/คิว" accent="stone" />
        <StatCard
          icon={CheckCircle2}
          label="ส่งมอบสำเร็จ"
          value={`${stats.completedCount}/${stats.totalJobs}`}
          unit={`(${stats.completedRate.toFixed(0)}%)`}
          accent="green"
        />
      </div>

      <div className="card mb-6 p-5">
        <h3 className="mb-4 font-display text-base font-bold text-stone-800">แนวโน้มยอดขาย</h3>
        <SalesTrendChart data={chartData} />
      </div>

      <SalesTable bookings={periodBookings} />
    </div>
  )
}
