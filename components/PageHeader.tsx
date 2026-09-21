interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h1>
        {description && <p className="text-sm text-slate-500 dark:text-slate-200 mt-0.5">{description}</p>}
      </div>
      {children && <div className="flex-shrink-0">{children}</div>}
    </div>
  )
}
