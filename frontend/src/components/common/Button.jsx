import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const Button = React.forwardRef(
  ({ className, children, variant = 'primary', size = 'md', disabled, ...props }, ref) => {
    const baseStyles = 'font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 justify-center';

    const variants = {
      primary: 'bg-gradient-to-r from-emerald-500 to-lime-400 text-white hover:shadow-lg hover:shadow-emerald-500/50 disabled:opacity-50',
      secondary: 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700',
      outline: 'border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500/10',
      ghost: 'text-slate-300 hover:text-white hover:bg-slate-800/50',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
