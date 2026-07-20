import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { UtilityBar } from '@/components/layout/UtilityBar'
import { NavBar } from '@/components/layout/NavBar'
import { BookingModal } from '@/components/booking/BookingModal'
import { ToastStack } from '@/components/common/ToastStack'

export function AppShell() {
  const { user } = useAuth()
  const [showBookingModal, setShowBookingModal] = useState(false)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen">
      <UtilityBar />
      <NavBar onNewBooking={() => setShowBookingModal(true)} />
      <main>
        <Outlet />
      </main>
      {showBookingModal && <BookingModal onClose={() => setShowBookingModal(false)} />}
      <ToastStack />
    </div>
  )
}
