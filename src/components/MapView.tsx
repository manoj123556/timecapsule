import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Entry } from '../lib/constants';
import { format } from 'date-fns';
import { MapPin, ArrowUpRight } from 'lucide-react';

interface MapViewProps {
  entries: Entry[];
  onSelectEntry: (entry: Entry) => void;
}

// Fix for default marker icons in react-leaflet
const customIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng]);
  return null;
}

export function MapView({ entries, onSelectEntry }: MapViewProps) {
  const entriesWithLocation = entries.filter(e => e.location && e.location.lat && e.location.lng);
  
  const initialPos: [number, number] = entriesWithLocation.length > 0 
    ? [entriesWithLocation[0].location!.lat, entriesWithLocation[0].location!.lng]
    : [20, 77]; // Default to some center if none

  return (
    <div className="w-full h-full p-6 md:p-10 flex flex-col gap-8 bg-[var(--bg)]">
      <header className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--accent)]/10 rounded-full text-[var(--accent)] text-[10px] font-black uppercase tracking-[0.2em] w-fit">
          <MapPin className="w-3 h-3" />
          Geography of Memory
        </div>
        <h2 className="text-4xl font-bold text-[var(--accent)] tracking-tight">World View</h2>
        <p className="text-[var(--subtext)]/60 text-sm">{entriesWithLocation.length} moments anchored to the earth.</p>
      </header>

      <div className="flex-1 rounded-[40px] overflow-hidden border border-[var(--border)] shadow-2xl relative z-0">
        <MapContainer 
          center={initialPos} 
          zoom={4} 
          scrollWheelZoom={true} 
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {entriesWithLocation.map((entry) => (
            <Marker 
              key={entry.id} 
              position={[entry.location!.lat, entry.location!.lng]} 
              icon={customIcon}
            >
              <Popup className="premium-popup">
                <div className="p-2 space-y-3 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{entry.emoji}</span>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--subtext)] opacity-40">
                        {format(entry.manualDate ? new Date(entry.manualDate) : (entry.createdAt?.toDate?.() || new Date()), 'MMM d, yyyy')}
                      </span>
                      <h4 className="font-bold text-sm leading-tight text-[var(--text)]">{entry.title || "Untitled Fragment"}</h4>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--subtext)] line-clamp-2 italic">"{entry.content}"</p>
                  <button 
                    onClick={() => onSelectEntry(entry)}
                    className="w-full py-2 bg-[var(--accent)] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-colors"
                  >
                    Open Archive
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
          {entriesWithLocation.length > 0 && <RecenterMap lat={initialPos[0]} lng={initialPos[1]} />}
        </MapContainer>
      </div>

      <style>{`
        .leaflet-container {
          background: var(--bg);
          font-family: inherit;
        }
        .leaflet-popup-content-wrapper {
          background: var(--surface);
          color: var(--text);
          border-radius: 24px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 20px 40px -12px rgba(0,0,0,0.15);
        }
        .leaflet-popup-content {
          margin: 0;
        }
        .leaflet-popup-tip-container {
          display: none;
        }
      `}</style>
    </div>
  );
}
