'use client';

import { AnimatePresence, motion } from 'framer-motion';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Context to share animation ready state
interface PageTransitionContextType {
  isAnimationReady: boolean;
}

const PageTransitionContext = createContext<PageTransitionContextType>({
  isAnimationReady: false,
});

export const usePageTransition = () => useContext(PageTransitionContext);

interface PageTransitionProps {
  children: React.ReactNode;
  minimumLoadingTime?: number;
}

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  minimumLoadingTime = 1800,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimationReady, setIsAnimationReady] = useState(false);

  useEffect(() => {
    // Check if this is a return navigation (skip loading screen if already loaded once)
    const isReturning = typeof window !== 'undefined' && sessionStorage.getItem('restx-has-loaded');
    
    if (isReturning && document.readyState === 'complete') {
      // Skip loading screen on return navigation
      setIsLoading(false);
      setIsAnimationReady(true);
      return;
    }

    let minTimeReached = false;
    let pageLoaded = false;

    const checkAndFinish = () => {
      if (minTimeReached && pageLoaded) {
        setIsLoading(false);
        sessionStorage.setItem('restx-has-loaded', 'true');
      }
    };

    // Minimum loading time
    const timer = setTimeout(() => {
      minTimeReached = true;
      checkAndFinish();
    }, minimumLoadingTime);

    // Check if page is loaded
    const handleLoad = () => {
      pageLoaded = true;
      checkAndFinish();
    };

    if (document.readyState === 'complete') {
      pageLoaded = true;
      checkAndFinish();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('load', handleLoad);
    };
  }, [minimumLoadingTime, isLoading]);

  const handleLoadingComplete = () => {
    // Start entrance animations after loading screen exits
    setTimeout(() => {
      setIsAnimationReady(true);
    }, 100);
  };

  return (
    <PageTransitionContext.Provider value={{ isAnimationReady }}>
      {/* Loading Screen */}
      <AnimatePresence mode="wait" onExitComplete={handleLoadingComplete}>
        {isLoading && (
          <motion.div
            key="loading-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="loading-screen-bg"
          >
            {/* Background glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.15, scale: 1 }}
              transition={{ duration: 0.8 }}
              style={{
                position: 'absolute',
                width: '50vw',
                height: '50vw',
                maxWidth: 500,
                maxHeight: 500,
                background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(80px)',
              }}
            />

            {/* Logo Container */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                stiffness: 180,
                damping: 20,
              }}
              style={{
                position: 'relative',
                marginBottom: 24,
              }}
            >
              {/* Rotating ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{
                  position: 'absolute',
                  top: -12,
                  left: -12,
                  right: -12,
                  bottom: -12,
                  borderRadius: '50%',
                  border: '3px solid transparent',
                  borderTopColor: 'var(--primary)',
                  borderRightColor: 'rgba(255, 56, 11, 0.3)',
                }}
              />

              {/* Secondary ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{
                  position: 'absolute',
                  top: -20,
                  left: -20,
                  right: -20,
                  bottom: -20,
                  borderRadius: '50%',
                  border: '2px solid transparent',
                  borderBottomColor: 'rgba(255, 56, 11, 0.2)',
                  borderLeftColor: 'rgba(255, 56, 11, 0.1)',
                }}
              />

              {/* Logo box with pulse */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 30px rgba(255, 56, 11, 0.2)',
                    '0 0 50px rgba(255, 56, 11, 0.4)',
                    '0 0 30px rgba(255, 56, 11, 0.2)',
                  ],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  width: 80,
                  height: 80,
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)',
                  borderRadius: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  style={{
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 36,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  }}
                >
                  R
                </motion.span>
              </motion.div>
            </motion.div>

            {/* Brand name with animation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <motion.span
                className="loading-screen-text"
                style={{
                  fontSize: 34,
                  fontWeight: 700,
                  letterSpacing: -0.5,
                }}
              >
                Rest
              </motion.span>
              <motion.span
                animate={{
                  color: ['var(--primary)', '#CC2D08', 'var(--primary)'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  fontSize: 34,
                  fontWeight: 700,
                  letterSpacing: -0.5,
                }}
              >
                X
              </motion.span>
            </motion.div>

            {/* Loading bar */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 120 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              style={{
                marginTop: 32,
                height: 4,
                background: 'rgba(255, 56, 11, 0.15)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  width: '50%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, var(--primary), transparent)',
                  borderRadius: 2,
                }}
              />
            </motion.div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="loading-screen-tagline"
              style={{
                marginTop: 20,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 3,
                textTransform: 'uppercase',
              }}
            >
              Đang tải...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page content - hidden during loading */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        style={{
          visibility: isLoading ? 'hidden' : 'visible',
        }}
      >
        {children}
      </motion.div>
    </PageTransitionContext.Provider>
  );
};

export default PageTransition;

