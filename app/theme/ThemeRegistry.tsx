'use client';

import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import xfoodiTheme from './xfoodiTheme';

export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={xfoodiTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

