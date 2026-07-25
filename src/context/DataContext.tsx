import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { dataStore, type ConnectionStatus } from '@/lib/db'
import type { ActivityLogEntry, Booking, BookingEditInput, BookingStatus, NewBookingInput } from '@/types'
import { useAuth } from '@/context/AuthContext'

interface DataContextValue {
  bookings: Booking[]
  activityLog: ActivityLogEntry[]
  connection: ConnectionStatus
  addBooking: (input: NewBookingInput) => Promise<Booking | null>
  updateBooking: (id: string, input: BookingEditInput) => Promise<void>
  updateBookingStatus: (id: string, status: BookingStatus) => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([])
  const [connection, setConnection] = useState<ConnectionStatus>({
    mode: dataStore.getMode(),
    online: navigator.onLine,
    syncing: false,
    lastSyncAt: null,
    error: null,
  })

  useEffect(() => {
    const unsubB = dataStore.subscribeBookings(setBookings)
    const unsubA = dataStore.subscribeActivityLog(setActivityLog)
    const unsubC = dataStore.subscribeConnectionStatus(setConnection)
    return () => {
      unsubB()
      unsubA()
      unsubC()
    }
  }, [])

  const visibleBookings = useMemo(() => {
    if (!user || user.role === 'admin') return bookings
    return bookings.filter((b) => b.sellerName === user.displayName)
  }, [bookings, user])

  const value = useMemo<DataContextValue>(
    () => ({
      bookings: visibleBookings,
      activityLog,
      connection,
      addBooking: async (input) => {
        if (!user) return null
        return dataStore.addBooking(input, user)
      },
      updateBooking: async (id, input) => {
        if (!user) return
        await dataStore.updateBooking(id, input, user)
      },
      updateBookingStatus: async (id, status) => {
        if (!user) return
        await dataStore.updateBookingStatus(id, status, user)
      },
    }),
    [visibleBookings, activityLog, connection, user],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
