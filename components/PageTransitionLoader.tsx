'use client';

import { useTenant } from '@/lib/contexts/TenantContext';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// ─── CSS — only things RAF can't do ───────────────────────────────────────────
const CSS = `
  @keyframes overlayIn  { from{opacity:0} to{opacity:1} }
  @keyframes overlayOut { from{opacity:1} to{opacity:0} }

  @keyframes lidRattle {
    0%,100% { transform:translateY(0)   rotate(0deg);    }
    20%     { transform:translateY(-4px) rotate(-1.8deg); }
    45%     { transform:translateY(-7px) rotate(2.2deg);  }
    70%     { transform:translateY(-3px) rotate(-1.2deg); }
  }
  @keyframes lidRattleWild {
    0%,100% { transform:translateY(0)    rotate(0deg);   }
    15%     { transform:translateY(-9px) rotate(-3.5deg);}
    35%     { transform:translateY(-12px) rotate(4deg);  }
    55%     { transform:translateY(-6px) rotate(-2.5deg);}
    75%     { transform:translateY(-10px) rotate(3deg);  }
  }

  @keyframes bubbleRise {
    0%   { transform:translateY(0)     scale(0.4); opacity:0;   }
    12%  { opacity:1; }
    85%  { opacity:0.6; }
    100% { transform:translateY(-78px) scale(1.2); opacity:0;   }
  }

  @keyframes steamWaft {
    0%   { transform:translateY(0)     scaleX(1)   skewX(0deg);  opacity:0;   }
    18%  { opacity:0.55; }
    65%  { transform:translateY(-32px) scaleX(0.6) skewX(7deg);  opacity:0.25;}
    100% { transform:translateY(-60px) scaleX(0.25) skewX(-5deg);opacity:0;   }
  }

  @keyframes waveA {
    0%,100% { transform:translateX(0); }
    50%     { transform:translateX(-18px); }
  }
  @keyframes waveB {
    0%,100% { transform:translateX(0); }
    50%     { transform:translateX(14px); }
  }

  @keyframes potIn {
    0%   { transform:scale(0.65) translateY(18px); opacity:0; }
    65%  { transform:scale(1.05) translateY(-2px); opacity:1; }
    100% { transform:scale(1)    translateY(0);    opacity:1; }
  }

  @keyframes flameBlink {
    0%,100% { opacity:0.75; transform:scaleY(1); }
    50%     { opacity:1;    transform:scaleY(1.15); }
  }

  @keyframes logoIn {
    0%   { opacity:0; transform:translateY(10px) scale(0.88); }
    65%  { opacity:1; transform:translateY(-2px) scale(1.04); }
    100% { opacity:1; transform:translateY(0)    scale(1);    }
  }
  @keyframes logoOut { to { opacity:0; transform:scale(0.9) translateY(-6px); } }

  @keyframes textBlink {
    0%,100% { opacity:0.4; }
    50%      { opacity:1;   }
  }

  .pot-scene { animation: potIn 480ms cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .lid-calm  { animation: lidRattle     1200ms ease infinite; transform-origin:center bottom; }
  .lid-wild  { animation: lidRattleWild  640ms ease infinite; transform-origin:center bottom; }
`;

const DURATION = 2000;
const FADEOUT = 500;
const T_TOTAL = DURATION + FADEOUT;

// ─── Utils ────────────────────────────────────────────────────────────────────
function easeInOut(t: number) {
    return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
}

function lerpColor(a: string, b: string, t: number) {
    const p = (h: string, o: number) => parseInt(h.slice(1 + o * 2, 3 + o * 2), 16);
    const r = Math.round(p(a, 0) + (p(b, 0) - p(a, 0)) * t);
    const g = Math.round(p(a, 1) + (p(b, 1) - p(a, 1)) * t);
    const bl = Math.round(p(a, 2) + (p(b, 2) - p(a, 2)) * t);
    return `rgb(${r},${g},${bl})`;
}

function getLiquidColor(pct: number) {
    if (pct < 33) return lerpColor('#60a5fa', '#fb923c', pct / 33);
    if (pct < 66) return lerpColor('#fb923c', '#ef4444', (pct - 33) / 33);
    return lerpColor('#ef4444', '#FF380B', (pct - 66) / 34);
}

function getGlowColor(pct: number) {
    if (pct < 40) return '96,165,250';
    if (pct < 70) return '251,146,60';
    return '239,68,68';
}

