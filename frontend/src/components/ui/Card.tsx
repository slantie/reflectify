import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function Card({ children, onClick, className }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-6 bg-white rounded-lg shadow ${className || ""}`}
    >
      {children}
    </div>
  );
}
