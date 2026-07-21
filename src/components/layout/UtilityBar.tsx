import { Cloud, CloudOff, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import clsx from 'clsx'
import { useData } from '@/context/DataContext'

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function UtilityBar() {
  const { connection } = useData()

  return (
    <div className="no-print w-full bg-stone-900 text-stone-300">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-1.5 text-[11px] font-mono sm:px-6">
        <div className="flex items-center gap-4">
          <span className="hidden text-stone-500 sm:inline">BURAPACONCRETE · Mini Utility Bar</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className={clsx(
              'flex items-center gap-1.5',
              connection.mode === 'cloudflare' ? 'text-emerald-400' : 'text-amber-400',
            )}
            title={connection.mode === 'cloudflare' ? 'เชื่อมต่อ Cloudflare D1 Database (Cloud)' : 'โหมดสำรองข้อมูลภายในเครื่อง (LocalStorage)'}
          >
            {connection.mode === 'cloudflare' ? <Cloud className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
            <span>{connection.mode === 'cloudflare' ? 'Cloudflare D1' : 'Local Storage Mode'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-stone-400">
            <RefreshCw className={clsx('h-3.5 w-3.5', connection.syncing && 'animate-spin text-sand-300')} />
            <span>{connection.syncing ? 'กำลังซิงค์...' : `ซิงค์ล่าสุด ${formatTime(connection.lastSyncAt)}`}</span>
          </div>

          <div
            className={clsx('flex items-center gap-1.5', connection.online ? 'text-stone-400' : 'text-red-400')}
            title={connection.online ? 'เครือข่ายออนไลน์' : 'ออฟไลน์'}
          >
            {connection.online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{connection.online ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
