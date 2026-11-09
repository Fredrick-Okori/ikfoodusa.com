"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, RefObject, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import gsap from "gsap";
import { Award, Handshake, LayoutGrid, Leaf, Search, ShoppingBag, Store, Truck, X } from "lucide-react";
import { Product, categoryHref, productHref } from "@/data/products";
import { Logo } from "@/components/Logo";
import { BRAND } from "@/lib/brand";
import { useCategories } from "@/lib/useCatalog";
import { setSmoothScrollPaused } from "@/components/SmoothScroll";
import { formatUSD } from "@/utils/currency";

const NAV_LINKS = [
  { href: "/shop", label: "Shop all" },
  { href: "/our-vanilla", label: "Our vanilla" },
  { href: "/#guide", label: "Grade guide" },
  { href: "/wholesale", label: "Wholesale & trade" },
];

/** Hash links ("/#story") are sections, not pages, so they are never marked current. */
function isCurrentPage(href: string, pathname: string) {
  return !href.includes("#") && pathname === href;
}

function Sidebar({
  open,
  onClose,
  cartCount,
  panelRef,
}: {
  open: boolean;
  onClose: () => void;
  cartCount: number;
  panelRef: RefObject<HTMLElement | null>;
}) {
  const { categories } = useCategories();
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    onClose();
    router.push(`/shop?search=${encodeURIComponent(q)}`);
  };

  // Staggered entrance: each item slides in a beat after the previous one.
  let order = 0;
  const stagger = () => {
    const i = order++;
    return {
      className: `transition-all duration-500 ease-out motion-reduce:transition-none ${
        open ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0"
      }`,
      // Capped so long category lists don't keep the user waiting.
      style: { transitionDelay: open ? `${180 + Math.min(i, 10) * 45}ms` : "0ms" },
    };
  };

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-forest-950/50 backdrop-blur-sm transition-opacity duration-500 motion-reduce:transition-none ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Full-screen panel that drops down from above */}
      <aside
        id="site-sidebar"
        ref={panelRef}
        data-lenis-prevent
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        aria-hidden={!open}
        inert={!open}
        tabIndex={-1}
        className={`fixed inset-0 z-50 flex h-[100dvh] w-full flex-col overflow-y-auto overscroll-contain bg-beige-50 outline-none shadow-2xl transition-[transform,visibility] duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? "visible translate-y-0" : "invisible -translate-y-full"
        }`}
      >
        <div className="mx-auto flex h-24 w-full max-w-2xl shrink-0 items-center justify-end border-b border-beige-200 px-5 sm:h-28">
          <Link href="/" onClick={onClose} aria-label={`${BRAND.name} home`} {...stagger()}>
            <Logo size="lg" />
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-6">
          <form onSubmit={handleSearch} {...stagger()}>
            <div className="flex items-center gap-2 rounded-full border border-beige-200 bg-white px-5 py-3.5 focus-within:border-forest-700">
              <Search size={18} className="shrink-0 text-forest-900/75" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search beans, extracts, powder…"
                aria-label="Search products"
                enterKeyHint="search"
                className="min-w-0 flex-1 bg-transparent text-base text-forest-950 outline-none placeholder:text-forest-900/40"
              />
            </div>
          </form>

          <nav className="flex flex-col gap-2">
            {NAV_LINKS.map((link, index) => {
              const s = stagger();
              const current = isCurrentPage(link.href, pathname);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  aria-current={current ? "page" : undefined}
                  style={s.style}
                  className={`${s.className} group flex items-center gap-5 rounded-full px-6 py-4 active:scale-[0.98] ${
                    current
                      ? "bg-forest-900 text-beige-50"
                      : "bg-beige-200/80 text-forest-950 hover:bg-beige-200"
                  }`}
                >
                  <span
                    className={`w-6 shrink-0 text-xs font-bold tabular-nums ${
                      current ? "text-secondary" : "text-forest-900/75"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-xl font-bold tracking-tight transition-transform duration-300 group-hover:translate-x-1">
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {categories.length > 0 && (
            <div>
              <p
                style={stagger().style}
                className={`${open ? "opacity-100" : "opacity-0"} transition-opacity duration-500 mb-2 px-4 text-[11px] font-bold uppercase tracking-widest text-forest-900/75`}
              >
                Categories
              </p>
              <div className="flex flex-wrap gap-2 px-2">
                {categories.map((category) => {
                  const s = stagger();
                  return (
                    <Link
                      key={category.slug}
                      href={categoryHref(category.name)}
                      onClick={onClose}
                      style={s.style}
                      className={`${s.className} rounded-full border border-beige-200 bg-white px-4 py-2.5 text-sm font-semibold text-forest-900/80 hover:bg-beige-200`}
                    >
                      {category.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex-1" />
          <div {...stagger()}>
            <Link
              href="/cart"
              onClick={onClose}
              aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
              className="flex items-center justify-between rounded-full bg-forest-900 px-5 py-4 text-sm font-bold text-beige-50 hover:bg-forest-800"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag size={18} /> Cart
              </span>
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-secondary px-2 text-xs font-extrabold text-forest-950">
                {cartCount}
              </span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

const ORBIT_ICONS: Record<string, typeof Store> = {
  "/shop": Store,
  "/our-vanilla": Leaf,
  "/#guide": Award,
  "/wholesale": Handshake,
};

/**
 * Scrolled-state navigation: a hub pinned to the bottom-centre of the screen. Opening it sends
 * the links out along an orbit arc above the hub; "Menu" opens the full sidebar.
 */
function OrbitNav({
  visible,
  open,
  setOpen,
  onOpenMenu,
  cartCount,
  radius,
  hubRef,
}: {
  visible: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  onOpenMenu: () => void;
  cartCount: number;
  radius: number;
  hubRef: RefObject<HTMLButtonElement | null>;
}) {
  const pathname = usePathname();
  const ringRef = useRef<HTMLDivElement>(null);
  const moonOrbitRef = useRef<HTMLSpanElement>(null);

  // Rotate the moon's orbit with page scroll progress (0° at the top, a full turn at the bottom).
  useEffect(() => {
    const orbit = moonOrbitRef.current;
    if (!orbit) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rotateTo = reduce
      ? (deg: number) => gsap.set(orbit, { rotation: deg })
      : gsap.quickTo(orbit, "rotation", { duration: 0.6, ease: "power3.out" });
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      rotateTo(max > 0 ? (window.scrollY / max) * 360 : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const items: { key: string; label: string; Icon: typeof Store; href?: string; badge?: number }[] = [
    ...NAV_LINKS.map((link) => ({
      key: link.href,
      href: link.href,
      label: link.label.replace(" & trade", ""),
      Icon: ORBIT_ICONS[link.href] ?? Store,
    })),
    { key: "cart", href: "/cart", label: "Cart", Icon: ShoppingBag, badge: cartCount },
    { key: "menu", label: "Menu", Icon: LayoutGrid },
  ];

  // Spread the items along the upper half of the orbit (180° = left, 270° = straight up).
  const start = 198;
  const end = 342;
  const step = (end - start) / (items.length - 1);

  // Escape closes and hands focus back to the hub; focus moves to the first item on open.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() =>
      ringRef.current?.querySelector<HTMLElement>("a, button")?.focus({ preventScroll: true })
    );
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        hubRef.current?.focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen, hubRef]);

  return (
    <>
      {/* Soft dim behind the open orbit; clicking it closes the orbit. */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[55] bg-forest-950/30 backdrop-blur-[2px] transition-opacity duration-500 motion-reduce:transition-none ${
          open && visible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        className={`fixed left-1/2 z-[60] -translate-x-1/2 transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-24 opacity-0"
        }`}
        style={{ bottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        inert={!visible}
      >
        <div className="relative h-14 w-14 sm:h-16 sm:w-16">
          {/* Orbit path the links travel along. */}
          <span
            aria-hidden
            className={`pointer-events-none absolute left-1/2 top-1/2 rounded-full border border-dashed border-secondary/60 transition-all duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              open ? "opacity-100" : "opacity-0"
            }`}
            style={{
              width: radius * 2,
              height: radius * 2,
              transform: `translate(-50%, -50%) scale(${open ? 1 : 0.3})`,
            }}
          />

          {/* Idle orbit: the moon travels once around the hub from the top of the page to the bottom. */}
          <span
            ref={moonOrbitRef}
            aria-hidden
            className={`pointer-events-none absolute -inset-2.5 rounded-full bg-beige-100 shadow-lg transition-opacity duration-300 ${
              open ? "opacity-0" : "opacity-100"
            }`}
          >
            <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-forest-950 ring-2 ring-secondary" />
          </span>

          <div ref={ringRef} inert={!open} aria-hidden={!open}>
            {items.map((item, index) => {
              const angle = ((start + step * index) * Math.PI) / 180;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              const current = item.href ? isCurrentPage(item.href, pathname) : false;
              const delay = open ? index * 45 : (items.length - 1 - index) * 25;
              const content = (
                <>
                  <span
                    className={`relative flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-colors sm:h-14 sm:w-14 ${
                      current
                        ? "bg-forest-950 text-secondary ring-2 ring-secondary"
                        : "bg-secondary text-forest-950 group-hover:bg-secondary-dark"
                    }`}
                  >
                    <item.Icon size={20} />
                    {item.badge ? (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-forest-950 px-1 text-[10px] font-extrabold text-secondary ring-2 ring-secondary">
                        {item.badge}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1.5 whitespace-nowrap rounded-full bg-forest-950 px-2 py-0.5 text-[11px] font-bold text-secondary shadow">
                    {item.label}
                  </span>
                </>
              );
              const className =
                "group absolute left-1/2 top-1/2 flex flex-col items-center outline-none transition-[transform,opacity] duration-500 [transition-timing-function:cubic-bezier(0.34,1.4,0.64,1)] focus-visible:[&>span:first-child]:ring-4 motion-reduce:transition-none";
              const style = {
                // Anchor on the circle's centre (half of h-12/h-14), not the label's.
                transform: open
                  ? `translate(calc(-50% + ${x}px), calc(-1.75rem + ${y}px)) scale(1)`
                  : "translate(-50%, -1.75rem) scale(0.2)",
                opacity: open ? 1 : 0,
                transitionDelay: `${delay}ms`,
              };
              return item.href ? (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={current ? "page" : undefined}
                  aria-label={item.key === "cart" ? `Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}` : undefined}
                  className={className}
                  style={style}
                >
                  {content}
                </Link>
              ) : (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onOpenMenu();
                  }}
                  aria-label="Open full menu"
                  className={className}
                  style={style}
                >
                  {content}
                </button>
              );
            })}
          </div>

          {/* The hub itself. */}
          <button
            ref={hubRef}
            type="button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="relative flex h-full w-full items-center justify-center rounded-full bg-secondary text-forest-950 shadow-xl transition-transform duration-300 hover:scale-105 hover:bg-secondary-dark active:scale-95"
          >
            <span aria-hidden className={`transition-transform duration-500 ${open ? "rotate-90" : "rotate-0"}`}>
              {open ? <X size={24} /> : <LayoutGrid size={22} />}
            </span>
            {cartCount > 0 && (
              <span
                aria-hidden
                className={`absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-forest-950 px-1.5 text-xs font-extrabold text-secondary shadow ring-2 ring-secondary transition-all duration-300 ${
                  open ? "scale-0 opacity-0" : "scale-100 opacity-100"
                }`}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

// Below Tailwind's `lg` breakpoint the main navbar is removed and only the floating hamburger is used.
const MOBILE_QUERY = "(max-width: 1023.98px)";
function subscribeMobile(onChange: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}
function useIsMobile() {
  return useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false
  );
}

export function Navbar({ cartCount = 0 }: { cartCount?: number }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const router = useRouter();

  // Collapse the header once the user scrolls; a floating hamburger opens a sidebar instead.
  const [scrolled, setScrolled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const headerHidden = scrolled;
  const [orbitOpen, setOrbitOpen] = useState(false);
  const isMobile = useIsMobile();
  // Once scrolled, the centred orbit hub replaces the top-left hamburger. The hamburger
  // still appears while the full menu is open, as its close button.
  const showHamburger = sidebarOpen || (isMobile && !scrolled);
  const showOrbit = scrolled && !sidebarOpen;
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const hubRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  // Close the menus whenever the route changes (including browser Back/Forward).
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setSidebarOpen(false);
    setOrbitOpen(false);
  }

  useEffect(() => {
    const onScroll = () => {
      const isScrolled = window.scrollY > 80;
      setScrolled(isScrolled);
      if (isScrolled) setSearchOpen(false);
      else setOrbitOpen(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // While the menu is open: lock page scroll (without the page jumping sideways when the
  // scrollbar disappears), move focus into the menu, keep Tab inside it, close on Escape.
  useEffect(() => {
    if (!sidebarOpen) return;
    const body = document.body;
    const previous = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    setSmoothScrollPaused(true);

    const frame = requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panelRef.current || !hamburgerRef.current) return;
      const focusables = [
        hamburgerRef.current,
        ...panelRef.current.querySelectorAll<HTMLElement>("a[href], button, input"),
      ];
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!active || !focusables.includes(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);

    const hamburger = hamburgerRef.current;
    const hub = hubRef.current;
    const panel = panelRef.current;
    return () => {
      cancelAnimationFrame(frame);
      body.style.overflow = previous.overflow;
      body.style.paddingRight = previous.paddingRight;
      setSmoothScrollPaused(false);
      window.removeEventListener("keydown", onKey);
      // Hand focus back to the button that opened the menu (the orbit hub when scrolled).
      if (panel?.contains(document.activeElement) || document.activeElement === document.body) {
        const opener = window.scrollY > 80 ? hub : hamburger;
        opener?.focus({ preventScroll: true });
      }
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!searchOpen || products.length > 0) return;
    fetch("/api/store-products", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]));
  }, [searchOpen, products.length]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return products
      .filter((product) =>
        [product.name, product.producer, product.origin, product.category, product.species]
          .some((value) => value?.toLowerCase().includes(query))
      )
      .slice(0, 6);
  }, [products, searchQuery]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setSearchOpen(false);
    router.push(`/shop?search=${encodeURIComponent(query)}`);
  };

  return (
    <>
    <button
      ref={hamburgerRef}
      type="button"
      aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={sidebarOpen}
      aria-controls="site-sidebar"
      onClick={() => setSidebarOpen((open) => !open)}
      tabIndex={showHamburger ? 0 : -1}
      aria-hidden={!showHamburger}
      style={{ top: "max(1rem, env(safe-area-inset-top))" }}
      className={`fixed left-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-forest-900 text-beige-50 shadow-xl ring-2 ring-secondary/60 transition-all duration-300 hover:bg-forest-800 sm:left-6 sm:h-16 sm:w-16 ${
        sidebarOpen
          ? "scale-100 opacity-100"
          : scrolled
            ? "pointer-events-none scale-75 opacity-0"
            : "pointer-events-none scale-75 opacity-0 max-lg:pointer-events-auto max-lg:scale-100 max-lg:opacity-100"
      }`}
    >
      {/* Three bars that morph into an X */}
      <span aria-hidden className="relative block h-5 w-7">
        <span
          className={`absolute left-0 h-[3px] w-7 rounded-full bg-current transition-all duration-300 ${
            sidebarOpen ? "top-[8.5px] rotate-45" : "top-0"
          }`}
        />
        <span
          className={`absolute left-0 top-[8.5px] h-[3px] w-7 rounded-full bg-current transition-all duration-200 ${
            sidebarOpen ? "scale-x-0 opacity-0" : "opacity-100"
          }`}
        />
        <span
          className={`absolute left-0 h-[3px] w-7 rounded-full bg-current transition-all duration-300 ${
            sidebarOpen ? "top-[8.5px] -rotate-45" : "top-[17px]"
          }`}
        />
      </span>

      {/* Cart count, so shoppers can see their bag even with the navbar gone */}
      {cartCount > 0 && (
        <span
          aria-hidden
          className={`absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-secondary px-1.5 text-xs font-extrabold text-forest-950 shadow ring-2 ring-beige-50 transition-all duration-300 ${
            sidebarOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
          }`}
        >
          {cartCount}
        </span>
      )}
    </button>

    {/* Mobile: no navbar, just a slim brand strip that scrolls away, so page content
        starts below the floating hamburger instead of underneath it. */}
    <div className="relative flex h-[88px] items-center justify-center border-b border-beige-50/10 bg-forest-950 sm:h-24 lg:hidden">
      <Link href="/" aria-label={`${BRAND.name} home`} className="flex items-center">
        <Logo size="lg" />
      </Link>
      <Link
        href="/cart"
        aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
        className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full text-beige-50 transition hover:bg-white/10 hover:text-secondary sm:right-6"
      >
        <ShoppingBag size={24} />
      </Link>
    </div>

    <OrbitNav
      visible={showOrbit}
      open={orbitOpen && showOrbit}
      setOpen={setOrbitOpen}
      onOpenMenu={() => setSidebarOpen(true)}
      cartCount={cartCount}
      radius={isMobile ? 125 : 160}
      hubRef={hubRef}
    />

    <Sidebar
      open={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
      cartCount={cartCount}
      panelRef={panelRef}
    />

    {/* Book-style reveal: the header swings open like a cover hinged on the left, next to the hamburger. */}
    {/* Sticky wrapper clips the 3D turn horizontally; mid-animation the perspective
        projection is far wider than the viewport and would add a horizontal scrollbar. */}
    <div className="sticky top-0 z-40 hidden overflow-x-clip lg:block">
    <header
      className={`relative origin-left transition-[transform,opacity,visibility] duration-700 [backface-visibility:hidden] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        headerHidden ? "pointer-events-none invisible opacity-0" : "visible opacity-100"
      }`}
      style={{
        transform: headerHidden
          ? "perspective(1600px) rotateY(-95deg)"
          : "perspective(1600px) rotateY(0deg)",
      }}
    >
      {/* Page shading that fades away as the "cover" lies flat. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-forest-950/40 via-forest-950/10 to-transparent transition-opacity duration-700 motion-reduce:transition-none ${
          headerHidden ? "opacity-100" : "opacity-0"
        }`}
      />
      <div className="border-b border-beige-50/10 bg-forest-950 px-4 py-2 text-center text-[11px] font-semibold tracking-wide text-beige-100/70">
        <Truck size={13} className="mr-1.5 inline-block text-beige-300" />
        Free US shipping on orders over {formatUSD(BRAND.freeShippingThreshold)}
        <span className="hidden sm:inline">
          <span aria-hidden="true" className="mx-3 text-beige-100/30">|</span>
          Buying for a business?{" "}
          <Link href="/wholesale" className="font-bold text-secondary hover:underline">
            Open a trade account
          </Link>
        </span>
      </div>

      <div className="border-b border-beige-50/10 bg-forest-950/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-[72px] lg:px-10">
          <Link href="/" aria-label={`${BRAND.name} home`} className="flex shrink-0 items-center">
            <Logo size="lg" />
          </Link>

          <nav className="flex flex-row items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isCurrentPage(link.href, pathname) ? "page" : undefined}
                className="rounded-full px-4 py-2 text-sm font-semibold text-beige-100/80 transition hover:bg-white/10 hover:text-beige-50 aria-[current=page]:bg-white/10 aria-[current=page]:text-beige-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <div className="relative">
              <button
                type="button"
                aria-label="Search products"
                aria-expanded={searchOpen}
                onClick={() => setSearchOpen((open) => !open)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-beige-100/80 transition hover:bg-white/10 hover:text-beige-50"
              >
                <Search size={18} />
              </button>

              {searchOpen && (
                <div data-lenis-prevent className="fixed left-4 right-4 top-28 z-50 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-beige-200 bg-white p-3 shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[22rem]">
                  <form id="global-product-search" onSubmit={handleSearchSubmit}>
                    <div className="flex items-center gap-2 rounded-full border border-beige-200 bg-beige-50 px-3 py-2">
                      <Search size={15} className="shrink-0 text-forest-900/75" />
                      <input
                        autoFocus
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search beans, extracts, powder…"
                        className="min-w-0 flex-1 bg-transparent text-base text-forest-950 outline-none placeholder:text-forest-900/40 sm:text-sm"
                      />
                    </div>
                  </form>

                  {searchQuery.trim() && (
                    <div className="mt-2 space-y-1">
                      {searchResults.map((product) => (
                        <Link
                          key={product.id}
                          href={productHref(product)}
                          onClick={() => setSearchOpen(false)}
                          className="block rounded-xl px-3 py-2 hover:bg-beige-100"
                        >
                          <span className="block truncate text-sm font-semibold text-forest-950">{product.name}</span>
                          <span className="block truncate text-[11px] text-forest-900/75">
                            {product.category} · {formatUSD(product.numericPrice)}
                          </span>
                        </Link>
                      ))}
                      {searchResults.length === 0 && (
                        <p className="px-3 py-2 text-xs text-forest-900/75">No products found.</p>
                      )}
                      <button
                        type="submit"
                        form="global-product-search"
                        className="w-full px-3 pt-2 text-left text-xs font-bold text-forest-700 hover:underline"
                      >
                        See all results
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link
              href="/cart"
              aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
              className="relative flex h-10 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-extrabold text-forest-950 transition hover:bg-secondary-dark"
            >
              <ShoppingBag size={16} />
              <span className="hidden sm:inline">Cart</span>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-forest-950 px-1.5 text-[11px] font-extrabold text-beige-50">
                {cartCount}
              </span>
            </Link>
          </div>
        </div>

      </div>
    </header>
    </div>
    </>
  );
}
