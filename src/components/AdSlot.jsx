import clsx from 'clsx'
import { useData } from '../contexts/DataContext.jsx'

export default function AdSlot({ placement = 'top', className = '' }) {
  const { ads } = useData()
  return (
    <div
      className={clsx('ad-slot flex min-h-20 items-center justify-center rounded-lg p-4 text-center text-sm text-purple-100', className)}
      dangerouslySetInnerHTML={{ __html: ads?.[placement] || 'Advertisement' }}
    />
  )
}
