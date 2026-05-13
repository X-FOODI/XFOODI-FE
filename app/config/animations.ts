/**
 * Animation Configuration
 * Shared animation variants for Homepage and Staff Dashboard
 */

// Easing curves
export const easings = {
  smooth: [0.25, 0.4, 0.25, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  snappy: [0.6, 0.01, -0.05, 0.95],
  elastic: [0.68, -0.6, 0.32, 1.6],
} as const;

// Duration presets
export const durations = {
  fast: 0.2,
  normal: 0.4,
  slow: 0.6,
  slower: 0.8,
} as const;

// Fade animations
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: durations.normal, ease: easings.smooth }
  },
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: durations.slow, ease: easings.smooth }
  },
};

export const fadeInDown = {
  hidden: { opacity: 0, y: -30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: durations.slow, ease: easings.smooth }
  },
};

export const fadeInLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: durations.slow, ease: easings.smooth }
  },
};

export const fadeInRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: durations.slow, ease: easings.smooth }
  },
};

// Scale animations
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: durations.normal, ease: easings.bounce }
  },
};

export const popIn = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: durations.normal, ease: easings.elastic }
  },
};

// Stagger containers
export const staggerContainer = (staggerDelay: number = 0.1, delayChildren: number = 0) => ({
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: delayChildren,
    },
  },
});

// Card hover animations
export const cardHover = {
  rest: { 
    scale: 1,
    y: 0,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  },
  hover: { 
    scale: 1.02,
    y: -8,
    boxShadow: '0 20px 40px rgba(255, 56, 11, 0.15)',
    transition: { duration: durations.fast, ease: easings.snappy }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  },
};

// Button hover animations
export const buttonHover = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.05,
    transition: { duration: durations.fast, ease: easings.snappy }
  },
  tap: { 
    scale: 0.95,
    transition: { duration: 0.1 }
  },
};

// Glow effect for buttons/cards
export const glowHover = {
  rest: { 
    boxShadow: '0 0 0px rgba(255, 56, 11, 0)',
  },
  hover: { 
    boxShadow: '0 0 30px rgba(255, 56, 11, 0.4)',
    transition: { duration: durations.normal }
  },
};

// Icon animations
export const iconBounce = {
  rest: { y: 0, rotate: 0 },
  hover: { 
    y: -3,
    rotate: [0, -10, 10, 0],
    transition: { duration: 0.4 }
  },
};

export const iconSpin = {
  rest: { rotate: 0 },
  hover: { 
    rotate: 360,
    transition: { duration: 0.6, ease: 'easeInOut' }
  },
};

export const iconPulse = {
  rest: { scale: 1 },
  hover: { 
    scale: [1, 1.2, 1],
    transition: { duration: 0.4, repeat: Infinity }
  },
};

// Page transitions
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: durations.slow, ease: easings.smooth }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: durations.fast }
  },
};

// Slide animations
export const slideInFromLeft = {
  hidden: { x: '-100%', opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { duration: durations.slow, ease: easings.smooth }
  },
};

export const slideInFromRight = {
  hidden: { x: '100%', opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { duration: durations.slow, ease: easings.smooth }
  },
};

// Scroll reveal animations
export const scrollReveal = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: easings.smooth }
  },
};

// Counter animation (for stats)
export const counterAnimation = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: durations.normal, 
      ease: easings.bounce,
    }
  },
};

// Floating animation
export const floating = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Pulse animation
export const pulse = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Shimmer effect (for loading states)
export const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// List item variants (for staff dashboard tables/lists)
export const listItem = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: durations.normal,
      ease: easings.smooth,
    },
  }),
};

// Modal animations
export const modalOverlay = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: durations.fast }
  },
  exit: { 
    opacity: 0,
    transition: { duration: durations.fast }
  },
};

export const modalContent = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: durations.normal, ease: easings.bounce }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9, 
    y: 20,
    transition: { duration: durations.fast }
  },
};

// Notification animations
export const notification = {
  hidden: { opacity: 0, x: 100, scale: 0.9 },
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: { duration: durations.normal, ease: easings.bounce }
  },
  exit: { 
    opacity: 0, 
    x: 100,
    transition: { duration: durations.fast }
  },
};

// Badge/Tag animations
export const badge = {
  hidden: { opacity: 0, scale: 0 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: durations.fast, ease: easings.elastic }
  },
};

// Drawer animations
export const drawerLeft = {
  hidden: { x: '-100%' },
  visible: { 
    x: 0,
    transition: { duration: durations.normal, ease: easings.smooth }
  },
  exit: { 
    x: '-100%',
    transition: { duration: durations.fast }
  },
};

export const drawerRight = {
  hidden: { x: '100%' },
  visible: { 
    x: 0,
    transition: { duration: durations.normal, ease: easings.smooth }
  },
  exit: { 
    x: '100%',
    transition: { duration: durations.fast }
  },
};

// Text animations
export const textReveal = {
  hidden: { opacity: 0, y: '100%' },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.slow, ease: easings.smooth },
  },
};

// Progress bar animation
export const progressBar = (progress: number) => ({
  hidden: { width: 0 },
  visible: {
    width: `${progress}%`,
    transition: { duration: 1, ease: easings.smooth },
  },
});

// Skeleton loading animation
export const skeleton = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Shake animation (for errors)
export const shake = {
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.5 },
  },
};

// Success checkmark animation
export const checkmark = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// Utility function to create viewport options for scroll animations
export const createViewportOptions = (amount: number = 0.3, once: boolean = true) => ({
  viewport: { once, amount },
});

// Default motion props for common use cases
export const defaultMotionProps = {
  card: {
    initial: 'rest',
    whileHover: 'hover',
    whileTap: 'tap',
    variants: cardHover,
  },
  button: {
    initial: 'rest',
    whileHover: 'hover',
    whileTap: 'tap',
    variants: buttonHover,
  },
  fadeInView: {
    initial: 'hidden',
    whileInView: 'visible',
    viewport: { once: true, amount: 0.3 },
    variants: fadeInUp,
  },
};

