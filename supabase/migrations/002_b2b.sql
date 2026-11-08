-- ============================================================================
-- IK FOODS USA — B2B (wholesale) + B2C support
-- Run once in the Supabase SQL editor after supabase_schema.sql. Safe to re-run.
-- ============================================================================

-- 1. PRODUCT PRICING FOR BUSINESS BUYERS -----------------------------------
-- price_tiers: volume pricing for everyone, e.g. [{"minQty":10,"price":22.49},{"minQty":50,"price":19.99}]
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_tiers JSONB NOT NULL DEFAULT '[]'::jsonb;
-- Trade price for approved trade accounts (USD), applied from wholesale_min_qty units.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS wholesale_price NUMERIC(10, 2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS wholesale_min_qty INT NOT NULL DEFAULT 1;

-- 2. TRADE ACCOUNTS (applications + approved business customers) -----------
CREATE TABLE IF NOT EXISTS public.trade_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(100),
    business_type VARCHAR(100),          -- Bakery, Ice cream maker, Distributor, …
    tax_id VARCHAR(100),                 -- EIN or resale certificate number
    website VARCHAR(255),
    address TEXT,
    expected_volume VARCHAR(255),        -- e.g. "10 kg / month"
    message TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending',   -- Pending, Approved, Rejected, Suspended
    account_code VARCHAR(30) UNIQUE,     -- issued on approval, entered at checkout
    net_terms BOOLEAN NOT NULL DEFAULT false,        -- allow Net-30 invoice payment
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_trade_accounts_status ON public.trade_accounts (status);
CREATE INDEX IF NOT EXISTS idx_trade_accounts_email ON public.trade_accounts (lower(email));

-- 3. BULK / EXPORT QUOTE REQUESTS ------------------------------------------
CREATE TABLE IF NOT EXISTS public.quote_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(100),
    products TEXT NOT NULL,              -- what they want, free text
    quantity VARCHAR(255) NOT NULL,      -- e.g. "50 kg Grade B beans"
    frequency VARCHAR(100),              -- One-off, Monthly, Quarterly…
    delivery_location VARCHAR(255),
    message TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'New',       -- New, Contacted, Quoted, Won, Lost
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON public.quote_requests (status);

-- 4. ORDERS: SALES CHANNEL ---------------------------------------------------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_type VARCHAR(10) NOT NULL DEFAULT 'B2C'; -- B2C or B2B
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS trade_account_id UUID REFERENCES public.trade_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS po_number VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_orders_customer_type ON public.orders (customer_type);

-- 5. RLS (permissive, matching the rest of the app — tighten before launch) --
ALTER TABLE public.trade_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['trade_accounts','quote_requests'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "App Read %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "App Manage %1$s" ON public.%1$I', t);
    EXECUTE format('CREATE POLICY "App Read %1$s" ON public.%1$I FOR SELECT USING (true)', t);
    EXECUTE format('CREATE POLICY "App Manage %1$s" ON public.%1$I FOR ALL USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;
