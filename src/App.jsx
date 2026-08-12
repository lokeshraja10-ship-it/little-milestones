import { useEffect, useState } from 'react'
import Login from './components/Login'
import Timeline from './components/Timeline'
import WorldMap from './components/WorldMap'
import MilestoneForm from './components/MilestoneForm'
import { initGoogle, getAccessToken, fetchUserInfo, fetchMilestones } from './lib/google'

const config = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  sheetId: import.meta.env.VITE_SHEET_ID,
  driveFolderId: import.meta.env.VITE_DRIVE_FOLDER_ID,
  birthDate: import.meta.env.VITE_CHILD_BIRTHDATE || '',
}

function MissingConfig() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6 text-center">
      <div className="max-w-sm text-parchment/70">
        <p className="font-display italic text-2xl text-parchment mb-4">
          Almost there
        </p>
        <p className="text-sm leading-relaxed">
          Set <code className="text-gold">VITE_GOOGLE_CLIENT_ID</code>,{' '}
          <code className="text-gold">VITE_SHEET_ID</code>, and{' '}
          <code className="text-gold">VITE_DRIVE_FOLDER_ID</code> in your
          environment (see README.md) and reload.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [accessToken, setAccessToken] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('timeline')
  const [milestones, setMilestones] = useState([])
  const [formState, setFormState] = useState(null) // null | 'new' | milestone object to edit

  useEffect(() => {
    if (!config.clientId) return
    const t = setInterval(() => {
      if (window.google) {
        initGoogle(config.clientId).then(() => setReady(true))
        clearInterval(t)
      }
    }, 100)
    return () => clearInterval(t)
  }, [])

  async function loadMilestones(token) {
    const data = await fetchMilestones(config.sheetId, token)
    setMilestones(data)
  }

  async function handleSignIn() {
    setLoading(true)
    setError('')
    try {
      const token = await getAccessToken()
      setAccessToken(token)
      const info = await fetchUserInfo(token)
      setUser(info)
      await loadMilestones(token)
    } catch (e) {
      console.error(e)
      setError('Sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!config.clientId || !config.sheetId) {
    return <MissingConfig />
  }

  if (!accessToken) {
    return <Login onSignIn={handleSignIn} loading={loading || !ready} error={error} />
  }

  return (
    <div className="min-h-screen bg-ink bg-stars">
      <header className="max-w-md mx-auto px-6 pt-8 pb-4 flex items-center justify-between">
        <h1 className="font-display italic text-parchment text-2xl">
          Little Milestones
        </h1>
        {user?.picture && (
          <img
            src={user.picture}
            alt={user.name}
            className="w-8 h-8 rounded-full border border-gold/40"
          />
        )}
      </header>

      <nav className="max-w-md mx-auto px-6 flex gap-2 mb-2">
        {['timeline', 'map'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm capitalize transition-colors ${
              tab === t
                ? 'bg-gold text-ink font-medium'
                : 'text-parchment/50 hover:text-parchment'
            }`}
          >
            {t === 'timeline' ? 'Timeline' : 'World Map'}
          </button>
        ))}
      </nav>

      {tab === 'timeline' ? (
        <Timeline
          milestones={milestones}
          accessToken={accessToken}
          birthDate={config.birthDate}
          onEdit={(m) => setFormState(m)}
        />
      ) : (
        <WorldMap milestones={milestones} />
      )}

      <button
        onClick={() => setFormState('new')}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gold hover:bg-gold-soft shadow-[0_0_20px_rgba(212,169,75,0.4)] text-ink text-3xl leading-none flex items-center justify-center"
        aria-label="Add milestone"
      >
        +
      </button>

      {formState && (
        <MilestoneForm
          config={config}
          accessToken={accessToken}
          userName={user?.name || user?.email}
          existing={formState === 'new' ? null : formState}
          onSaved={async () => {
            setFormState(null)
            await loadMilestones(accessToken)
          }}
          onDeleted={async () => {
            setFormState(null)
            await loadMilestones(accessToken)
          }}
          onClose={() => setFormState(null)}
        />
      )}
    </div>
  )
}
