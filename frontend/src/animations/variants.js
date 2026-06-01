// Framer Motion animation variants
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6 },
  },
};

export const slideInLeftVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5 },
  },
};

export const slideInRightVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5 },
  },
};

export const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5 },
  },
};

export const rotateInVariants = {
  hidden: { opacity: 0, rotate: -10 },
  visible: {
    opacity: 1,
    rotate: 0,
    transition: { duration: 0.5 },
  },
};

export const hoverScale = {
  whileHover: { scale: 1.05 },
  transition: { type: 'spring', stiffness: 300, damping: 10 },
};

export const pageTransition = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.3,
    },
  },
};

export const pulseVariants = {
  animate: {
    opacity: [1, 0.7, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
    },
  },
};

export const floatingVariants = {
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const glowVariants = {
  animate: {
    boxShadow: [
      '0 0 20px rgba(34, 197, 94, 0.5)',
      '0 0 40px rgba(34, 197, 94, 0.8)',
      '0 0 20px rgba(34, 197, 94, 0.5)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
    },
  },
};
