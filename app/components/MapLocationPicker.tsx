'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface MapPosition {
  lat: number;
  lng: number;
}

export interface AddressResult {
  formattedAddress: string;
  city: string;
  district: string;
}

interface MapLocationPickerProps {
  initialPosition?: MapPosition;
  onPositionChange: (pos: MapPosition) => void;
  onAddressChange?: (addr: AddressResult) => void;
  height?: number;
}

// ── Reverse geocode via Mapbox (no CORS issues) ───────────────────────────────
async function reverseGeocode(
  lat: number,
  lng: number,
  token: string
): Promise<AddressResult> {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?limit=1&language=vi&country=VN&access_token=${token}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('geocode failed');
    const data = await res.json();
    const feature = data?.features?.[0];
    const context: any[] = feature?.context || [];
    const getCtx = (prefix: string) =>
      context.find((c: any) => typeof c?.id === 'string' && c.id.startsWith(prefix));
    const city     = getCtx('region')?.text || getCtx('place')?.text || '';
    const district = getCtx('locality')?.text || getCtx('district')?.text || '';
    return {
      formattedAddress: feature?.place_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      city,
      district,
    };
  } catch {
    return {
      formattedAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      city: '',
      district: '',
    };
  }
}

// ── Forward search (for the search box) ──────────────────────────────────────
export interface SearchSuggestion {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

async function searchPlaces(query: string): Promise<SearchSuggestion[]> {
  if (!query.trim() || query.length < 2) return [];
  try {
    const res = await fetch(`/api/serpapi?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.success && Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MapLocationPicker({
  initialPosition,
  onPositionChange,
  onAddressChange,
  height = 380,
}: MapLocationPickerProps) {
  const DEFAULT: MapPosition = { lat: 10.8231, lng: 106.6297 }; // HCM default

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<any>(null);
  const markerRef       = useRef<any>(null);
  const searchDebounce  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [currentPos, setCurrentPos]     = useState<MapPosition>(initialPosition ?? DEFAULT);
  const [searchQuery, setSearchQuery]   = useState('');
  const [suggestions, setSuggestions]   = useState<SearchSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locating, setLocating]         = useState(false);
  const [mapReady, setMapReady]         = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

  // Close suggestions on click outside search container
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handlePositionChange = useCallback(async (pos: MapPosition) => {
    setCurrentPos(pos);
    onPositionChange(pos);
    if (token) {
      const addr = await reverseGeocode(pos.lat, pos.lng, token);
      setSearchQuery(addr.formattedAddress);
      if (onAddressChange) {
        onAddressChange(addr);
      }
    }
  }, [onPositionChange, onAddressChange, token]);

  // Init Mapbox map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    if (!token || token.includes('placeholder')) {
      setMapReady(false);
      return;
    }

    let mapboxgl: any;
    import('mapbox-gl').then((mod) => {
      mapboxgl = mod.default;
      mapboxgl.accessToken = token;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [currentPos.lng, currentPos.lat],
        zoom: 14,
        language: 'vi',
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Draggable marker
      const marker = new mapboxgl.Marker({ color: '#FF380B', draggable: true })
        .setLngLat([currentPos.lng, currentPos.lat])
        .addTo(map);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        handlePositionChange({ lat: lngLat.lat, lng: lngLat.lng });
      });

      // Click to move marker
      map.on('click', (e: any) => {
        const pos = { lat: e.lngLat.lat, lng: e.lngLat.lng };
        marker.setLngLat([pos.lng, pos.lat]);
        handlePositionChange(pos);
        map.flyTo({ center: [pos.lng, pos.lat], zoom: 16 });
      });

      map.on('load', () => setMapReady(true));

      mapRef.current    = map;
      markerRef.current = marker;
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Sync initialPosition
  useEffect(() => {
    if (!initialPosition || !mapRef.current) return;
    mapRef.current.flyTo({ center: [initialPosition.lng, initialPosition.lat], zoom: 15 });
    markerRef.current?.setLngLat([initialPosition.lng, initialPosition.lat]);
    setCurrentPos(initialPosition);
  }, [initialPosition]);

  // Resize on fullscreen toggle
  useEffect(() => {
    const timer = setTimeout(() => { mapRef.current?.resize(); }, 200);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Search debounce
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    searchDebounce.current = setTimeout(async () => {
      setSearchLoading(true);
      const results = await searchPlaces(q);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSearchLoading(false);
    }, 350);
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current); };
  }, [searchQuery]);

  const handleSelectSuggestion = async (s: SearchSuggestion) => {
    setSearchQuery(s.name);
    setShowSuggestions(false);
    setSuggestions([]);
    const pos = { lat: s.lat, lng: s.lng };
    mapRef.current?.flyTo({ center: [s.lng, s.lat], zoom: 16 });
    markerRef.current?.setLngLat([s.lng, s.lat]);
    await handlePositionChange(pos);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom: 16 });
        markerRef.current?.setLngLat([p.lng, p.lat]);
        await handlePositionChange(p);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const noToken = !token || token.includes('placeholder');

  const mapContent = (
    <div style={{ position: 'relative', width: '100%', height: isFullscreen ? '100%' : height }}>
      {/* Search bar */}
      <div
        ref={searchContainerRef}
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 60,
          zIndex: 10,
        }}
      >
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Tìm địa điểm nhà hàng..."
            style={{
              width: '100%',
              padding: '10px 16px 10px 40px',
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--bg-base)',
              color: 'var(--text)',
              fontSize: 14,
              fontWeight: 500,
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {/* Search icon */}
          <svg
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#FF380B' }}
            width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchLoading && (
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
              <div style={{
                width: 16, height: 16, border: '2px solid #FF380B', borderTopColor: 'transparent',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          )}
        </div>

        {/* Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 4,
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              zIndex: 100,
              maxHeight: 240,
              overflowY: 'auto',
            }}
          >
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectSuggestion(s)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%',
                  padding: '10px 14px', border: 'none', background: 'transparent',
                  cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 56, 11, 0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <svg width="16" height="16" fill="none" stroke="var(--primary)" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{s.name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{s.address}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* My location button */}
      <button
        type="button"
        onClick={handleUseMyLocation}
        disabled={locating}
        title="Dùng vị trí của tôi"
        style={{
          position: 'absolute', top: 12, right: 12, zIndex: 10,
          width: 44, height: 44, borderRadius: 12, border: 'none',
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#FF380B',
        }}
      >
        {locating ? (
          <div style={{ width: 18, height: 18, border: '2px solid #FF380B', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        ) : (
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8a4 4 0 100 8 4 4 0 000-8zm0 0V3m0 13v4M3 12H8m13 0h-4" />
          </svg>
        )}
      </button>

      {/* Coordinate badge */}
      {mapReady && (
        <div style={{
          position: 'absolute', bottom: 12, left: 12, zIndex: 10,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
          color: '#fff', borderRadius: 8, padding: '5px 10px',
          fontSize: 11, fontWeight: 600, fontFamily: 'monospace',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <svg width="10" height="10" fill="#FF380B" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          {currentPos.lat.toFixed(5)}, {currentPos.lng.toFixed(5)}
        </div>
      )}

      {/* Fullscreen toggle */}
      {!isFullscreen && (
        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          title="Mở rộng bản đồ"
          style={{
            position: 'absolute', bottom: 12, right: 12, zIndex: 10,
            background: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: 8,
            padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontWeight: 600, color: '#333', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          Mở rộng
        </button>
      )}

      {/* No token fallback */}
      {noToken && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)',
          border: '2px dashed var(--border)', borderRadius: 16, gap: 12,
        }}>
          <svg width="40" height="40" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
            Bản đồ cần Mapbox token.<br />
            Thêm <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> vào .env.local
          </p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
            Tọa độ nhập tay: Lat {currentPos.lat.toFixed(5)} / Lng {currentPos.lng.toFixed(5)}
          </p>
        </div>
      )}

      {/* Map container */}
      <div
        ref={mapContainerRef}
        style={{
          position: 'absolute', inset: 0,
          borderRadius: isFullscreen ? 0 : 16,
          overflow: 'hidden',
          display: noToken ? 'none' : 'block',
        }}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (isFullscreen) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#000', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Fullscreen header */}
        <div style={{
          display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 12,
          background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            style={{
              background: 'none', border: 'none', color: '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600,
            }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại
          </button>
          <span style={{ flex: 1, color: '#fff', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="16" height="16" fill="#FF380B" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            Ghim vị trí nhà hàng
          </span>
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: '#FF380B', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14,
            }}
          >
            Xác nhận vị trí
          </button>
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          {mapContent}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: 16, overflow: 'hidden',
        border: '1px solid var(--border)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        position: 'relative',
        height,
      }}
    >
      {mapContent}
    </div>
  );
}
