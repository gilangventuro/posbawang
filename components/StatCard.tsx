interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  color?: 'green' | 'red' | 'blue' | 'orange' | 'slate'
  icon: string
}

const colorMap = {
  green: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800',
  red: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-100 dark:border-red-800',
  blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800',
  orange: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-800',
  slate: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
}

const iconBg = {
  green: 'bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300',
  red: 'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300',
  blue: 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300',
  orange: 'bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-300',
  slate: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
}

export default function StatCard({ title, value, subtitle, color = 'slate', icon }: StatCardProps) {
  return (
    <div className={`rounded-2xl border p-5 ${colorMap[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide opacity-70 truncate">{title}</p>
          <p className="text-2xl font-bold mt-1.5 leading-none">{value}</p>
          {subtitle && <p className="text-xs mt-1.5 opacity-60">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 ${iconBg[color]}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon} />
          </svg>
        </div>
      </div>
    </div>
  )
}
