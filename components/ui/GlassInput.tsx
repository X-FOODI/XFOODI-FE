import React from 'react';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    label: string;
}

export const GlassInput: React.FC<GlassInputProps> = ({ icon, label, id, className = '', ...props }) => {
    return (
        <div>
            <label
                className="auth-label block mb-1 ml-1"
                htmlFor={id}
            >
                {label}
            </label>
            <div className="relative group auth-input-wrapper">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    {icon && (
                        <span className="auth-input-icon text-lg">
                            {icon}
                        </span>
                    )}
                </div>
                <input
                    id={id}
                    className={`auth-input appearance-none block w-full pl-10 pr-3 py-3 sm:text-sm ${className}`}
                    {...props}
                />
            </div>
        </div>
    );
};
