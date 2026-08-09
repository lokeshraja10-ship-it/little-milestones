import { useState } from 'react'
import { appendMilestone, uploadImageToDrive } from '../lib/google'
import { geocodeLocation } from '../lib/geocode'

export default function MilestoneForm({ config, accessToken, userName, onAdded, onClose }) {
  const [date, setDate] = useState('')
  const [event, setEvent] = useState('')
  const [location, setLocation] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  function handleFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
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
      let driveFileId = ''
      if (file) {
        setStatus('Uploading photo…')
        const uploaded = await uploadImageToDrive(file, config.driveFolderId, accessToken)
        driveFileId = uploaded.id
      }

      let lat = null
      let lng = null
      if (location) {
        setStatus('Finding location on the map…')
        const geo = await geocodeLocation(location)
        if (geo) {
          lat = geo.lat
          lng = geo.lng
        }
      }

      setStatus('Saving…')
      await appendMilestone(config.sheetId, accessToken, {
        date,
        event,
        location,
        lat,
        lng,
        driveFileId,
        addedBy: userName,
      })

      setStatus('')
      onAdded()
    } catch (e2) {
      console.error(e2)
      setErr('Something went wrong saving this milestone. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/95 z-50 overflow-y-auto">
      <div className="max-w-md mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display italic text-parchment text-3xl">
            New milestone
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
              className="w-full bg-ink-mid text-parchment rounded-lg px-4 py-3 border border-parchment/10 focus:border-gold outline-none"
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
              Photo
            </label>
            <label className="flex items-center justify-center border border-dashed border-parchment/25 rounded-lg py-8 cursor-pointer hover:border-gold transition-colors">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFile}
                className="hidden"
              />
              {preview ? (
                <img src={preview} alt="Preview" className="max-h-40 rounded" />
              ) : (
                <span className="text-parchment/40 text-sm">
                  Tap to choose or take a photo
                </span>
              )}
            </label>
          </div>

          {err && <p className="text-rose text-sm">{err}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gold hover:bg-gold-soft transition-colors text-ink font-medium py-3 rounded-full disabled:opacity-50"
          >
            {saving ? status || 'Saving…' : 'Save milestone'}
          </button>
        </form>
      </div>
    </div>
  )
}
