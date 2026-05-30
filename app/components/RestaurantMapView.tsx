'use client';

import { useEffect, useRef, useState } from 'react';
import type { PublicRestaurant } from '@/lib/services/restaurantService';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Close as CloseIcon, LocationOn as LocationOnIcon, Phone as PhoneIcon, Warning as WarningIcon, Map as MapIcon } from '@mui/icons-material';
import { renderToString } from 'react-dom/server';

interface RestaurantMapViewProps {
  restaurants: PublicRestaurant[];
  selected: PublicRestaurant | null;
  onSelect: (selected: PublicRestaurant | null) => void;
}

const CUISINE_COLORS: Record<string, string> = {
  vietnamese: '#e67e22',
  japanese:   '#e74c3c',
  fastfood:   '#9b59b6',
  other:      '#16a085',
};

const CUISINE_LABELS: Record<string, string> = {
  vietnamese: 'Việt Nam',
  japanese:   'Nhật Bản',
  fastfood:   'Fast Food',
  other:      'Khác',
};

/** Inline SVG for map marker icon — matches MUI Restaurant icon path */
const MARKER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18.6 6.62c-1.44 0-2.8.56-3.77 1.53L12 10.66 10.48 12h.01L7.8 14.39c-.64.64-1.49.99-2.4.99-1.87 0-3.39-1.51-3.39-3.38S3.53 8.62 5.4 8.62c.91 0 1.76.35 2.44 1.03l1.13 1 1.51-1.34L9.22 8.2C8.2 7.18 6.84 6.62 5.4 6.62 2.42 6.62 0 9.04 0 12s2.42 5.38 5.4 5.38c1.44 0 2.8-.56 3.77-1.53l2.83-2.5.01.01L13.52 12h-.01l2.69-2.39c.64-.64 1.49-.99 2.4-.99 1.87 0 3.39 1.51 3.39 3.38s-1.52 3.38-3.39 3.38c-.91 0-1.76-.35-2.44-1.03l-1.13-1-1.51 1.34 1.27 1.12c1.02 1.01 2.37 1.57 3.81 1.57 2.98 0 5.4-2.41 5.4-5.38s-2.42-5.38-5.4-5.38z"/></svg>`;

const FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect width='60' height='60' rx='8' fill='%23f1f5f9'/%3E%3Cpath d='M30 18c-6.6 0-12 5.4-12 12 0 9 12 22 12 22s12-13 12-22c0-6.6-5.4-12-12-12zm0 16c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z' fill='%23cbd5e1'/%3E%3C/svg%3E";

