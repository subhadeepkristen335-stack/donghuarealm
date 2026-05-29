import { Link } from 'react-router-dom'

export default function SectionHeader({ title, subtitle, action, href }) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-black text-white">{title}</h2>
        {subtitle && <p className="text-sm text-purple-200">{subtitle}</p>}
      </div>
      {action && href && <Link className="text-sm font-semibold text-pink-300 transition hover:text-pink-100" to={href}>{action}</Link>}
    </div>
  )
}
