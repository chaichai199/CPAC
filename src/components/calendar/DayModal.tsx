import { X } from 'lucide-react'
import type { Booking } from '@/types'
import { formatThaiDateFull } from '@/utils/format'
import { BookingDetailCard } from '@/components/booking/BookingDetailCard'

export function DayModal({ date, bookings, onClose }: { date: string; bookings: Booking[]; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-3 backdrop-blur-sm animate-fade-in sm:p-6"
      onClick={onClose}
    >
      <div
        className="animate-slide-in flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-cream-50 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-sand-200 bg-white/80 px-5 py-4 sm:px-7">
          <div>
            <h3 className="font-display text-lg font-bold text-stone-900 sm:text-xl">คิวจัดส่งวันที่</h3>
            <p className="text-sm text-sand-600">{formatThaiDateFull(date)}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-stone-500 hover:bg-stone-800/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-7">
          {bookings.length === 0 ? (
            <p className="py-12 text-center text-sm text-stone-400">ไม่มีรายการจัดส่งในวันนี้</p>
          ) : (
            bookings.map((b) => <BookingDetailCard key={b.id} booking={b} />)
          )}
        </div>

        <div className="border-t border-sand-200 bg-white/80 px-5 py-3 text-xs text-stone-500 sm:px-7">
          ทั้งหมด {bookings.length} รายการ · ปริมาณรวม {bookings.reduce((s, b) => s + b.volume, 0)} คิว
        </div>
      </div>
    </div>
  )
}
