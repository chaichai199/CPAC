import type { Booking } from '@/types'
import { StatusBadge } from '@/components/calendar/StatusBadge'
import { formatCurrency, formatThaiDateShort } from '@/utils/format'

export function SalesTable({ bookings, onRowClick }: { bookings: Booking[]; onRowClick?: (booking: Booking) => void }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-sand-50/70 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">รหัสอ้างอิง</th>
              <th className="px-4 py-3">ชื่อลูกค้า</th>
              <th className="px-4 py-3">วันที่</th>
              <th className="px-4 py-3 text-right">ปริมาณ (คิว)</th>
              <th className="px-4 py-3 text-right">ราคาขาย (บาท)</th>
              <th className="px-4 py-3">ผู้ขาย</th>
              <th className="px-4 py-3">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-stone-400">
                  ไม่มีข้อมูลในช่วงเวลาที่เลือก
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => onRowClick?.(b)}
                  className={onRowClick ? 'cursor-pointer hover:bg-sand-50' : 'hover:bg-sand-50/50'}
                  title={onRowClick ? 'คลิกเพื่อดูรายละเอียด' : undefined}
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-sand-700">{b.code}</td>
                  <td className="px-4 py-3 font-medium text-stone-800">{b.customerName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-stone-500">{formatThaiDateShort(b.deliveryDate)}</td>
                  <td className="px-4 py-3 text-right font-mono">{b.volume.toLocaleString('th-TH')}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-stone-800">
                    {formatCurrency(b.totalPrice)}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{b.sellerName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
