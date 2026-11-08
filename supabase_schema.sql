-- ============================================================================
-- IK FOODS USA — SUPABASE POSTGRESQL SCHEMA (vanilla e-commerce)
-- Run this in the Supabase SQL editor of a fresh project. Safe to re-run.
-- Then run supabase/migrations/002_b2b.sql for wholesale (B2B) features.
-- All money columns are USD.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CATEGORIES (managed from /dashboard/categories) --------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    subcategories TEXT[] NOT NULL DEFAULT '{}',
    image_url TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS subcategories TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories (parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories (display_order);

INSERT INTO public.categories (name, slug, description, subcategories, display_order) VALUES
  ('Grade A Beans',   'grade-a-beans',   'Plump, oily gourmet beans (30–35% moisture) for scraping, baking and infusions.', ARRAY['Planifolia','Tahitensis','Bulk & Wholesale'], 1),
  ('Grade B Beans',   'grade-b-beans',   'Drier extraction-grade beans (15–25% moisture), ideal for homemade extract.',     ARRAY['Extract Grade','Bulk & Wholesale'], 2),
  ('Vanilla Extract', 'vanilla-extract', 'Pure, single-fold and double-fold extracts for kitchens and bakeries.',          ARRAY['Single Fold','Double Fold','Alcohol-Free'], 3),
  ('Vanilla Powder',  'vanilla-powder',  'Whole ground vanilla beans — heat-stable flavor with no added sugar or alcohol.', ARRAY['Pure Ground Bean','Culinary Blend'], 4),
  ('Vanilla Caviar',  'vanilla-caviar',  'Hand-scraped vanilla seeds for custards, ice cream and fine pastry.',             ARRAY['Pure Seeds','Bean Paste'], 5),
  ('Vanilla Splits',  'vanilla-splits',  'Split and cut beans at an accessible price — full flavor, imperfect looks.',      ARRAY['Split Beans','Cuts & Pieces'], 6),
  ('Gifts & Bundles', 'gifts-bundles',   'Curated sets and sampler boxes for bakers and home cooks.',                      ARRAY['Sampler Sets','Gift Boxes'], 7)
ON CONFLICT (slug) DO NOTHING;

-- 2. PRODUCTS -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    category VARCHAR(100) NOT NULL DEFAULT 'Grade A Beans',
    subcategory VARCHAR(100),
    country_of_origin VARCHAR(255),
    species VARCHAR(100),               -- Planifolia, Tahitensis, Pompona
    grade VARCHAR(100),                 -- e.g. Grade A / Gourmet
    size_label VARCHAR(100),            -- e.g. 10 beans, 4 fl oz, 100 g
    bean_length VARCHAR(50),            -- e.g. 16–18 cm
    moisture VARCHAR(50),               -- e.g. 30–35%
    harvest VARCHAR(50),                -- e.g. 2025
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,             -- selling price, USD
    compare_at_price NUMERIC(10, 2),                     -- optional "was" price, USD
    buying_price NUMERIC(10, 2) NOT NULL DEFAULT 0,      -- cost price, USD
    quantity_in_stock INT NOT NULL DEFAULT 0,
    description TEXT,
    badge VARCHAR(100),
    sku VARCHAR(100),
    profile JSONB NOT NULL DEFAULT '{"aroma": "", "flavor": "", "uses": "", "storage": ""}'::jsonb,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products (is_active);

-- 3. ORDERS (USD, with developer gross-profit share snapshot) -----------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(100) NOT NULL,
    delivery_address TEXT NOT NULL,
    order_status VARCHAR(50) NOT NULL DEFAULT 'Pending',   -- Pending, Processing, Shipped, Delivered, Cancelled
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Card',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- Pending, Paid, Refunded
    subtotal_usd NUMERIC(10, 2) NOT NULL DEFAULT 0,
    shipping_usd NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount_usd NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_amount_usd NUMERIC(10, 2) NOT NULL DEFAULT 0,
    commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.25,
    gross_profit_usd NUMERIC(10, 2) NOT NULL DEFAULT 0,
    developer_profit_share_usd NUMERIC(10, 2) NOT NULL DEFAULT 0,
    store_profit_usd NUMERIC(10, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at);

-- 4. EXPENSES (managed via /dashboard/expenses) ------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Operations',
    amount_usd NUMERIC(10, 2) NOT NULL DEFAULT 0,
    recorded_by VARCHAR(255) NOT NULL DEFAULT 'Staff',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Company Card',
    voucher_number VARCHAR(100) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Approved',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses (date);

-- 5. USER PROFILES (mirrors auth.users) ---------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    role VARCHAR(50) DEFAULT 'Sales',
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. ROW LEVEL SECURITY -------------------------------------------------------
-- NOTE: these policies are permissive (anyone with the anon key can read/write),
-- matching how the app currently talks to Supabase. Tighten them before launch.
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['categories','products','orders','expenses','profiles'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "App Read %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "App Manage %1$s" ON public.%1$I', t);
    EXECUTE format('CREATE POLICY "App Read %1$s" ON public.%1$I FOR SELECT USING (true)', t);
    EXECUTE format('CREATE POLICY "App Manage %1$s" ON public.%1$I FOR ALL USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- 7. SYNC AUTH.USERS INTO PUBLIC.PROFILES ------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'Sales'),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
