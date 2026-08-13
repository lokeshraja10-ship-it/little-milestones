import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { categoryFor } from '../lib/categories'

function makeIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};box-shadow:0 0 10px 3px ${color}99;border:2px solid #0A1220;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

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
        {pins.map((m) => {
          const cat = categoryFor(m.category)
          return (
            <Marker
              key={`${m.rowIndex}-${m.date}`}
              position={[m.lat, m.lng]}
              icon={makeIcon(cat.color)}
            >
              <Popup>
                <div style={{ fontFamily: 'Work Sans, sans-serif' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      color: cat.color,
                      marginBottom: 4,
                    }}
                  >
                    {cat.label}
                  </span>
                  <br />
                  <strong>{m.event}</strong>
                  <br />
                  {m.location}
                  <br />
                  <span style={{ color: '#888' }}>{m.date}</span>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