export default function RestaurantMapView({ restaurants, selected, onSelect }: RestaurantMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<any>(null);
  const markersRef      = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const handleRestaurantRedirect = (slug: string) => {
    if (typeof window === 'undefined') return;
    const host = window.location.host;
    const protocol = window.location.protocol;
    const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "xfoodi.website";
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

    let targetUrl = '';
    if (isLocalhost) {
      const port = host.includes(':') ? `:${host.split(':')[1]}` : '';
      targetUrl = `${protocol}//${slug}.localhost${port}`;
    } else {
      targetUrl = `${protocol}//${slug}.${BASE_DOMAIN}`;
    }
    window.location.href = targetUrl;
  };

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
  const noToken = !token || token.includes('placeholder');

  const mappable = restaurants.filter((r) => r.latitude && r.longitude);
  const noCoords = restaurants.filter((r) => !r.latitude || !r.longitude);

  useEffect(() => {
    if (mapRef.current && selected && selected.longitude && selected.latitude) {
      mapRef.current.flyTo({
        center: [selected.longitude, selected.latitude],
        zoom: 16,
        essential: true,
      });
    }
  }, [selected]);

  useEffect(() => {
    if (noToken || !mapContainerRef.current || mapRef.current) return;

    import('mapbox-gl').then((mod) => {
      const mapboxgl = mod.default;
      mapboxgl.accessToken = token;

      const centerLat = mappable.length
        ? mappable.reduce((s, r) => s + r.latitude!, 0) / mappable.length
        : 10.8231;
      const centerLng = mappable.length
        ? mappable.reduce((s, r) => s + r.longitude!, 0) / mappable.length
        : 106.6297;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [centerLng, centerLat],
        zoom: mappable.length === 1 ? 14 : 11,
        language: 'vi',
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.on('load', () => {
        setMapReady(true);

        mappable.forEach((r) => {
          const color = CUISINE_COLORS[r.cuisineType || 'other'] || '#FF380B';

          // Professional teardrop marker — no emoji, uses inline SVG icon
          const el = document.createElement('div');
          el.style.cssText = `
            width: 40px; height: 40px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            background: ${color};
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.2s, box-shadow 0.2s;
          `;

          // Inner container — unrotated — using a simple dot instead of emoji
          const inner = document.createElement('div');
          inner.style.cssText = `
            transform: rotate(45deg);
            width: 14px; height: 14px;
            border-radius: 50%;
            background: rgba(255,255,255,0.85);
            flex-shrink: 0;
          `;
          el.appendChild(inner);

          el.addEventListener('click', (e) => {
            e.stopPropagation();
            onSelect(r);
          });
          el.addEventListener('mouseenter', () => {
            el.style.transform = 'rotate(-45deg) scale(1.25)';
            el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.35)';
          });
          el.addEventListener('mouseleave', () => {
            el.style.transform = 'rotate(-45deg) scale(1)';
            el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
          });

          const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([r.longitude!, r.latitude!])
            .addTo(map);

          markersRef.current.push(marker);
        });

        if (mappable.length > 1) {
          const bounds = new mapboxgl.LngLatBounds();
          mappable.forEach((r) => bounds.extend([r.longitude!, r.latitude!]));
          map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
        }
      });

      map.on('click', () => onSelect(null));
      mapRef.current = map;
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, restaurants.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Map container */}
      <div style={{
        position: 'relative', height: 480, borderRadius: 20,
        overflow: 'hidden', border: '1px solid var(--border)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        {noToken ? (
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12,
            background: 'var(--card)',
          }}>
            <MapIcon sx={{ fontSize: 48, color: 'var(--text-muted)' }} />
            <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
              Bản đồ cần Mapbox token.<br />
              Thêm <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> vào .env.local<br />
              Đăng ký miễn phí tại <a href="https://mapbox.com" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>mapbox.com</a>
            </p>
          </div>
        ) : (
          <>
            <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0 }} />

            {/* Legend */}
            {mapReady && (
              <div style={{
                position: 'absolute', bottom: 12, left: 12, zIndex: 5,
                background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
                borderRadius: 12, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Loại ẩm thực
                </p>
                {Object.entries(CUISINE_COLORS).map(([key, color]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#555' }}>
                      {CUISINE_LABELS[key] ?? key}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Selected restaurant popup */}
            {selected && (
              <div 
                onClick={() => handleRestaurantRedirect(selected.slug)}
                style={{
                  position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
                  zIndex: 10, background: 'white', borderRadius: 16, padding: 14,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)', display: 'flex', gap: 12,
                  alignItems: 'flex-start', maxWidth: 340, width: 'calc(100% - 40px)',
                  animation: 'slideDown 0.25s ease',
                  cursor: 'pointer',
                }}>
                <img
                  src={selected.logoUrl || FALLBACK_IMG}
                  alt={selected.name}
                  style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }}
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selected.name}
                  </p>
                  {selected.address && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginTop: 4 }}>
                      <LocationOnIcon sx={{ fontSize: 13, color: '#FF380B', flexShrink: 0, mt: '1px' }} />
                      <p style={{ margin: 0, fontSize: 12, color: '#666', lineHeight: 1.4 }}>{selected.address}</p>
                    </div>
                  )}
                  {selected.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <PhoneIcon sx={{ fontSize: 13, color: '#666', flexShrink: 0 }} />
                      <p style={{ margin: 0, fontSize: 12, color: '#888' }}>{selected.phone}</p>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onSelect(null); }}
                  style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', flexShrink: 0, padding: 0, display: 'flex' }}
                >
                  <CloseIcon sx={{ fontSize: 18 }} />
                </button>
              </div>
            )}

            {/* No coords warning */}
            {noCoords.length > 0 && mapReady && (
              <div style={{
                position: 'absolute', bottom: 12, right: 12, zIndex: 5,
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(255,200,0,0.1)', border: '1px solid rgba(255,180,0,0.3)',
                borderRadius: 10, padding: '7px 12px',
                fontSize: 12, color: '#92700c',
              }}>
                <WarningIcon sx={{ fontSize: 14 }} />
                {noCoords.length} nhà hàng chưa có tọa độ
              </div>
            )}
          </>
        )}
        <style>{`
          @keyframes slideDown {
            from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
        `}</style>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ padding: '8px 16px', borderRadius: 10, background: 'var(--card)', border: '1px solid var(--border)', fontSize: 13 }}>
          <span style={{ color: 'var(--text-muted)' }}>Hiển thị trên bản đồ: </span>
          <span style={{ fontWeight: 700, color: '#22c55e' }}>{mappable.length}</span>
        </div>
        {noCoords.length > 0 && (
          <div style={{ padding: '8px 16px', borderRadius: 10, background: 'var(--card)', border: '1px solid var(--border)', fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)' }}>Chưa có tọa độ: </span>
            <span style={{ fontWeight: 700, color: '#f59e0b' }}>{noCoords.length}</span>
          </div>
        )}
      </div>

      {/* Restaurants without coordinates */}
      {noCoords.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
            Nhà hàng chưa có vị trí trên bản đồ (cần cập nhật tọa độ):
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {noCoords.map((r) => (
              <span key={r.id} style={{
                padding: '4px 12px', borderRadius: 20,
                background: 'var(--card)', border: '1px solid var(--border)',
                fontSize: 12, color: 'var(--text-muted)',
              }}>
                {r.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
