import { useEffect, useState } from 'react'
import { fetchDriveImageBlobUrl } from '../lib/google'

function formatDate(dateStr) {
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function MilestoneCard({ milestone, accessToken, align }) {
  const [imgUrl, setImgUrl] = useState(null)

  useEffect(() => {
    let cancelled = false
    if (milestone.driveFileId) {
      fetchDriveImageBlobUrl(milestone.driveFileId, accessToken)
        .then((url) => !cancelled && setImgUrl(url))
        .catch(() => {})
    }
    return () => {
      cancelled = true
    }
  }, [milestone.driveFileId, accessToken])

  return (
    <div className="relative pl-14 pb-14 last:pb-0">
      {/* star node */}
      <span className="absolute left-[19px] top-1.5 w-3 h-3 rounded-full bg-gold shadow-[0_0_12px_3px_rgba(212,169,75,0.5)]" />
      {/* connecting line */}
      <span className="absolute left-6 top-4 bottom-0 w-px bg-gradient-to-b from-gold/40 to-transparent" />

      <p className="text-gold/80 text-xs uppercase tracking-wider mb-1">
        {formatDate(milestone.date)}
      </p>
      <h3 className="font-display italic text-parchment text-2xl mb-1">
        {milestone.event}
      </h3>
      {milestone.location && (
        <p className="text-teal text-sm mb-3">📍 {milestone.location}</p>
      )}
      {imgUrl && (
        <img
          src={imgUrl}
          alt={milestone.event}
          className="rounded-xl mt-2 max-h-72 w-auto border border-parchment/10"
        />
      )}
    </div>
  )
}

export default function Timeline({ milestones, accessToken }) {
  const sorted = [...milestones].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  )

  if (sorted.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-parchment/40 font-display italic text-2xl">
          No milestones yet — add her first one.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-6 py-8">
      {sorted.map((m) => (
        <MilestoneCard
          key={`${m.rowIndex}-${m.date}`}
          milestone={m}
          accessToken={accessToken}
        />
      ))}
    </div>
  )
}
