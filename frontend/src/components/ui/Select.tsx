import React from 'react';
import clsx from 'clsx';

interface SelectOption {
    value: string | number;
    label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: SelectOption[];
    error?: string;
}

export const Select: React.FC<SelectProps> = ({
    label,
    options,
    error,
    className,
    id,
    ...props
}) => {
    const selectId = id || React.useId();

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 mb-1">
                    {label}
                </label>
            )}
            <select
                id={selectId}
                className={clsx(
                    "block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 border bg-white",
                    error ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500" : "",
                    className
                )}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
};
