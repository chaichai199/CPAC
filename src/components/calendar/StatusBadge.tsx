import clsx from 'clsx'
import type { BookingStatus } from '@/types'
import { STATUS_COLOR, STATUS_LABEL_TH } from '@/types'

export function StatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const c = STATUS_COLOR[status]
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium font-mono',
        c.bg,
        c.text,
        className,
      )}
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full', c.dot)} />
      {STATUS_LABEL_TH[status]}
    </span>
  )
}

export function StatusDot({ status }: { status: BookingStatus }) {
  const c = STATUS_COLOR[status]
  return <span className={clsx('inline-block h-2 w-2 rounded-full', c.dot)} />
}
