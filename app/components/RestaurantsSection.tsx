'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import restaurantService, { PublicRestaurant } from '@/lib/services/restaurantService';
import { usePageTransition } from './PageTransition';
import dynamic from 'next/dynamic';
import {
  Restaurant as RestaurantIcon,
  GridView as GridViewIcon,
  Map as MapIcon,
  LocationOn as LocationOnIcon,
  Phone as PhoneIcon,
  PinDrop as PinDropIcon,
  Add as AddIcon,
  Storefront as StorefrontIcon,
} from '@mui/icons-material';

// Lazy load bản đồ hiển thị danh sách (không phải picker)
const RestaurantMapView = dynamic(() => import('./RestaurantMapView'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 480, borderRadius: 20, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Đang tải bản đồ...</p>
    </div>
  ),
});

// ── Constants ──────────────────────────────────────────────────────────────────
const CUISINE_TABS = [
  { key: 'all',        label: 'Tất cả',    color: '#FF380B' },
  { key: 'vietnamese', label: 'Việt Nam',  color: '#e67e22' },
  { key: 'japanese',   label: 'Nhật Bản',  color: '#e74c3c' },
  { key: 'fastfood',   label: 'Fast Food', color: '#9b59b6' },
  { key: 'other',      label: 'Khác',      color: '#16a085' },
];

/** Cuisine label text only — no emoji */
const cuisineLabel = (key: string) =>
  CUISINE_TABS.find((t) => t.key === key)?.label ?? 'Khác';

type ViewMode = 'grid' | 'map';

