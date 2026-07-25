import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Booking } from '@/types'

type BookingModalState = { mode: 'new' } | { mode: 'edit'; booking: Booking } | null

interface BookingModalContextValue {
  modalState: BookingModalState
  openNewBooking: () => void
  openEditBooking: (booking: Booking) => void
  closeBookingModal: () => void
}

const BookingModalContext = createContext<BookingModalContextValue | null>(null)

export function BookingModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<BookingModalState>(null)

  const value: BookingModalContextValue = {
    modalState,
    openNewBooking: () => setModalState({ mode: 'new' }),
    openEditBooking: (booking) => setModalState({ mode: 'edit', booking }),
    closeBookingModal: () => setModalState(null),
  }

  return <BookingModalContext.Provider value={value}>{children}</BookingModalContext.Provider>
}

export function useBookingModal() {
  const ctx = useContext(BookingModalContext)
  if (!ctx) throw new Error('useBookingModal must be used within BookingModalProvider')
  return ctx
}
