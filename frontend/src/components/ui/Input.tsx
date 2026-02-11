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
                <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={clsx(
                    "block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 border",
                    error ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500" : "",
                    className
                )}
                {...props}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            {helperText && !error && <p className="mt-1 text-sm text-slate-500">{helperText}</p>}
        </div>
    );
};
