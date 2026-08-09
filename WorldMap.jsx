import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

const goldIcon = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#D4A94B;box-shadow:0 0 10px 3px rgba(212,169,75,0.6);border:2px solid #0A1220;"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

export default function WorldMap({ milestones }) {
  const pins = milestones.filter((m) => m.lat != null && m.lng != null)

  const center = pins.length
    ? [pins[0].lat, pins[0].lng]
    : [20, 0]

  if (pins.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-parchment/40 font-display italic text-2xl">
          No locations mapped yet.
        </p>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-140px)]">
      <MapContainer
        center={center}
        zoom={pins.length > 1 ? 2 : 5}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {pins.map((m) => (
          <Marker key={`${m.rowIndex}-${m.date}`} position={[m.lat, m.lng]} icon={goldIcon}>
            <Popup>
              <div style={{ fontFamily: 'Work Sans, sans-serif' }}>
                <strong>{m.event}</strong>
                <br />
                {m.location}
                <br />
                <span style={{ color: '#888' }}>{m.date}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
