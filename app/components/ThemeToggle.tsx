'use client';

import React, { useState, useEffect } from 'react';
import { Button, Tooltip } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../theme/AntdProvider';

interface ThemeToggleProps {
  style?: React.CSSProperties;
  className?: string;
}

export default function ThemeToggle({ style, className }: ThemeToggleProps) {
  const { t } = useTranslation();
  const { mode, toggleTheme } = useThemeMode();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted && mode === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Tooltip title={isDark ? t('common.theme.switch_to_light') : t('common.theme.switch_to_dark')}>
      <Button
        type="text"
        onClick={toggleTheme}
        icon={mounted ? (isDark ? <SunOutlined /> : <MoonOutlined />) : <MoonOutlined />}
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: style?.color,
          ...style,
        }}
      />
    </Tooltip>
  );
}