function getHeatLabel(pct: number) {
    if (pct < 20) return 'Đang làm nóng...';
    if (pct < 50) return 'Đang đun...';
    if (pct < 85) return 'Đang sôi...';
    return 'Sôi rồi!';
}

// ─── Inner overlay ────────────────────────────────────────────────────────────
function PotBubbleOverlay({ visible, brandName }: { visible: boolean; brandName?: string }) {
    const [mounted, setMounted] = useState(false);
    const [exiting, setExiting] = useState(false);
    const [showLogo, setShowLogo] = useState(false);
    const [isWild, setIsWild] = useState(false);

    const liquidRef = useRef<SVGRectElement>(null);
    const waveARef = useRef<SVGRectElement>(null);
    const waveBRef = useRef<SVGRectElement>(null);
    const barRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);
    const labelRef = useRef<HTMLDivElement>(null);
    const flamesRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);
    const startRef = useRef<number | null>(null);
    const ts = useRef<ReturnType<typeof setTimeout>[]>([]);

    const clr = () => { ts.current.forEach(clearTimeout); ts.current = []; };
    const at = (fn: () => void, ms: number) => { const t = setTimeout(fn, ms); ts.current.push(t); };

    useEffect(() => {
        if (!visible) {
            clr();
            setExiting(true);
            const t = setTimeout(() => {
                setMounted(false);
                setExiting(false);
                setShowLogo(false);
                setIsWild(false);
            }, FADEOUT);
            ts.current.push(t);
            return;
        }

        setMounted(true); setExiting(false);
        setShowLogo(false); setIsWild(false);
        startRef.current = null;

        const tick = (now: number) => {
            if (!startRef.current) startRef.current = now;
            const raw = Math.min((now - startRef.current) / DURATION, 1);
            const pct = easeInOut(raw) * 100;
            const fillH = Math.max(3, (pct / 100) * 70);
            const yPos = 112 - fillH;
            const lColor = getLiquidColor(pct);

            if (liquidRef.current) {
                liquidRef.current.setAttribute('y', String(yPos));
                liquidRef.current.setAttribute('height', String(fillH + 8));
                liquidRef.current.setAttribute('fill', lColor);
            }
            const wy = yPos - 10;
            if (waveARef.current) waveARef.current.setAttribute('y', String(wy));
            if (waveBRef.current) waveBRef.current.setAttribute('y', String(wy));
            if (barRef.current) barRef.current.style.width = `${pct}%`;

            const gc = getGlowColor(pct);
            if (glowRef.current)
                glowRef.current.style.background = `radial-gradient(ellipse, rgba(${gc},0.18) 0%, transparent 70%)`;

            if (labelRef.current) labelRef.current.textContent = getHeatLabel(pct);

            if (flamesRef.current) {
                const fh = pct < 20 ? 7 : pct < 50 ? 12 : pct < 80 ? 17 : 22;
                Array.from(flamesRef.current.children).forEach((c, i) => {
                    (c as HTMLElement).style.height = `${fh + i * 2}px`;
                });
            }

            if (raw < 1) rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);

        at(() => setShowLogo(true), DURATION * 0.3);
        at(() => setIsWild(true), DURATION * 0.75);

        return () => { clr(); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [visible]);

    if (!mounted) return null;

    return (
        <>
            <style>{CSS}</style>

            <div style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-base)',
                pointerEvents: exiting ? 'none' : 'all',
                animation: exiting
                    ? `overlayOut ${FADEOUT}ms ease forwards`
                    : `overlayIn 180ms ease forwards`,
            }}>

                <div ref={glowRef} style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(ellipse, rgba(96,165,250,0.18) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />

                <div className="pot-scene" style={{ position: 'relative' }}>

                    {/* Lid */}
                    <div className={isWild ? 'lid-wild' : 'lid-calm'} style={{
                        position: 'relative', zIndex: 4, marginBottom: -3,
                    }}>
                        <svg width="154" height="46" viewBox="0 0 154 46" fill="none">
                            <defs>
                                <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#e2e8f0" />
                                    <stop offset="100%" stopColor="#94a3b8" />
                                </linearGradient>
                            </defs>
                            <path d="M10 36 Q77 5 144 36 Z" fill="url(#lg)" stroke="#94a3b8" strokeWidth="1.5" />
                            <rect x="6" y="34" width="142" height="8" rx="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                            <rect x="65" y="1" width="24" height="13" rx="6.5" fill="#94a3b8" stroke="#64748b" strokeWidth="1.5" />
                            <rect x="69" y="4" width="16" height="4" rx="2" fill="rgba(255,255,255,0.32)" />
                            <path d="M26 30 Q77 11 128 30" stroke="rgba(255,255,255,0.28)" strokeWidth="3" strokeLinecap="round" fill="none" />
                        </svg>

                        {[
                            { l: '28%', d: 0, dur: 980 },
                            { l: '44%', d: 210, dur: 850 },
                            { l: '58%', d: 110, dur: 1020 },
                            { l: '72%', d: 360, dur: 800 },
                        ].map((s, i) => (
                            <div key={i} style={{
                                position: 'absolute', bottom: '102%', left: s.l,
                                width: 8, height: 8, borderRadius: '50%',
                                background: 'rgba(255,255,255,0.5)',
                                filter: 'blur(3px)',
                                animation: `steamWaft ${s.dur}ms ease ${s.d}ms infinite`,
                                transformOrigin: 'bottom center',
                            }} />
                        ))}
                    </div>

                    {/* Pot body */}
                    <div style={{ position: 'relative', zIndex: 3 }}>
                        <svg width="154" height="120" viewBox="0 0 154 120" fill="none" style={{ overflow: 'visible' }}>
                            <defs>
                                <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#64748b" />
                                    <stop offset="100%" stopColor="#1e293b" />
                                </linearGradient>
                                <clipPath id="pc">
                                    <path d="M13 8 L10 112 Q10 118 17 118 L137 118 Q144 118 144 112 L141 8 Z" />
                                </clipPath>
                            </defs>

                            <path d="M13 8 L10 112 Q10 118 17 118 L137 118 Q144 118 144 112 L141 8 Z"
                                fill="url(#pg)" stroke="#475569" strokeWidth="2" />

                            <g clipPath="url(#pc)">
                                <rect ref={liquidRef} x="10" y="112" width="134" height="8" fill="#60a5fa" />
                                <rect ref={waveARef} x="-10" y="102" width="174" height="14" rx="6"
                                    fill="rgba(255,255,255,0.18)"
                                    style={{ animation: 'waveA 1100ms ease-in-out infinite' }} />
                                <rect ref={waveBRef} x="-10" y="105" width="174" height="10" rx="5"
                                    fill="rgba(255,255,255,0.1)"
                                    style={{ animation: 'waveB 800ms ease-in-out 180ms infinite' }} />

                                {[
                                    { x: 18, s: 7, d: 0, dur: 920 },
                                    { x: 36, s: 5, d: 240, dur: 760 },
                                    { x: 54, s: 9, d: 80, dur: 1050 },
                                    { x: 68, s: 6, d: 360, dur: 830 },
                                    { x: 84, s: 4, d: 160, dur: 690 },
                                    { x: 26, s: 8, d: 520, dur: 980 },
                                    { x: 72, s: 5, d: 640, dur: 740 },
                                    { x: 48, s: 6, d: 300, dur: 870 },
                                ].map((b, i) => (
                                    <circle key={i} cx={b.x} cy={110} r={b.s / 2}
                                        fill="rgba(255,255,255,0.75)"
                                        style={{ animation: `bubbleRise ${b.dur}ms ease ${b.d}ms infinite`, opacity: 0 }}
                                    />
                                ))}
                            </g>

                            <path d="M20 16 L16 98" stroke="rgba(255,255,255,0.1)" strokeWidth="7" strokeLinecap="round" />
                            <rect x="10" y="5" width="134" height="10" rx="5" fill="#475569" stroke="#64748b" strokeWidth="1" />
                            <path d="M4 28 Q-3 28 -3 50 Q-3 72 4 72 L13 72 L13 28 Z" fill="#475569" stroke="#64748b" strokeWidth="1.5" />
                            <path d="M150 28 Q157 28 157 50 Q157 72 150 72 L141 72 L141 28 Z" fill="#475569" stroke="#64748b" strokeWidth="1.5" />
                        </svg>

                        <div ref={flamesRef} style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 3 }}>
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} style={{
                                    width: 10, height: 8,
                                    borderRadius: '50% 50% 30% 30%',
                                    background: i % 2 === 0
                                        ? 'linear-gradient(to top,#ef4444,#fbbf24)'
                                        : 'linear-gradient(to top,#fb923c,#fde68a)',
                                    filter: 'blur(1.5px)',
                                    animation: `flameBlink ${580 + i * 90}ms ease ${i * 110}ms infinite`,
                                    transition: 'height 0.4s ease',
                                }} />
                            ))}
                        </div>
                    </div>
                </div>

                <div ref={labelRef} style={{
                    marginTop: 14, fontSize: 12, fontWeight: 700,
                    color: 'var(--text-muted)', fontFamily: "'DM Sans',sans-serif",
                    letterSpacing: '0.1em', animation: 'textBlink 1.4s ease infinite', height: 18,
                }}>
                    Đang làm nóng...
                </div>

                <div style={{
                    marginTop: 8, width: 150, height: 3, borderRadius: 99,
                    background: 'var(--surface)', overflow: 'hidden', border: '1px solid var(--border)',
                }}>
                    <div ref={barRef} style={{
                        height: '100%', width: '0%', borderRadius: 99,
                        background: 'linear-gradient(90deg,#60a5fa,#fb923c,#ef4444,var(--primary))',
                        backgroundSize: '150px 100%',
                    }} />
                </div>

                {showLogo && (
                    <div style={{
                        marginTop: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        animation: 'logoIn 300ms cubic-bezier(0.34,1.56,0.64,1) forwards',
                        pointerEvents: 'none',
                    }}>
                        <p style={{
                            margin: 0, lineHeight: 1, fontSize: 22, fontWeight: 900,
                            letterSpacing: '0.05em', textTransform: 'uppercase',
                            fontFamily: "'DM Sans','Barlow Condensed',sans-serif", color: 'var(--text)',
                        }}>
                            {brandName || 'Restaurant'}
                        </p>
                        <p style={{
                            margin: 0, fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase',
                            color: 'var(--text-muted)', fontFamily: "'DM Sans',sans-serif",
                        }}>
                            {brandName ? 'Welcome back' : 'Restaurant Platform'}
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}

// ─── Trigger helpers ──────────────────────────────────────────────────────────

function isHardRefresh(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        if (nav) return nav.type === 'reload';
        return (performance as any).navigation?.type === 1;
    } catch {
        return false;
    }
}

