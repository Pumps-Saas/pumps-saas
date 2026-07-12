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
                <label htmlFor={selectId} className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
                    {label}
                </label>
            )}
            <select
                id={selectId}
                className={clsx(
                    "input block w-full min-w-0 truncate transition-colors",
                    error ? "border-[#e06b6b] text-[#e06b6b] focus:border-[#e06b6b]" : "",
                    className
                )}
                title={props.value?.toString() || ""}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[var(--color-surface)] text-white py-1">
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <p className="mt-1 text-xs text-[#e06b6b]">{error}</p>}
        </div>
    );
};
