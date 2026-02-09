import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import type { MandiPrice } from '@shared/types'
import EmptyState from '../Common/EmptyState'

interface MandiMapProps {
  data: MandiPrice[]
}

const getRadius = (price: number) => Math.max(6, Math.min(22, price / 50))

const MandiMap = ({ data }: MandiMapProps) => {
  if (!data.length) {
    return <EmptyState message="No mandi locations for these filters." />
  }

  const center: [number, number] = [22.9734, 78.6569]

  return (
    <div className="map-container">
      <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {data.map((mandi) => (
          <CircleMarker
            key={mandi.mandiId}
            center={[mandi.latitude, mandi.longitude]}
            radius={getRadius(mandi.modalPrice)}
            pathOptions={{
              fillColor: '#0d6a5e',
              color: '#0d6a5e',
              fillOpacity: 0.35,
            }}
          >
            <Popup>
              <strong>{mandi.mandiName}</strong>
              <div>{mandi.stateName}</div>
              <div>Price: {mandi.modalPrice}</div>
              <div>{mandi.cropName ?? 'Mixed crops'}</div>
              <div>{new Date(mandi.date).toLocaleDateString()}</div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}

export default MandiMap
