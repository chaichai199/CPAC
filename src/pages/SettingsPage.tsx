import { useState } from 'react'
import clsx from 'clsx'
import { UserManagementSection } from '@/components/settings/UserManagementSection'
import { ConcreteOptionsSection } from '@/components/settings/ConcreteOptionsSection'

type SettingsTab = 'users' | 'concrete'

const TABS: { key: SettingsTab; label: string }[] = [
  { key: 'users', label: 'ผู้ใช้งาน' },
  { key: 'concrete', label: 'รายละเอียดคอนกรีต' },
]

export function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('users')

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">ตั้งค่าระบบ</h1>
        <p className="mt-1 text-sm text-stone-500">จัดการผู้ใช้งานและตัวเลือกข้อมูลที่ใช้ในระบบ</p>
      </div>

      <div className="mb-6 flex w-fit rounded-xl bg-sand-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              tab === t.key ? 'bg-stone-800 text-cream-50 shadow-soft' : 'text-stone-600 hover:bg-white/60',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' ? <UserManagementSection /> : <ConcreteOptionsSection />}
    </div>
  )
}
