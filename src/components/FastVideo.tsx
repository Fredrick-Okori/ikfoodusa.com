"use client";

import { useEffect, useRef, useState } from "react";

interface FastVideoProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  playsInline?: boolean;
  priority?: boolean;
  objectFit?: "cover" | "contain";
}

export function FastVideo({
  src,
  poster,
  className = "",
  autoPlay = true,
  loop = true,
  muted = true,
  controls = false,
  playsInline = true,
  priority = false,
  objectFit = "cover",
}: FastVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);

  // Lazy Preloading using IntersectionObserver with a generous 300px rootMargin
  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const videoEl = videoRef.current;
    if (!videoEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            if (autoPlay && videoEl.paused) {
              videoEl.play().catch(() => {});
            }
          } else {
            // Pause off-screen videos to preserve bandwidth and GPU memory
            if (!videoEl.paused) {
              videoEl.pause();
            }
          }
        });
      },
      { rootMargin: "300px 0px" }
    );

    observer.observe(videoEl);
    return () => observer.disconnect();
  }, [priority, autoPlay]);

  return (
    <div className={`relative h-full w-full overflow-hidden bg-black/5 ${className}`}>
      {/* Skeleton / Shimmer placeholder while video stream buffers */}
      {!isLoaded && (
        <div className="absolute inset-0 z-0 animate-pulse bg-neutral-200/50" />
      )}

      <video
        ref={videoRef}
        src={isInView ? src : undefined}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        controls={controls}
        playsInline={playsInline}
        preload={priority ? "auto" : "metadata"}
        disablePictureInPicture
        disableRemotePlayback
        onLoadedData={() => setIsLoaded(true)}
        onCanPlay={() => {
          setIsLoaded(true);
          if (autoPlay && isInView && videoRef.current?.paused) {
            videoRef.current.play().catch(() => {});
          }
        }}
        className={`h-full w-full transform-gpu will-change-transform transition-opacity duration-300 ${
          objectFit === "contain" ? "object-contain" : "object-cover"
        } ${isLoaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

export function isVideoMedia(url?: string | null): boolean {
  if (!url) return false;
  const clean = url.toLowerCase();
  return (
    clean.startsWith("data:video") ||
    clean.endsWith(".mp4") ||
    clean.endsWith(".webm") ||
    clean.endsWith(".mov") ||
    clean.endsWith(".m4v") ||
    clean.endsWith(".ogv") ||
    clean.includes("video/mp4") ||
    clean.includes("video/webm")
  );
}