const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Cg transform='translate(160,90)'%3E%3Ccircle cx='40' cy='40' r='35' fill='%23d1d5db'/%3E%3Cpath d='M10 100 Q40 80 70 100 L70 120 L10 120 Z' fill='%23d1d5db'/%3E%3C/g%3E%3Ctext x='200' y='230' text-anchor='middle' fill='%239ca3af' font-size='14' font-family='sans-serif'%3EKh%C3%B4ng c%C3%B3 %E1%BA%A3nh%3C/text%3E%3C/svg%3E";

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
  }),
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function RestaurantsSection() {
  const [restaurants, setRestaurants] = useState<PublicRestaurant[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('all');
  const [viewMode, setViewMode]       = useState<ViewMode>('grid');
  const [selectedRestaurant, setSelectedRestaurant] = useState<PublicRestaurant | null>(null);
  const { isAnimationReady } = usePageTransition();

  useEffect(() => {
    restaurantService.listPublic()
      .then(setRestaurants)
      .catch(() => setRestaurants([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRestaurantClick = (slug: string) => {
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

  const filtered = activeTab === 'all'
    ? restaurants
    : restaurants.filter((r) => (r.cuisineType || 'other') === activeTab);

  const planBadge = (plan: string) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      FREE:       { label: 'Free',       color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
      PRO:        { label: 'Pro',        color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
      ENTERPRISE: { label: 'Enterprise', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
    };
    const info = map[plan] ?? map.FREE;
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ color: info.color, background: info.bg }}>
        {info.label}
      </span>
    );
  };

  return (
    <section id="restaurants" style={{ padding: '80px 24px', background: 'var(--bg-base)', scrollMarginTop: 120 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* ── Section Header ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isAnimationReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
          style={{ textAlign: 'center', marginBottom: 40 }}
        >
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'linear-gradient(135deg,#FFF3E8 0%,#FFE8D6 100%)', color: '#CC2D08' }}>
            <RestaurantIcon sx={{ fontSize: 16 }} />
            Đối tác của chúng tôi
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text)', lineHeight: 1.2 }}>
            Nhà hàng trên XFoodi
          </h2>
          <p className="text-base sm:text-lg" style={{ color: 'var(--text-muted)', maxWidth: 560, margin: '0 auto' }}>
            {loading ? 'Đang tải...' : `Khám phá ${restaurants.length} nhà hàng đã tin tưởng XFoodi`}
          </p>
        </motion.div>

        {/* ── Cuisine Tabs + View Toggle ─────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          {/* Cuisine filter tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CUISINE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 24,
                  border: activeTab === tab.key ? `2px solid ${tab.color}` : '2px solid var(--border)',
                  background: activeTab === tab.key ? `${tab.color}15` : 'var(--card)',
                  color: activeTab === tab.key ? tab.color : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
                {tab.key !== 'all' && !loading && (
                  <span style={{ marginLeft: 5, fontSize: 11, opacity: 0.7 }}>
                    ({restaurants.filter((r) => (r.cuisineType || 'other') === tab.key).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Grid / Map toggle */}
          <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)' }}>
            {(['grid', 'map'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 14px', borderRadius: 8, border: 'none',
                  background: viewMode === mode ? 'var(--primary)' : 'transparent',
                  color: viewMode === mode ? '#fff' : 'var(--text-muted)',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {mode === 'grid' ? (
                  <><GridViewIcon sx={{ fontSize: 16 }} /> Lưới</>
                ) : (
                  <><MapIcon sx={{ fontSize: 16 }} /> Bản đồ</>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Loading Skeleton ───────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div style={{ height: 200, background: 'var(--border)' }} />
                <div className="p-5 space-y-3">
                  <div className="h-4 rounded-full" style={{ background: 'var(--border)', width: '60%' }} />
                  <div className="h-3 rounded-full" style={{ background: 'var(--border)', width: '80%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <StorefrontIcon sx={{ fontSize: 40, color: 'var(--text-muted)' }} />
            </div>
            <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>
              {activeTab === 'all' ? 'Chưa có nhà hàng nào' : `Chưa có nhà hàng ${cuisineLabel(activeTab)}`}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Hãy là nhà hàng đầu tiên đăng ký trên XFoodi!</p>
          </motion.div>

        ) : viewMode === 'map' ? (
          /* ── MAP VIEW (Split screen like Booca) ── */
          <div style={{ display: 'flex', gap: 24, minHeight: 480, height: 520, flexWrap: 'wrap' }} className="flex-col lg:flex-row">
            {/* List of restaurants on the map */}
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', maxHeight: '100%', paddingRight: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
                {filtered.filter(r => r.latitude && r.longitude).length} nhà hàng trên bản đồ
              </div>
              {filtered.filter(r => r.latitude && r.longitude).map((r) => {
                const isSelected = selectedRestaurant?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRestaurant(r)}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: 12,
                      borderRadius: 12,
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: isSelected ? 'var(--border)' : 'var(--card)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    className="hover:border-primary"
                  >
                    <img
                      src={r.logoUrl || FALLBACK_IMAGE}
                      alt={r.name}
                      style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 700, color: 'var(--text)' }} className="truncate">
                        {r.name}
                      </h4>
                      {r.description && (
                        <p style={{ margin: '0 0 6px 0', fontSize: 12, color: 'var(--text-muted)' }} className="line-clamp-1">
                          {r.description}
                        </p>
                      )}
                      {r.address && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <LocationOnIcon sx={{ fontSize: 12, color: 'var(--primary)' }} />
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }} className="truncate">
                            {r.address}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Map wrapper */}
            <div style={{ flex: '2 1 500px', height: '100%', minHeight: 400, borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
              <RestaurantMapView 
                restaurants={filtered} 
                selected={selectedRestaurant} 
                onSelect={setSelectedRestaurant} 
              />
            </div>
          </div>

        ) : (
          /* ── GRID VIEW ─────────────────────────────────────────────────────── */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {filtered.map((r, i) => (
              <motion.div
                key={r.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate={isAnimationReady ? 'visible' : 'hidden'}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                onClick={() => handleRestaurantClick(r.slug)}
                className="rounded-2xl overflow-hidden flex flex-col cursor-pointer"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', cursor: 'pointer' }}
              >
                {/* Cover Image */}
                <div style={{ height: 200, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                  <img
                    src={r.logoUrl || FALLBACK_IMAGE}
                    alt={r.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                  />
                  {/* Cuisine badge */}
                  <div className="absolute top-3 left-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                        color: '#fff',
                      }}>
                      {cuisineLabel(r.cuisineType || 'other')}
                    </span>
                  </div>
                  {/* Plan badge */}
                  <div className="absolute top-3 right-3">{planBadge(r.planType)}</div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold mb-1 truncate" style={{ color: 'var(--text)' }}>{r.name}</h3>
                  {r.description && (
                    <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{r.description}</p>
                  )}
                  <div className="mt-auto space-y-2">
                    {r.address && (
                      <div className="flex items-start gap-2">
                        <LocationOnIcon sx={{ fontSize: 16, color: 'var(--primary)', flexShrink: 0, mt: '2px' }} />
                        <span className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{r.address}</span>
                      </div>
                    )}
                    {r.phone && (
                      <div className="flex items-center gap-2">
                        <PhoneIcon sx={{ fontSize: 16, color: 'var(--primary)', flexShrink: 0 }} />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.phone}</span>
                      </div>
                    )}
                    {r.latitude && r.longitude && (
                      <div className="flex items-center gap-2">
                        <PinDropIcon sx={{ fontSize: 16, color: '#22c55e', flexShrink: 0 }} />
                        <span className="text-xs font-medium" style={{ color: '#22c55e' }}>Có trên bản đồ</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── CTA ─────────────────────────────────────────────────────────────── */}
        {!loading && restaurants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isAnimationReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            style={{ textAlign: 'center', marginTop: 48 }}
          >
            <a
              href="/register-restaurant"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold text-sm transition-all hover:opacity-90 hover:shadow-xl active:scale-95"
              style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #CC2D08 100%)', boxShadow: '0 8px 24px rgba(255,56,11,0.3)' }}
            >
              <AddIcon sx={{ fontSize: 16 }} />
              Đăng ký nhà hàng của bạn
            </a>
          </motion.div>
        )}
      </div>
    </section>
  );
}
