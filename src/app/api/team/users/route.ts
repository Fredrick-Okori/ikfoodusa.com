import { NextResponse } from "next/server";
import { supabase, supabaseConfig } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import {
  TeamMember,
  TeamRole,
  normalizeRole,
  getTeamMembersCatalog,
  invalidateTeamCache,
} from "@/lib/team";

export const dynamic = "force-dynamic";

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

async function isSuperadminRequest(request: Request): Promise<boolean> {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return false;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return false;

  return normalizeRole(data.user.user_metadata?.role) === "Superadmin";
}

export async function GET() {
  try {
    const list = await getTeamMembersCatalog();

    return NextResponse.json(list, {
      headers: {
        "Cache-Control": "private, max-age=30, s-maxage=30, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("GET /api/team/users error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isSuperadminRequest(request))) {
      return NextResponse.json({ error: "Only Superadmins can create team users." }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role, phone } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const assignedRole: TeamRole = normalizeRole(role);
    let authUserId = `usr_${Date.now()}`;

    // 1. Try Admin API if Service Key exists
    if (supabaseAdmin) {
      const { data: adminData, error: adminErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          role: assignedRole,
          phone: phone || "",
        },
      });

      if (adminErr) {
        return NextResponse.json({ error: adminErr.message }, { status: 400 });
      }

      if (adminData?.user) {
        authUserId = adminData.user.id;
      }
    } else {
      // 2. Standard Supabase Auth Signup
      const { data: signData, error: signErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: assignedRole,
            phone: phone || "",
          },
        },
      });

      if (signErr) {
        return NextResponse.json({ error: signErr.message }, { status: 400 });
      }

      if (signData?.user) {
        authUserId = signData.user.id;
      }
    }

    // 3. Attempt inserting into public.profiles if the table exists
    try {
      await supabase.from("profiles").upsert({
        id: authUserId,
        email,
        full_name: name,
        role: assignedRole,
        phone: phone || "",
      });
    } catch {}

    invalidateTeamCache();

    const newMember: TeamMember = {
      id: authUserId,
      authId: authUserId,
      name: name || email.split("@")[0],
      email,
      role: assignedRole,
      phone: phone || "+256 700 000000",
      status: "Active",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, member: newMember });
  } catch (error: any) {
    console.error("POST /api/team/users error:", error);
    return NextResponse.json({ error: error.message || "Failed to create user in Supabase." }, { status: 500 });
  }
}
