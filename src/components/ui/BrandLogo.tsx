import React from "react";
import Image from "next/image";

export interface BrandLogoProps {
  /**
   * "full": Icon + "ShadowLog" text
   * "icon": App icon only
   * "text": "ShadowLog" text only
   */
  variant?: "full" | "icon" | "text";
  /**
   * Preset sizes:
   * - "xs": 20px icon, 14px text
   * - "sm": 28px icon, 16px text
   * - "md": 36px icon, 20px text (default)
   * - "lg": 48px icon, 24px text
   * - "xl": 64px icon, 32px text
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /**
   * Force white text for "Shadow" when on dark backgrounds
   */
  inverted?: boolean;
  /**
   * Additional container class names
   */
  className?: string;
  /**
   * Optional custom priority for next/image
   */
  priority?: boolean;
}

const SIZE_CONFIG = {
  xs: {
    iconSize: 20,
    iconRadius: "rounded-md",
    textClass: "text-sm",
    gap: "gap-1.5",
  },
  sm: {
    iconSize: 28,
    iconRadius: "rounded-lg",
    textClass: "text-base",
    gap: "gap-2",
  },
  md: {
    iconSize: 36,
    iconRadius: "rounded-xl",
    textClass: "text-lg sm:text-xl",
    gap: "gap-2.5",
  },
  lg: {
    iconSize: 48,
    iconRadius: "rounded-2xl",
    textClass: "text-2xl sm:text-3xl",
    gap: "gap-3",
  },
  xl: {
    iconSize: 64,
    iconRadius: "rounded-2xl",
    textClass: "text-3xl sm:text-4xl",
    gap: "gap-3.5",
  },
};

/**
 * Official ShadowLog Brand Logo Component
 *
 * Implements the brand identity specified in SYSTEM_SPECIFICATION.md:
 * - Icon: Official blue app icon with speech wave arcs and sparkle stars (/icons/icon-512.png)
 * - Text: Bold sans-serif "ShadowLog" with "Shadow" in dark/white and "Log" in vibrant primary blue (#2563eb)
 */
export function BrandLogo({
  variant = "full",
  size = "md",
  inverted = false,
  className = "",
  priority = false,
}: BrandLogoProps) {
  const config = SIZE_CONFIG[size] || SIZE_CONFIG.md;

  const iconElement = (
    <div
      className={`relative shrink-0 overflow-hidden shadow-xs select-none ${config.iconRadius}`}
      style={{
        width: config.iconSize,
        height: config.iconSize,
      }}
    >
      <Image
        src="/icons/icon-512.png"
        alt="ShadowLog Official Icon"
        width={config.iconSize}
        height={config.iconSize}
        className="w-full h-full object-cover"
        priority={priority}
      />
    </div>
  );

  const textElement = (
    <span
      className={`font-extrabold tracking-tight font-sans leading-none select-none ${config.textClass} ${
        inverted ? "text-white" : "text-slate-900 dark:text-white"
      }`}
      style={{ letterSpacing: "-0.03em" }}
    >
      Shadow<span className="text-blue-600 dark:text-blue-500">Log</span>
    </span>
  );

  if (variant === "icon") {
    return <div className={`inline-flex items-center ${className}`}>{iconElement}</div>;
  }

  if (variant === "text") {
    return <div className={`inline-flex items-center ${className}`}>{textElement}</div>;
  }

  return (
    <div className={`inline-flex items-center ${config.gap} ${className}`}>
      {iconElement}
      {textElement}
    </div>
  );
}
