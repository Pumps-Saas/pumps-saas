import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    helperText,
    className,
    id,
    ...props
}) => {
    const inputId = id || React.useId();

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={inputId} className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={clsx(
                    "input block w-full transition-colors",
                    error ? "border-[#e06b6b] text-[#e06b6b] focus:border-[#e06b6b] focus:ring-[#e06b6b]" : "",
                    className
                )}
                {...props}
            />
            {error && <p className="mt-1 text-xs text-[#e06b6b]">{error}</p>}
            {helperText && !error && <p className="mt-1 text-xs text-muted">{helperText}</p>}
        </div>
    );
};
