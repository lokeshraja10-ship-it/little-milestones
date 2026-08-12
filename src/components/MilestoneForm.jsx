import { useEffect, useState } from 'react'
import {
  appendMilestone,
  updateMilestone,
  clearMilestoneRow,
  uploadImageToDrive,
  deleteDriveFile,
  fetchDriveImageBlobUrl,
} from '../lib/google'
import { geocodeLocation } from '../lib/geocode'
import { CATEGORIES } from '../lib/categories'

function KeptPhotoThumb({ fileId, accessToken, onRemove }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let cancelled = false
    fetchDriveImageBlobUrl(fileId, accessToken)
      .then((u) => !cancelled && setUrl(u))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [fileId, accessToken])

  return (
    <div className="relative">
      {url ? (
        <img src={url} alt="Saved" className="w-20 h-20 rounded-lg object-cover border border-parchment/10" />
      ) : (
        <div className="w-20 h-20 rounded-lg bg-ink-mid border border-parchment/10 animate-pulse" />
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-ink border border-rose text-rose text-sm flex items-center justify-center"
        aria-label="Remove photo"
      >
        ×
      </button>
    </div>
  )
}

export default function MilestoneForm({
  config,
  accessToken,
  userName,
  existing, // pass an existing milestone object to edit it, or omit to create new
  onSaved,
  onDeleted,
  onClose,
}) {
  const isEditing = !!existing

  const [date, setDate] = useState(existing?.date || '')
  const [event, setEvent] = useState(existing?.event || '')
  const [location, setLocation] = useState(existing?.location || '')
  const [category, setCategory] = useState(existing?.category || 'firsts')
  // existing Drive photos kept on save
  const [keptFileIds, setKeptFileIds] = useState(existing?.driveFileIds || [])
  // newly chosen local files not yet uploaded
  const [newFiles, setNewFiles] = useState([]) // [{file, previewUrl}]
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [err, setErr] = useState('')

  function handleFiles(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const withPreviews = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    setNewFiles((prev) => [...prev, ...withPreviews])
    e.target.value = '' // allow re-selecting the same file later
  }

  function removeKept(fileId) {
    setKeptFileIds((prev) => prev.filter((id) => id !== fileId))
  }

  function removeNew(index) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!date || !event) {
      setErr('Date and event are required.')
      return
    }
    setErr('')
    setSaving(true)
    try {
      const uploadedIds = []
      for (let i = 0; i < newFiles.length; i++) {
        setStatus(`Uploading photo ${i + 1} of ${newFiles.length}…`)
        const uploaded = await uploadImageToDrive(
          newFiles[i].file,
          config.driveFolderId,
          accessToken
        )
        uploadedIds.push(uploaded.id)
      }

      let lat = existing?.lat ?? null
      let lng = existing?.lng ?? null
      const locationChanged = location !== (existing?.location || '')
      if (location && (locationChanged || lat == null)) {
        setStatus('Finding location on the map…')
        const geo = await geocodeLocation(location)
        if (geo) {
          lat = geo.lat
          lng = geo.lng
        }
      }

      const milestone = {
        date,
        event,
        location,
        lat,
        lng,
        driveFileIds: [...keptFileIds, ...uploadedIds],
        addedBy: existing?.addedBy || userName,
        category,
      }

      setStatus('Saving…')
      if (isEditing) {
        await updateMilestone(config.sheetId, accessToken, existing.rowIndex, milestone)
      } else {
        await appendMilestone(config.sheetId, accessToken, milestone)
      }

      setStatus('')
      onSaved()
    } catch (e2) {
      console.error(e2)
      setErr('Something went wrong saving this milestone. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setDeleting(true)
    setErr('')
    try {
      await clearMilestoneRow(config.sheetId, accessToken, existing.rowIndex)
      // best-effort photo cleanup; do not block on failures
      for (const id of existing.driveFileIds || []) {
        deleteDriveFile(id, accessToken).catch(() => {})
      }
      onDeleted()
    } catch (e2) {
      console.error(e2)
      setErr('Could not delete this milestone. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/95 z-50 overflow-y-auto">
      <div className="max-w-md mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display italic text-parchment text-3xl">
            {isEditing ? 'Edit milestone' : 'New milestone'}
          </h2>
          <button
            onClick={onClose}
            className="text-parchment/50 hover:text-parchment text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gold text-xs uppercase tracking-wider mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-ink-mid text-parchment rounded-lg px-4 py-3 border border-parchment/10 focus:border-gold outline-none [color-scheme:dark]"
              required
            />
          </div>

          <div>
            <label className="block text-gold text-xs uppercase tracking-wider mb-2">
              Event
            </label>
            <input
              type="text"
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              placeholder="First steps, first word, first day of school…"
              className="w-full bg-ink-mid text-parchment placeholder-parchment/30 rounded-lg px-4 py-3 border border-parchment/10 focus:border-gold outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-gold text-xs uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                  style={
                    category === c.id
                      ? { background: c.color, borderColor: c.color, color: '#0A1220' }
                      : { borderColor: `${c.color}55`, color: c.color }
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gold text-xs uppercase tracking-wider mb-2">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Goa, India"
              className="w-full bg-ink-mid text-parchment placeholder-parchment/30 rounded-lg px-4 py-3 border border-parchment/10 focus:border-gold outline-none"
            />
          </div>

          <div>
            <label className="block text-gold text-xs uppercase tracking-wider mb-2">
              Photos
            </label>

            {(keptFileIds.length > 0 || newFiles.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-3">
                {keptFileIds.map((id) => (
                  <KeptPhotoThumb
                    key={id}
                    fileId={id}
                    accessToken={accessToken}
                    onRemove={() => removeKept(id)}
                  />
                ))}
                {newFiles.map((f, i) => (
                  <div key={i} className="relative">
                    <img
                      src={f.previewUrl}
                      alt="New upload"
                      className="w-20 h-20 rounded-lg object-cover border border-parchment/10"
                    />
                    <button
                      type="button"
                      onClick={() => removeNew(i)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-ink border border-rose text-rose text-sm flex items-center justify-center"
                      aria-label="Remove photo"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-parchment/25 rounded-lg py-6 cursor-pointer hover:border-gold transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
                className="hidden"
              />
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gold/60">
                <rect x="3" y="6" width="18" height="14" rx="2" />
                <circle cx="12" cy="13" r="3.5" />
                <path d="M8 6l1.5-2h5L16 6" />
              </svg>
              <span className="text-parchment/40 text-sm">
                Add photo{keptFileIds.length + newFiles.length > 0 ? 's' : ''}
              </span>
            </label>
          </div>

          {err && <p className="text-rose text-sm">{err}</p>}

          <button
            type="submit"
            disabled={saving || deleting}
            className="w-full bg-gold hover:bg-gold-soft transition-colors text-ink font-medium py-3 rounded-full disabled:opacity-50"
          >
            {saving ? status || 'Saving…' : isEditing ? 'Save changes' : 'Save milestone'}
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving || deleting}
              className={`w-full py-3 rounded-full font-medium transition-colors disabled:opacity-50 ${
                confirmDelete
                  ? 'bg-rose text-ink'
                  : 'bg-transparent text-rose border border-rose/40 hover:border-rose'
              }`}
            >
              {deleting
                ? 'Deleting…'
                : confirmDelete
                ? 'Tap again to confirm delete'
                : 'Delete milestone'}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