// ─── Custom events (namespaced) ───────────────────────────────────────────────
const EV_LOADING = 'app:page-loading';
const EV_LOADED = 'app:page-loaded';

/**
 * Hook để báo cho loader biết trang đang fetch dữ liệu chậm.
 * Loader chỉ hiện sau 600ms — trang load nhanh sẽ không thấy gì.
 *
 * @example
 *   usePageLoading(isLoading)  // isLoading từ useState / SWR / React Query
 */
export function usePageLoading(
    isLoading: boolean,
    options?: { onlyInitial?: boolean; key?: string }
) {
    const shouldDispatch = useRef(true);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const isAdminRoute = window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/tour');
        const onlyInitial = options?.onlyInitial ?? isAdminRoute;
        if (!onlyInitial) {
            shouldDispatch.current = true;
            return;
        }

        const storageKey = `page-loading-once:${options?.key || window.location.pathname}`;
        const hasShown = sessionStorage.getItem(storageKey) === '1';
        shouldDispatch.current = !hasShown;

        if (isLoading && shouldDispatch.current) {
            sessionStorage.setItem(storageKey, '1');
        }
    }, [isLoading, options?.onlyInitial, options?.key]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (!shouldDispatch.current) {
            if (!isLoading) {
                window.dispatchEvent(new CustomEvent(EV_LOADED));
            }
            return;
        }

        window.dispatchEvent(new CustomEvent(isLoading ? EV_LOADING : EV_LOADED));
    }, [isLoading]);
}

