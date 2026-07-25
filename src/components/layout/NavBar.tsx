import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { CalendarDays, History, LogOut, PlusCircle, Settings, TrendingUp, Truck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function NavBar({ onNewBooking }: { onNewBooking: () => void }) {
  const { user, logout } = useAuth()
  if (!user) return null

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'bg-stone-800 text-cream-50' : 'text-stone-600 hover:bg-stone-800/8 hover:text-stone-900',
    )

  return (
    <header className="no-print sticky top-0 z-40 w-full border-b border-sand-200/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-800 text-cream-50 shadow-soft">
            <Truck className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-base font-bold tracking-tight text-stone-900 sm:text-lg">
              BURAPACONCRETE
            </p>
            <p className="text-[11px] font-medium tracking-wide text-sand-600">CPAC Booking System</p>
          </div>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={navLinkClass}>
            <CalendarDays className="h-4 w-4" />
            ปฏิทินคิวส่ง
          </NavLink>
          <NavLink to="/reports" className={navLinkClass}>
            <TrendingUp className="h-4 w-4" />
            รายงานยอดขาย
          </NavLink>
          {user.role === 'admin' && (
            <NavLink to="/history" className={navLinkClass}>
              <History className="h-4 w-4" />
              ประวัติระบบ
            </NavLink>
          )}
          {user.role === 'admin' && (
            <NavLink to="/settings" className={navLinkClass}>
              <Settings className="h-4 w-4" />
              ตั้งค่า
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={onNewBooking} className="btn-primary">
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">เพิ่มใบสั่งจอง</span>
          </button>

          <div className="hidden items-center gap-2 rounded-xl border border-sand-200 bg-sand-50 px-3 py-1.5 sm:flex">
            <div className="text-right leading-tight">
              <p className="text-xs font-semibold text-stone-800">{user.displayName}</p>
              <p
                className={clsx(
                  'text-[10px] font-mono font-bold uppercase tracking-wide',
                  user.role === 'admin' ? 'text-sand-600' : 'text-stone-500',
                )}
              >
                {user.role === 'admin' ? 'ADMIN · แอดมิน' : 'STAFF · เจ้าหน้าที่'}
              </p>
            </div>
          </div>

          <button onClick={logout} className="btn-ghost" title="ออกจากระบบ">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-sand-100 px-4 py-1.5 md:hidden">
        <NavLink to="/" end className={navLinkClass}>
          <CalendarDays className="h-4 w-4" />
          ปฏิทิน
        </NavLink>
        <NavLink to="/reports" className={navLinkClass}>
          <TrendingUp className="h-4 w-4" />
          รายงาน
        </NavLink>
        {user.role === 'admin' && (
          <NavLink to="/history" className={navLinkClass}>
            <History className="h-4 w-4" />
            ประวัติ
          </NavLink>
        )}
        {user.role === 'admin' && (
          <NavLink to="/settings" className={navLinkClass}>
            <Settings className="h-4 w-4" />
            ตั้งค่า
          </NavLink>
        )}
      </nav>
    </header>
  )
}
