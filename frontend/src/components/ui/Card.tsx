import { ReactNode } from "react";

interface CardProps {
    children: ReactNode;
    onClick?: () => void;
    className?: string;
}

interface CardHeaderProps {
    children: ReactNode;
    className?: string;
}

interface CardContentProps {
    children: ReactNode;
    className?: string;
}

interface CardTitleProps {
    children: ReactNode;
    className?: string;
}

export function Card({ children, onClick, className }: CardProps) {
    return (
        <div
            onClick={onClick}
            className={`p-6 bg-white rounded-2xl shadow-sm border border-secondary-lighter hover:shadow-lg transition-all duration-300 ${
                onClick ? "cursor-pointer hover:bg-primary-lighter/30" : ""
            } ${className || ""}`}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className }: CardHeaderProps) {
    return <div className={`mb-4 ${className || ""}`}>{children}</div>;
}

export function CardContent({ children, className }: CardContentProps) {
    return <div className={`${className || ""}`}>{children}</div>;
}

export function CardTitle({ children, className }: CardTitleProps) {
    return (
        <h3
            className={`text-xl font-semibold text-secondary-darker ${
                className || ""
            }`}
        >
            {children}
        </h3>
    );
}
