import { supabase, supabaseConfig } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = supabaseConfig.url;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = serviceRoleKey && supabaseUrl
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export type TeamRole = "Superadmin" | "Manager" | "Sales";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  phone: string;
  status: "Active On Shift" | "Active" | "Invited" | "Off Shift";
  authId?: string;
  createdAt?: string;
}

export function normalizeRole(roleInput?: string): TeamRole {
  const r = (roleInput || "").toLowerCase();
  if (r.includes("super") || r.includes("admin")) return "Superadmin";
  if (r.includes("manage") || r.includes("inventory")) return "Manager";
  return "Sales";
}

const TEAM_CACHE_TTL_MS = 60_000; // 60 seconds memory cache
let teamCache: { team: TeamMember[]; expiresAt: number } | null = null;
let teamRequest: Promise<TeamMember[]> | null = null;
let lastKnownGoodTeam: TeamMember[] = [];

export function invalidateTeamCache() {
  teamCache = null;
  teamRequest = null;
}

export async function getTeamMembersCatalog(): Promise<TeamMember[]> {
  const cached = teamCache;
  if (cached && cached.expiresAt > Date.now() && cached.team.length > 0) {
    return cached.team;
  }

  if (teamRequest) return teamRequest;

  teamRequest = (async () => {
    try {
      const list: TeamMember[] = [];

      // 1. Fetch profiles
      try {
        const { data: profiles, error: profErr } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (!profErr && profiles && profiles.length > 0) {
          profiles.forEach((p: any) => {
            const email = p.email || "staff@ikfoodusa.com";
            if (!list.some((existing) => existing.email.toLowerCase() === email.toLowerCase())) {
              list.push({
                id: p.id || `usr_${Date.now()}`,
                authId: p.id,
                name: p.full_name || email.split("@")[0],
                role: normalizeRole(p.role),
                email: email,
                phone: p.phone || "+256 700 000000",
                status: "Active",
                createdAt: p.created_at,
              });
            }
          });
        }
      } catch (e) {
        console.warn("Profiles query exception:", e);
      }

      // 2. Fetch admin users if available
      if (supabaseAdmin) {
        try {
          const { data: usersData, error } = await supabaseAdmin.auth.admin.listUsers();
          if (!error && usersData?.users) {
            usersData.users.forEach((u) => {
              const meta = u.user_metadata || {};
              const email = u.email || "user@ikfoodusa.com";
              if (!list.some((existing) => existing.email.toLowerCase() === email.toLowerCase())) {
                list.push({
                  id: u.id,
                  authId: u.id,
                  name: meta.full_name || meta.name || email.split("@")[0],
                  role: normalizeRole(meta.role),
                  email: email,
                  phone: meta.phone || "+256 700 000000",
                  status: "Active",
                  createdAt: u.created_at,
                });
              }
            });
          }
        } catch (err) {
          console.warn("Supabase admin listUsers notice:", err);
        }
      }

      if (list.length > 0) {
        lastKnownGoodTeam = list;
      }
      return list.length > 0 ? list : lastKnownGoodTeam;
    } catch (err) {
      console.warn("Team catalog fetch exception:", err);
      return lastKnownGoodTeam;
    }
  })();

  try {
    const team = await teamRequest;
    if (team.length > 0) {
      teamCache = { team, expiresAt: Date.now() + TEAM_CACHE_TTL_MS };
    }
    return team;
  } finally {
    teamRequest = null;
  }
}

