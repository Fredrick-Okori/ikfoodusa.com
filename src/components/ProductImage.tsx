"use client";

import { useState } from "react";
import { FastVideo, isVideoMedia } from "@/components/FastVideo";
import { PRODUCT_PLACEHOLDER_IMAGE, resolveProductImage } from "@/data/products";

interface ProductImageProps {
  src?: string;
  alt: string;
  fit?: "cover" | "contain";
  priority?: boolean;
  className?: string;
  videoControls?: boolean;
}

/**
 * Renders a product's media: video, uploaded data URL, or remote/static image,
 * falling back to the vanilla illustration when missing or broken.
 */
export function ProductImage({
  src,
  alt,
  fit = "cover",
  priority = false,
  className = "",
  videoControls = false,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = failed ? PRODUCT_PLACEHOLDER_IMAGE : resolveProductImage(src);

  if (isVideoMedia(resolved)) {
    return (
      <FastVideo
        src={resolved}
        autoPlay
        loop
        muted
        controls={videoControls}
        objectFit={fit}
        className={`h-full w-full ${className}`}
      />
    );
  }

  return (
    // Plain <img> supports data: URLs from dashboard uploads and any remote host.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={`h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"} ${className}`}
    />
  );
}
