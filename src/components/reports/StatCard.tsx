import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

export function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  accent,
}: {
  icon: LucideIcon
  label: string
  value: string
  unit?: string
  accent?: 'sand' | 'green' | 'stone'
}) {
  const accentClass =
    accent === 'green' ? 'bg-green-50 text-green-700' : accent === 'stone' ? 'bg-stone-800/5 text-stone-700' : 'bg-sand-100 text-sand-700'

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
        <div className={clsx('flex h-9 w-9 items-center justify-center rounded-xl', accentClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 font-mono text-2xl font-bold text-stone-900 sm:text-3xl">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-stone-400">{unit}</span>}
      </p>
    </div>
  )
}
