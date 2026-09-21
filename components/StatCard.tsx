interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  color?: 'green' | 'red' | 'blue' | 'orange' | 'slate'
  icon: string
}

const colorMap = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  red: 'bg-red-50 text-red-700 border-red-100',
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  orange: 'bg-orange-50 text-orange-700 border-orange-100',
  slate: 'bg-slate-50 text-slate-700 border-slate-200',
}

const iconBg = {
  green: 'bg-emerald-100 text-emerald-600',
  red: 'bg-red-100 text-red-600',
  blue: 'bg-blue-100 text-blue-600',
  orange: 'bg-orange-100 text-orange-600',
  slate: 'bg-slate-100 text-slate-600',
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
