import { useState, type ReactNode } from 'react'
import { MapPin, Pencil, Phone, User, X } from 'lucide-react'
import type { Booking, BookingStatus } from '@/types'
import { BOOKING_STATUSES, STATUS_LABEL_TH } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { useData } from '@/context/DataContext'
import { useBookingModal } from '@/context/BookingModalContext'
import { formatCurrency, formatPhone, formatThaiDateFull } from '@/utils/format'
import { StatusBadge } from '@/components/calendar/StatusBadge'

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">{label}</p>
      <p className="text-sm font-medium text-stone-800">{value}</p>
    </div>
  )
}

function BookingCard({ booking }: { booking: Booking }) {
  const { user } = useAuth()
  const { updateBookingStatus } = useData()
  const { openEditBooking } = useBookingModal()
  const [updating, setUpdating] = useState(false)

  const canEdit = user?.role === 'admin' || booking.sellerName === user?.displayName

  const handleStatusChange = async (status: BookingStatus) => {
    setUpdating(true)
    await updateBookingStatus(booking.id, status)
    setUpdating(false)
  }

  return (
    <div className="rounded-xl border border-sand-200 bg-white/70 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-sand-200 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-sm font-bold text-sand-700">{booking.code}</span>
          <StatusBadge status={booking.status} />
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-semibold text-stone-700">เวลา {booking.deliveryTime} น.</span>
          {canEdit && (
            <button
              onClick={() => openEditBooking(booking)}
              className="btn-ghost !px-2.5 !py-1.5 text-xs"
              title="แก้ไขใบสั่งจอง"
            >
              <Pencil className="h-3.5 w-3.5" />
              แก้ไข
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 md:grid-cols-4">
        <DetailField label="ชื่อลูกค้า" value={booking.customerName} />
        <DetailField label="ปริมาณคอนกรีต" value={`${booking.volume} คิว (ลบ.ม.)`} />
        {booking.arrivalTime && <DetailField label="เวลาถึงหน้างาน" value={`${booking.arrivalTime} น.`} />}
        <DetailField label="กำลังอัดคอนกรีต" value={booking.concreteStrength} />
        <DetailField label="ชนิดรถผสม" value={booking.mixerType} />
        <DetailField label="ลักษณะการเท" value={booking.pourMethod} />
        <DetailField label="ชนิดงาน" value={booking.jobType} />
        <DetailField label="ผู้ขาย (Seller)" value={booking.sellerName} />
        <DetailField
          label="ยอดสุทธิ"
          value={<span className="font-mono text-sand-700">฿{formatCurrency(booking.totalPrice)}</span>}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg bg-sand-50/70 p-3 sm:grid-cols-3">
        <div className="flex items-center gap-2 text-sm text-stone-700">
          <User className="h-4 w-4 shrink-0 text-sand-600" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase text-stone-400">ผู้ติดต่อหน้างาน</p>
            <p className="truncate font-medium">{booking.contactPerson || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-stone-700">
          <Phone className="h-4 w-4 shrink-0 text-sand-600" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase text-stone-400">เบอร์โทรศัพท์</p>
            <a href={`tel:${booking.contactPhone || booking.phone}`} className="truncate font-mono font-medium hover:underline">
              {formatPhone(booking.contactPhone || booking.phone)}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-stone-700">
          <MapPin className="h-4 w-4 shrink-0 text-sand-600" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase text-stone-400">แผนที่หน้างาน</p>
            {booking.mapLink ? (
              <a
                href={booking.mapLink}
                target="_blank"
                rel="noreferrer"
                className="truncate font-medium text-sand-700 hover:underline"
              >
                เปิดแผนที่
              </a>
            ) : (
              <p className="font-medium text-stone-400">ไม่ระบุ</p>
            )}
          </div>
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed border-sand-200 pt-3">
          <span className="text-xs font-semibold text-stone-500">เปลี่ยนสถานะงาน:</span>
          <select
            className="input-field !w-auto py-1.5 text-xs font-mono"
            value={booking.status}
            disabled={updating}
            onChange={(e) => handleStatusChange(e.target.value as BookingStatus)}
          >
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL_TH[s]}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

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
            bookings.map((b) => <BookingCard key={b.id} booking={b} />)
          )}
        </div>

        <div className="border-t border-sand-200 bg-white/80 px-5 py-3 text-xs text-stone-500 sm:px-7">
          ทั้งหมด {bookings.length} รายการ · ปริมาณรวม {bookings.reduce((s, b) => s + b.volume, 0)} คิว
        </div>
      </div>
    </div>
  )
}
