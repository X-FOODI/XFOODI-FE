"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTenant } from '@/lib/contexts/TenantContext';

export const HeroSection: React.FC = () => {
    const { t } = useTranslation('auth');
    const { tenant } = useTenant();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const restaurantName = tenant?.businessName || tenant?.name;
    const logoUrl = tenant?.logoUrl?.trim() || "/images/logo/restx-removebg-preview.png";

    return (
        <div className="hidden md:block md:w-1/2 relative overflow-hidden auth-hero-panel z-10 h-full min-h-screen">
            <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQMVZhsaYs2Qw_8QN0YP6pUMn326Srs9wfsj18Q0patddJBVkz5g8pm0S3OhMz-nY-BrDmVA-ghfvRsndeKDyq7w68KAOVQDc5vQo71xWYxvYcQaEm4IFJ6BGYlfoaK6APcvIObkkPn9yvUiw6Iditv27W_j60EhvOhHb3Cwfupw1Ib5bCO6lO0NctemCVio6026jqjhbziRbrzl6OVbYkM0LUSLR_OV1pQf1oH1nNavimugtYDhjEH_oSrIweo29PEMjmlq80Ol4"
                alt="Atmospheric dark restaurant interior with warm lighting"
                className="absolute inset-0 w-full h-full object-cover opacity-80"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0E121A]/90 via-[#0E121A]/20 to-transparent"></div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 p-12 md:p-16 w-full text-white z-10">
                <div className="flex items-center gap-2 mb-6">
                    <img src={logoUrl} alt={restaurantName || "Restaurant Logo"} className="w-10 h-10 object-contain" style={{ filter: 'invert(1) hue-rotate(180deg) brightness(1.1)' }} />
                    <span className="text-xl font-bold tracking-widest uppercase">{mounted ? (restaurantName || t('login_header.default_title')) : (restaurantName || '')}</span>
                </div>

                <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-4 drop-shadow-lg">
                    {mounted ? t('hero_section.title') : ''}
                </h2>

                <p className="text-gray-300 text-lg max-w-md drop-shadow-md">
                    {mounted ? t('hero_section.description') : ''}
                </p>

                {/* Decorative Slider Indicators */}
                <div className="mt-8 flex gap-2">
                    <div className="h-1 w-8 bg-[var(--primary)] rounded-full shadow-[0_0_10px_rgba(255,56,11,0.5)]"></div>
                    <div className="h-1 w-2 bg-white/30 rounded-full"></div>
                    <div className="h-1 w-2 bg-white/30 rounded-full"></div>
                </div>
            </div>
        </div>
    );
};
