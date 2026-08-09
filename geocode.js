// Turns a free-text location ("Goa, India") into lat/lng using the free
// OpenStreetMap Nominatim API. No API key required; be a good citizen and
// keep request volume low (this app only geocodes on save, once per entry).
export async function geocodeLocation(query) {
  if (!query || !query.trim()) return null
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    query
  )}`
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en' },
  })
  if (!res.ok) return null
  const results = await res.json()
  if (!results.length) return null
  return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) }
}
