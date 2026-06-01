import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const Card = React.forwardRef(
  ({ className, children, variant = 'default', hover = true, ...props }, ref) => {
    const baseStyles = 'rounded-2xl border backdrop-blur-sm transition-all duration-300';

    const variants = {
      default: 'bg-slate-900/50 border-slate-800',
      dark: 'bg-slate-950/80 border-slate-800',
      gradient: 'bg-gradient-to-br from-slate-900/50 to-slate-950/50 border-slate-800',
    };

    return (
      <motion.div
        ref={ref}
        whileHover={hover ? { y: -5, boxShadow: '0 20px 40px rgba(34, 197, 94, 0.1)' } : {}}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
