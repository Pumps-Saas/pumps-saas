import React from 'react';
import clsx from 'clsx';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, title, action }) => {
    return (
        <div className={clsx("card border border-[var(--color-divider)] overflow-hidden text-[var(--color-text)]", className)}>
            {(title || action) && (
                <div className="px-5 py-3.5 border-b border-[var(--color-divider)] flex justify-between items-center bg-[var(--color-bg)]/40">
                    {title && <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className="p-5">
                {children}
            </div>
        </div>
    );
};
