"use client";

import { Footer } from "./Footer";
import { CartProvider, useCart } from "./CartContext";
import { Navbar } from "./Navbar";
import { CookieConsent } from "./CookieConsent";
import { SmoothScroll } from "./SmoothScroll";

function ChromeContent({ children }: { children: React.ReactNode }) {
  const { count } = useCart();

  return (
    <>
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[70] -translate-y-24 rounded-full bg-forest-900 px-5 py-3 text-sm font-bold text-beige-50 shadow-xl transition focus:translate-y-0"
      >
        Skip to main content
      </a>
      <SmoothScroll />
      <Navbar cartCount={count} />
      <div id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </div>
      <Footer />
      <CookieConsent />
    </>
  );
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <ChromeContent>{children}</ChromeContent>
    </CartProvider>
  );
}