// ─── Route watcher (3 triggers) ───────────────────────────────────────────────
const SHOW_DELAY = 350;
const MAX_WAIT = 8000;
const MIN_VISIBLE_MS = 250;

export function PageTransitionLoader() {
    const { tenant } = useTenant();
    const pathname = usePathname();
    const brandName = tenant?.businessName || tenant?.name;
    const [loading, setLoading] = useState(false);

    // Ref to avoid stale closures in event listeners
    const loadingRef = useRef(false);
    const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const forceHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const visibleSinceRef = useRef<number | null>(null);

    const show = () => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        visibleSinceRef.current = Date.now();
        setLoading(true);

        if (forceHideTimer.current) clearTimeout(forceHideTimer.current);
        forceHideTimer.current = setTimeout(() => {
            if (loadingRef.current) hide(FADEOUT);
        }, MAX_WAIT);
    };

    const hide = (afterMs = 0) => {
        if (showTimer.current) { clearTimeout(showTimer.current); showTimer.current = null; }
        if (hideTimer.current) clearTimeout(hideTimer.current);
        if (forceHideTimer.current) { clearTimeout(forceHideTimer.current); forceHideTimer.current = null; }

        const visibleFor = visibleSinceRef.current ? Date.now() - visibleSinceRef.current : 0;
        const minDelay = Math.max(0, MIN_VISIBLE_MS - visibleFor);
        const delay = Math.max(afterMs, minDelay);

        if (delay > 0) {
            hideTimer.current = setTimeout(() => {
                loadingRef.current = false;
                visibleSinceRef.current = null;
                setLoading(false);
            }, delay);
        } else {
            loadingRef.current = false;
            visibleSinceRef.current = null;
            setLoading(false);
        }
    };

    // ── Trigger 1: Hard refresh (F5 / Ctrl+R) ──
    useEffect(() => {
        if (pathname?.startsWith('/admin') || pathname?.startsWith('/tour')) return;
        if (!isHardRefresh()) return;

        show();
        const startedAt = Date.now();

        const finishWhenReady = () => {
            const elapsed = Date.now() - startedAt;
            const remaining = Math.max(0, T_TOTAL - elapsed);

            if (hideTimer.current) clearTimeout(hideTimer.current);
            hideTimer.current = setTimeout(() => {
                hide(FADEOUT);
            }, remaining);
        };

        if (document.readyState === 'complete') {
            finishWhenReady();
        } else {
            window.addEventListener('load', finishWhenReady, { once: true });
        }

        return () => {
            window.removeEventListener('load', finishWhenReady);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    // ── Trigger 1b: Initial load (non-hard refresh) ──
    useEffect(() => {
        if (pathname?.startsWith('/admin') || pathname?.startsWith('/tour')) return;
        if (isHardRefresh()) return;
        if (document.readyState === 'complete') return;

        show();

        const finish = () => {
            if (hideTimer.current) clearTimeout(hideTimer.current);
            hide(FADEOUT);
        };

        let fontReady = false;
        if (document.fonts?.ready) {
            document.fonts.ready
                .then(() => { fontReady = true; })
                .catch(() => { fontReady = true; });
        } else {
            fontReady = true;
        }

        const onLoad = () => {
            if (fontReady) {
                finish();
                return;
            }
            const t = setInterval(() => {
                if (fontReady) {
                    clearInterval(t);
                    finish();
                }
            }, 50);
        };

        window.addEventListener('load', onLoad, { once: true });
        return () => {
            window.removeEventListener('load', onLoad);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    // ── Trigger 2: Route navigation (admin page switch) ──
    const prevPathRef = useRef<string | null>(null);
    useEffect(() => {
        if (!pathname) return;

        if (prevPathRef.current === null) {
            prevPathRef.current = pathname;
            return;
        }

        prevPathRef.current = pathname;
    }, [pathname]);

    // ── Trigger 3: Slow page content (via usePageLoading hook) ──
    useEffect(() => {
        const handleLoading = () => {
            if (loadingRef.current) return; // already showing
            if (showTimer.current) clearTimeout(showTimer.current);
            // Only show after SHOW_DELAY — cancels if page loads in time
            showTimer.current = setTimeout(() => {
                show();
            }, SHOW_DELAY);
        };

        const handleLoaded = () => {
            // Page finished before threshold → cancel pending show, no overlay
            if (showTimer.current) { clearTimeout(showTimer.current); showTimer.current = null; }
            if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
            if (forceHideTimer.current) { clearTimeout(forceHideTimer.current); forceHideTimer.current = null; }
            // Page finished after overlay appeared → fade out
            if (loadingRef.current) hide(FADEOUT);
        };

        window.addEventListener(EV_LOADING, handleLoading);
        window.addEventListener(EV_LOADED, handleLoaded);
        return () => {
            window.removeEventListener(EV_LOADING, handleLoading);
            window.removeEventListener(EV_LOADED, handleLoaded);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <PotBubbleOverlay visible={loading} brandName={brandName} />;
}

export default PageTransitionLoader;
