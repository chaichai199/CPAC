import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { dataStore } from '@/lib/db'
import { STATUS_LABEL_TH } from '@/types'

export interface ToastMessage {
  id: string
  title: string
  description: string
  tone: 'success' | 'info' | 'warning'
}

interface ToastContextValue {
  toasts: ToastMessage[]
  pushToast: (t: Omit<ToastMessage, 'id'>) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const pushToast = useCallback(
    (t: Omit<ToastMessage, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setToasts((prev) => [...prev, { ...t, id }])
      window.setTimeout(() => dismissToast(id), 5500)
    },
    [dismissToast],
  )

  useEffect(() => {
    const unsubNew = dataStore.subscribeNewBooking((booking) => {
      pushToast({
        tone: 'success',
        title: 'มีใบสั่งจองใหม่เข้าระบบ',
        description: `${booking.code} · ${booking.customerName} · ${booking.volume} คิว · ${booking.deliveryDate} เวลา ${booking.deliveryTime}`,
      })
    })
    const unsubStatus = dataStore.subscribeStatusChange((booking, prevStatus) => {
      pushToast({
        tone: booking.status === 'cancelled' ? 'warning' : 'info',
        title: `อัปเดตสถานะงาน ${booking.code}`,
        description: `เปลี่ยนจาก "${STATUS_LABEL_TH[prevStatus]}" เป็น "${STATUS_LABEL_TH[booking.status]}"`,
      })
    })
    return () => {
      unsubNew()
      unsubStatus()
    }
  }, [pushToast])

  const value = useMemo(() => ({ toasts, pushToast, dismissToast }), [toasts, pushToast, dismissToast])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
