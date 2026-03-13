import { type ReactNode } from "react";
import clsx from "clsx";

interface CardProps {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ header, footer, children, className }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-c2 border border-c3 transition-colors duration-200 hover:bg-c3",
        className
      )}
    >
      {header && (
        <div className="px-6 py-4 border-b border-c2">{header}</div>
      )}
      <div className="px-6 py-4">{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-c2">{footer}</div>
      )}
    </div>
  );
}
