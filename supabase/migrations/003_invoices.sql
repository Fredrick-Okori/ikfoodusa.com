-- ============================================================================
-- IK FOODS USA — INVOICES (managed from /dashboard/invoices)
-- Run once in the Supabase SQL editor. Safe to re-run. Amounts in the invoice currency (default USD).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(60) UNIQUE NOT NULL,          -- e.g. IKF/IVC/08/00001
    status VARCHAR(30) NOT NULL DEFAULT 'Draft',          -- Draft, Sent, Partially Paid, Paid, Void
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    issuer TEXT NOT NULL,                                -- "From" block
    bill_to TEXT NOT NULL,                               -- "Invoice To" block
    ship_to TEXT,
    customer_email VARCHAR(255),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    payment_terms VARCHAR(255),
    po_number VARCHAR(100),
    quantity_label VARCHAR(30) NOT NULL DEFAULT 'Qty',   -- column header, e.g. "Quantity (kg)"
    items JSONB NOT NULL DEFAULT '[]'::jsonb,            -- [{description, quantity, rate}]
    tax_rate NUMERIC(6, 3) NOT NULL DEFAULT 0,           -- percent, applied after discount
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    shipping NUMERIC(12, 2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    balance_due NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_details TEXT,
    delivery_details TEXT,
    notes TEXT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON public.invoices (issue_date);

-- RLS (permissive, matching the rest of the app — tighten before launch)
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "App Read invoices" ON public.invoices;
DROP POLICY IF EXISTS "App Manage invoices" ON public.invoices;
CREATE POLICY "App Read invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "App Manage invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
