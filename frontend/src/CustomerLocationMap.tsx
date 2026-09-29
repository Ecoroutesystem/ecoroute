import { useEffect } from 'react'
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

type CustomerLocationMapProps = {
  position: [number, number]
  interactive?: boolean
  selected?: boolean
  onSelect?: (latitude: number, longitude: number) => void
}

export default function CustomerLocationMap({ position, interactive = false, selected = false, onSelect }: CustomerLocationMapProps) {
  return <MapContainer className={`customer-registration-map ${interactive ? '' : 'review-map'}`} center={position} zoom={interactive ? 13 : 15} scrollWheelZoom={interactive}><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><MapRecenter position={position} />{interactive && <MapPointSelector onSelect={onSelect} />}{selected && <CircleMarker center={position} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: '#1d8b55', fillOpacity: 1 }} />}</MapContainer>
}

function MapPointSelector({ onSelect }: { onSelect?: (latitude: number, longitude: number) => void }) {
  useMapEvents({ click: ({ latlng }) => onSelect?.(latlng.lat, latlng.lng) })
  return null
}

function MapRecenter({ position }: { position: [number, number] }) {
  const map = useMap()
  const [latitude, longitude] = position
  useEffect(() => { map.setView([latitude, longitude], Math.max(map.getZoom(), 13)) }, [map, latitude, longitude])
  return null
}