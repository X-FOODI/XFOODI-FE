'use client';

import React from 'react';
import { Dropdown, Space } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useLanguage } from './I18nProvider';

interface LanguageSwitcherProps {
  style?: React.CSSProperties;
  className?: string;
}

const FlagVN = ({ className = "w-6 h-4", style }: { className?: string, style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
    <rect width="3" height="2" fill="#DA251D" />
    <polygon points="1.5,0.6 1.577,0.836 1.826,0.836 1.625,0.982 1.702,1.218 1.5,1.072 1.298,1.218 1.375,0.982 1.174,0.836 1.423,0.836" fill="#FF0" />
  </svg>
);

const FlagEN = ({ className = "w-6 h-4", style }: { className?: string, style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
    <clipPath id="s">
      <path d="M0,0 v30 h60 v-30 z" />
    </clipPath>
    <clipPath id="t">
      <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
    </clipPath>
    <g clipPath="url(#s)">
      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </g>
  </svg>
);

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ style, className }) => {
  const { language, changeLanguage } = useLanguage();

  const items = [
    {
      key: 'vi',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
          <FlagVN style={{ width: 24, height: 16, borderRadius: 2, objectFit: 'cover' }} />
          <span style={{ fontWeight: 500 }}>Tiếng Việt</span>
        </div>
      ),
    },
    {
      key: 'en',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
          <FlagEN style={{ width: 24, height: 16, borderRadius: 2, objectFit: 'cover' }} />
          <span style={{ fontWeight: 500 }}>English</span>
        </div>
      ),
    },
  ];

  const CurrentFlag = language === 'vi' ? FlagVN : FlagEN;

  return (
    <>
      <Dropdown
        menu={{
          className: 'language-switcher-dropdown-menu',
          style: { minWidth: 180 },
          items,
          selectedKeys: [language],
          onClick: ({ key }) => changeLanguage(String(key)),
        }}
        trigger={['click']}
        placement="bottomRight"
      >
        <Space
          className={`language-switcher-trigger ${className || ''}`}
          style={{
            cursor: 'pointer',
            padding: '6px 10px',
            borderRadius: 8,
            transition: 'all 0.2s',
            border: '1px solid transparent',
            ...style,
          }}
        >
          <CurrentFlag style={{ width: 24, height: 16, borderRadius: 2, objectFit: 'cover', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: style?.color || 'var(--text)' }}>
            {language.toUpperCase()}
          </span>
          <DownOutlined style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 2 }} />
        </Space>
      </Dropdown>

      <style jsx global>{`
        .language-switcher-trigger:hover {
          background: color-mix(in srgb, var(--text) 10%, transparent);
        }

        .language-switcher-dropdown-menu {
          background: var(--card) !important;
          border: 1px solid var(--border) !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18) !important;
          padding: 8px !important;
        }

        .language-switcher-dropdown-menu .ant-dropdown-menu-item {
          color: var(--text) !important;
          border-radius: 8px !important;
        }

        .language-switcher-dropdown-menu .ant-dropdown-menu-item:hover {
          background: var(--surface-subtle) !important;
        }

        .language-switcher-dropdown-menu .ant-dropdown-menu-item-selected,
        .language-switcher-dropdown-menu .ant-dropdown-menu-item-active {
          background: color-mix(in srgb, var(--primary) 18%, transparent) !important;
          color: var(--text) !important;
        }

        .language-switcher-dropdown-menu .ant-dropdown-menu-item-selected:hover,
        .language-switcher-dropdown-menu .ant-dropdown-menu-item-active:hover {
          background: color-mix(in srgb, var(--primary) 24%, transparent) !important;
        }
      `}</style>
    </>
  );
};

export default LanguageSwitcher;
