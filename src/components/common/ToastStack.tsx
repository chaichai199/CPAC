import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import clsx from 'clsx'

const TONE_STYLES = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-green-600',
    ring: 'ring-green-200',
  },
  info: {
    icon: Info,
    iconClass: 'text-sand-600',
    ring: 'ring-sand-200',
  },
  warning: {
    icon: TriangleAlert,
    iconClass: 'text-orange-600',
    ring: 'ring-orange-200',
  },
} as const

export function ToastStack() {
  const { toasts, dismissToast } = useToast()

  return (
    <div className="fixed top-16 right-4 z-[100] flex w-full max-w-sm flex-col gap-3 no-print">
      {toasts.map((toast) => {
        const style = TONE_STYLES[toast.tone]
        const Icon = style.icon
        return (
          <div
            key={toast.id}
            className={clsx(
              'animate-toast-in glass-panel rounded-2xl p-4 ring-1 shadow-elevated',
              style.ring,
            )}
          >
            <div className="flex items-start gap-3">
              <Icon className={clsx('mt-0.5 h-5 w-5 shrink-0', style.iconClass)} />
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-semibold text-stone-800">{toast.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-stone-600">{toast.description}</p>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 rounded-full p-1 text-stone-400 hover:bg-stone-800/5 hover:text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
