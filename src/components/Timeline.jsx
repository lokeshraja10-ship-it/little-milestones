import { useEffect, useState } from 'react'
import { fetchDriveImageBlobUrl } from '../lib/google'
import { categoryFor, ageAt } from '../lib/categories'

function formatDate(dateStr) {
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function PhotoStrip({ fileIds, accessToken }) {
  const [urls, setUrls] = useState({})

  useEffect(() => {
    let cancelled = false
    fileIds.forEach((id) => {
      fetchDriveImageBlobUrl(id, accessToken)
        .then((url) => {
          if (!cancelled) setUrls((prev) => ({ ...prev, [id]: url }))
        })
        .catch(() => {})
    })
    return () => {
      cancelled = true
    }
  }, [fileIds, accessToken])

  if (fileIds.length === 0) return null

  if (fileIds.length === 1) {
    const url = urls[fileIds[0]]
    return url ? (
      <img src={url} alt="" className="rounded-xl mt-2 max-h-72 w-auto border border-parchment/10" />
    ) : (
      <div className="mt-2 h-40 w-40 rounded-xl bg-ink-mid animate-pulse" />
    )
  }

  return (
    <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
      {fileIds.map((id) =>
        urls[id] ? (
          <img
            key={id}
            src={urls[id]}
            alt=""
            className="rounded-lg h-32 w-32 object-cover border border-parchment/10 flex-shrink-0"
          />
        ) : (
          <div key={id} className="rounded-lg h-32 w-32 bg-ink-mid animate-pulse flex-shrink-0" />
        )
      )}
    </div>
  )
}

function MilestoneCard({ milestone, accessToken, birthDate, onEdit }) {
  const cat = categoryFor(milestone.category)
  const age = ageAt(birthDate, milestone.date)

  return (
    <div className="relative pl-14 pb-14 last:pb-0 group">
      {/* star node */}
      <span
        className="absolute left-[19px] top-1.5 w-3 h-3 rounded-full"
        style={{ background: cat.color, boxShadow: `0 0 12px 3px ${cat.color}80` }}
      />
      {/* connecting line */}
      <span className="absolute left-6 top-4 bottom-0 w-px bg-gradient-to-b from-gold/40 to-transparent" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-gold/80 text-xs uppercase tracking-wider">
              {formatDate(milestone.date)}
            </p>
            <span
              className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{ background: `${cat.color}22`, color: cat.color }}
            >
              {cat.label}
            </span>
          </div>
          <h3 className="font-display italic text-parchment text-2xl mb-1">
            {milestone.event}
          </h3>
        </div>
        <button
          onClick={() => onEdit(milestone)}
          className="text-parchment/30 hover:text-gold text-xs shrink-0 mt-1 px-2 py-1 rounded-full border border-parchment/10 hover:border-gold/40 transition-colors"
        >
          Edit
        </button>
      </div>

      {milestone.location && (
        <p className="text-teal text-sm mb-1">📍 {milestone.location}</p>
      )}
      {age && <p className="text-parchment/40 text-xs mb-2">{age}</p>}
      {milestone.addedBy && (
        <p className="text-parchment/25 text-[11px]">Added by {milestone.addedBy}</p>
      )}

      <PhotoStrip fileIds={milestone.driveFileIds || []} accessToken={accessToken} />
    </div>
  )
}

export default function Timeline({ milestones, accessToken, birthDate, onEdit }) {
  const sorted = [...milestones].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  )

  if (sorted.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-parchment/40 font-display italic text-2xl">
          No milestones yet — add Aarna's first one.
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
          birthDate={birthDate}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}
