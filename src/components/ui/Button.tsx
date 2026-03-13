"use client";

import { type ButtonHTMLAttributes, type ReactNode, useCallback } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: clsx(
    "bg-zinc-200 text-zinc-950",
    "border border-zinc-400/50",
    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),inset_0_-1px_0_0_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.2)]",
    "hover:bg-zinc-100 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),inset_0_-1px_0_0_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.15)]",
    "active:bg-zinc-300 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]"
  ),
  secondary: clsx(
    "bg-zinc-900 text-zinc-300",
    "border border-zinc-700/50",
    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),inset_0_-1px_0_0_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)]",
    "hover:bg-zinc-800 hover:text-zinc-200",
    "active:bg-zinc-900 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
  ),
  ghost: clsx(
    "text-zinc-400",
    "hover:text-white hover:bg-white/[0.04]",
    "active:bg-white/[0.06]"
  ),
  danger: clsx(
    "bg-red-950/50 text-red-400",
    "border border-red-500/25",
    "shadow-[inset_0_1px_0_0_rgba(255,100,100,0.06),inset_0_-1px_0_0_rgba(0,0,0,0.2)]",
    "hover:bg-red-950/70 hover:text-red-300",
    "active:bg-red-950/80 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
  ),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-sm gap-2.5",
};

function playClickSound() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);

    setTimeout(() => ctx.close(), 100);
  } catch {
    // Audio not supported — silent fallback
  }
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  icon,
  children,
  className,
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;
      playClickSound();
      onClick?.(e);
    },
    [disabled, loading, onClick]
  );

  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center",
        "font-medium font-mono",
        "transition-all duration-150 ease-out",
        "cursor-pointer select-none",
        "disabled:opacity-40 disabled:pointer-events-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-3.5 w-3.5"
          viewBox="0 0 16 16"
          fill="none"
        >
          <circle
            cx="8"
            cy="8"
            r="6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.25"
          />
          <path
            d="M8 2a6 6 0 0 1 6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
