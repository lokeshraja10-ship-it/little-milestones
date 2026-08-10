export default function Login({ onSignIn, loading, error }) {
  return (
    <div className="min-h-screen bg-ink bg-stars flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <img
          src="/aarna.jpg"
          alt="Aarna"
          onError={(e) => { e.target.style.display = 'none' }}
          className="w-28 h-28 rounded-full mx-auto mb-6 object-cover border-2 border-gold/50 shadow-[0_0_24px_rgba(212,169,75,0.35)]"
        />
        <p className="text-gold/80 tracking-[0.3em] text-xs uppercase mb-3">
          A record of Aarna's world
        </p>
        <h1 className="font-display italic text-parchment text-5xl mb-6 leading-tight">
          Little Milestones
        </h1>
        <p className="text-parchment/60 text-sm mb-10 leading-relaxed">
          Every first step, every new place — gathered in one quiet place for
          your family to keep.
        </p>
        <button
          onClick={onSignIn}
          disabled={loading}
          className="w-full bg-gold hover:bg-gold-soft transition-colors text-ink font-medium py-3 rounded-full disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in with Google'}
        </button>
        {error && (
          <p className="text-rose text-xs mt-4">{error}</p>
        )}
      </div>
    </div>
  )
}
