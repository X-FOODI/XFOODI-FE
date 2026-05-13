'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface RememberCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const RememberCheckbox: React.FC<RememberCheckboxProps> = ({ checked, onChange }) => {
  const { t } = useTranslation('auth');
  return (
    <div className="flex items-center mb-4">
      <input
        id="remember"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded focus:ring-2 cursor-pointer auth-checkbox"
        style={{ color: 'var(--primary)', '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
      />
      <label 
        htmlFor="remember" 
        className="ml-2 text-sm cursor-pointer auth-text"
      >
        {t('remember_me')}
      </label>
    </div>
  );
};

export default RememberCheckbox;
