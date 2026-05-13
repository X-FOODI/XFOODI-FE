import React from "react";
import { useTranslation } from "react-i18next";

interface LoginButtonProps {
  loading?: boolean;
  text?: string;
}

const LoginButton: React.FC<LoginButtonProps> = ({
  loading = false,
  text,
}) => {
  const { t } = useTranslation('auth');
  const buttonText = text || t('login_button.login_text');
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full text-white py-3 px-4 rounded-lg font-semibold text-sm
                 transition-all duration-300 shadow-lg hover:shadow-xl
                 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none
                 focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{ background: loading ? undefined : 'var(--primary)', '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
      suppressHydrationWarning>
      {loading ? (
        <span className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {t('login_button.loading')}
        </span>
      ) : (
        buttonText
      )}
    </button>
  );
};

export default LoginButton;
