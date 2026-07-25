import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useBookingModal } from '@/context/BookingModalContext'
import { UtilityBar } from '@/components/layout/UtilityBar'
import { NavBar } from '@/components/layout/NavBar'
import { BookingModal } from '@/components/booking/BookingModal'
import { ToastStack } from '@/components/common/ToastStack'

export function AppShell() {
  const { user } = useAuth()
  const { modalState, openNewBooking, closeBookingModal } = useBookingModal()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen">
      <UtilityBar />
      <NavBar onNewBooking={openNewBooking} />
      <main>
        <Outlet />
      </main>
      {modalState && (
        <BookingModal
          booking={modalState.mode === 'edit' ? modalState.booking : undefined}
          onClose={closeBookingModal}
        />
      )}
      <ToastStack />
    </div>
  )
}
