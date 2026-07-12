import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    className,
    variant = 'primary',
    size = 'md',
    isLoading,
    icon,
    disabled,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center font-semibold rounded-xl transition-all focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed select-none";

    const variants = {
        primary: "bg-[#9184d9] text-white hover:bg-[#796cbf] shadow-sm active:scale-[0.98]",
        secondary: "bg-[var(--color-surface)] border border-[var(--color-divider)] text-white hover:bg-white/10 active:scale-[0.98]",
        danger: "bg-[#e06b6b] text-white hover:bg-[#c95a5a] active:scale-[0.98]",
        ghost: "text-muted hover:bg-white/5 hover:text-white",
        outline: "border border-[var(--color-divider)] bg-transparent text-muted hover:text-white hover:bg-white/5"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base"
    };

    return (
        <button
            className={clsx(baseStyles, variants[variant], sizes[size], className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin text-current" />
            ) : icon ? (
                <span className="mr-2 flex items-center">{icon}</span>
            ) : null}
            {children}
        </button>
    );
};
