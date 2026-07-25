import { X } from 'lucide-react'
import type { Booking } from '@/types'
import { BookingDetailCard } from '@/components/booking/BookingDetailCard'

export function BookingDetailModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-3 backdrop-blur-sm animate-fade-in sm:p-6"
      onClick={onClose}
    >
      <div
        className="animate-slide-in flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-cream-50 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-sand-200 bg-white/80 px-5 py-4 sm:px-7">
          <div>
            <h3 className="font-display text-lg font-bold text-stone-900 sm:text-xl">รายละเอียดใบสั่งจอง</h3>
            <p className="text-sm text-sand-600">{booking.code}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-stone-500 hover:bg-stone-800/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          <BookingDetailCard booking={booking} />
        </div>
      </div>
    </div>
  )
}
