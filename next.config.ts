import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image compression & Core Web Vitals optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 2592000, // 30 days cache
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },

  // Old storefront URLs from before the vanilla relaunch
  async redirects() {
    return [
      { source: "/discover", destination: "/shop", permanent: true },
      { source: "/products", destination: "/shop", permanent: true },
      { source: "/products/:slug", destination: "/product/:slug", permanent: true },
    ];
  },

  // Video and media optimization caching headers
  async headers() {
    return [
      {
        source: "/:all*(mp4|webm|mov|m4v|webp|avif|jpg|jpeg|png|svg)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Accept-Ranges",
            value: "bytes",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
