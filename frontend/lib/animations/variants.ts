/**
 * Reusable Enterprise Animation System
 * Powered by Framer Motion with automatic prefers-reduced-motion compliance.
 */

import { Variants, Transition } from "framer-motion";

// Standard smooth enterprise easing curves as strict 4-tuples
export const easeOutQuad: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];
export const easeOutCubic: [number, number, number, number] = [0.215, 0.61, 0.355, 1];
export const easeInOutCubic: [number, number, number, number] = [0.645, 0.045, 0.355, 1];

// Default lightweight spring for interactive feedback
export const microSpring: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 25,
  mass: 0.8
};

// 1. Fade In
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25, ease: easeOutQuad }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.18, ease: easeOutQuad }
  }
};

// 2. Fade Up (For cards, headings, list items)
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: easeOutCubic }
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.18, ease: easeOutQuad }
  }
};

// 3. Fade Down (For top bars, alerts, dropdowns)
export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: easeOutCubic }
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.18, ease: easeOutQuad }
  }
};

// 4. Slide Left & Right
export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: easeOutCubic }
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.18, ease: easeOutQuad }
  }
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: easeOutCubic }
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.18, ease: easeOutQuad }
  }
};

// 5. Question Transition (Fast 200ms transition during exams)
export const questionTransitionVariants: any = {
  enter: (direction: number = 1) => ({
    x: direction > 0 ? 12 : -12,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: easeOutCubic
    }
  },
  exit: (direction: number = 1) => ({
    x: direction > 0 ? -12 : 12,
    opacity: 0,
    transition: {
      duration: 0.16,
      ease: easeOutQuad
    }
  })
};

// 6. Scale In (For badges, dialogs, checkmarks)
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.22, ease: easeOutCubic }
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.16, ease: easeOutQuad }
  }
};

// 7. Stagger Container (For dashboard grids & option lists - callable or direct variants)
export const staggerContainer: any = Object.assign(
  (staggerChildren = 0.06, delayChildren = 0) => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren,
        delayChildren
      }
    }
  }),
  {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0
      }
    }
  }
);

export const getStaggerContainer = (staggerChildren = 0.06, delayChildren = 0): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren
    }
  }
});

// 8. Page Transition (Clean and swift)
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: easeOutCubic }
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.16, ease: easeOutQuad }
  }
};

// 9. Modal / Drawer Transition
export const modalOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } }
};

export const modalTransition: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.22, ease: easeOutCubic }
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 8,
    transition: { duration: 0.16, ease: easeOutQuad }
  }
};

// 10. Interactive Micro-Interactions (Buttons & Options)
export const buttonHoverVariants = {
  rest: { y: 0, scale: 1 },
  hover: { y: -1, transition: { duration: 0.14, ease: easeOutQuad } },
  tap: { scale: 0.98, transition: { duration: 0.08 } }
};

export const cardHoverVariants = {
  rest: { y: 0, boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)" },
  hover: {
    y: -2,
    boxShadow: "0 8px 24px -4px rgba(18, 59, 122, 0.08), 0 4px 8px -2px rgba(0, 0, 0, 0.04)",
    transition: { duration: 0.18, ease: easeOutQuad }
  }
};

export const optionCardVariants = {
  unselected: {
    scale: 1,
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0"
  },
  selected: {
    scale: 1.008,
    backgroundColor: "#EFF6FF",
    borderColor: "#2563EB",
    transition: { duration: 0.16, ease: easeOutCubic }
  },
  hover: {
    y: -1,
    borderColor: "#93C5FD",
    transition: { duration: 0.12 }
  }
};
