import { supabase } from "@/lib/supabase";
import { VerifiedTradeAccount } from "@/lib/b2b";

/**
 * Look up an approved trade account by its code and the email it was registered with.
 * Both must match, so a leaked code alone isn't enough to unlock trade pricing.
 */
export async function findApprovedTradeAccount(
  code: unknown,
  email: unknown
): Promise<VerifiedTradeAccount | null> {
  const cleanCode = String(code ?? "").trim().toUpperCase();
  const cleanEmail = String(email ?? "").trim().toLowerCase();
  if (!cleanCode || !cleanEmail) return null;

  const { data, error } = await supabase
    .from("trade_accounts")
    .select("id,company_name,contact_name,email,net_terms,status")
    .eq("account_code", cleanCode)
    .eq("status", "Approved")
    .maybeSingle();

  if (error || !data || String(data.email).trim().toLowerCase() !== cleanEmail) return null;

  return {
    id: String(data.id),
    companyName: data.company_name,
    contactName: data.contact_name,
    netTerms: Boolean(data.net_terms),
  };
}
