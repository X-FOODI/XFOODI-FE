import { useTenant } from '@/lib/contexts/TenantContext';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface LoginHeaderProps {
  title?: string;
}

const LoginHeader: React.FC<LoginHeaderProps> = ({ title }) => {
  const { t } = useTranslation('auth');
  const { tenant } = useTenant();
  const displayTitle = title || tenant?.businessName || tenant?.name || t('login_header.default_title');
  const restaurantName = tenant?.businessName || tenant?.name || "Restaurant";

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
          <img
            src={tenant?.logoUrl?.trim() || "/images/logo/restx-removebg-preview.png"}
            alt={restaurantName || "Restaurant Logo"}
            className="w-full h-full object-contain app-logo-img"
            onError={(e) => { e.currentTarget.src = "/images/logo/restx-removebg-preview.png" }}
          />
        </div>
        <div>
          <h2 className="text-3xl font-bold" style={{ background: `linear-gradient(to right, var(--primary), var(--primary))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' } as React.CSSProperties}>{displayTitle}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('login_header.welcome_to')} {restaurantName}</p>
        </div>
      </div>
    </div>
  );
};

export default LoginHeader;
