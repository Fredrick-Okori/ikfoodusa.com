import { BRAND } from "@/lib/brand";

/** Official IK Food logo (transparent background — works on light and dark surfaces). */
export const LOGO_SRC = "/logo_clean.webp";

const SIZES = {
  sm: "h-9",
  md: "h-11",
  lg: "h-14",
} as const;

/**
 * IK Food logo. `tone` is kept for call sites on dark backgrounds; the lime artwork
 * reads well on both, so the image itself doesn't change.
 */
export function Logo({
  size = "md",
  className = "",
}: {
  tone?: "dark" | "light";
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt={BRAND.name}
      width={2163}
      height={863}
      className={`${SIZES[size]} w-auto shrink-0 object-contain ${className}`}
    />
  );
}
