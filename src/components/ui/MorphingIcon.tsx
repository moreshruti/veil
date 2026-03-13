"use client";

import { type LucideIcon } from "lucide-react";
import clsx from "clsx";

interface MorphingIconProps {
  icon: LucideIcon;
  size?: number;
  className?: string;
}

export function MorphingIcon({
  icon: Icon,
  size = 20,
  className,
}: MorphingIconProps) {
  return (
    <Icon
      size={size}
      className={clsx("icon-morph", className)}
      strokeWidth={1.5}
    />
  );
}
