"use client";

import { useEffect, useState } from "react";
import {
  UserPlus,
  Users,
  ShieldCheck,
  Mail,
  Phone,
  Key,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
  Trash2,
  Crown,
  Briefcase,
  ShoppingBag,
} from "lucide-react";

export type TeamRole = "Superadmin" | "Manager" | "Sales";

export interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
  email: string;
  phone: string;
  status: "Active On Shift" | "Active" | "Invited" | "Off Shift";
  authId?: string;
  createdAt?: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [filter, setFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const isSuperadmin = typeof window !== "undefined" &&
    localStorage.getItem("ikfoods_user_role")?.toLowerCase() === "superadmin";

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<TeamRole>("Sales");
  const [phone, setPhone] = useState("+256 ");

  const loadTeam = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/team/users");
      const data = await res.json();
      
      let localMembers: TeamMember[] = [];
      try {
        const stored = JSON.parse(localStorage.getItem("ikfoods_team_members") || "[]");
        // Clear dummy placeholder IDs
        localMembers = stored.filter((m: TeamMember) => !["tm-1", "tm-2", "tm-3", "tm-4"].includes(m.id));
        localStorage.setItem("ikfoods_team_members", JSON.stringify(localMembers));
      } catch (e) {}

      const apiList: TeamMember[] = Array.isArray(data) ? data : [];
      
      // Combine API with locally created members without duplicates
      const combined = [
        ...localMembers,
        ...apiList.filter((am) => !localMembers.some((lm) => lm.email.toLowerCase() === am.email.toLowerCase())),
      ];

      setMembers(combined);
    } catch (err) {
      console.warn("Failed to load team from API:", err);
      setMembers([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let gen = "";
    for (let i = 0; i < 12; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(gen);
    setShowPassword(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please provide both an email address and a password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/team/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("ikfoods_access_token") || ""}`,
        },
        credentials: "include",
        body: JSON.stringify({
          name: fullName.trim() || email.split("@")[0],
          email: email.trim(),
          password,
          role,
          phone: phone.trim(),
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.error || "Failed to create user in Supabase Authentication.");
      }

      const createdMember: TeamMember = result.member || {
        id: `usr_${Date.now()}`,
        name: fullName.trim() || email.split("@")[0],
        email: email.trim(),
        role,
        phone: phone.trim(),
        status: "Active",
        createdAt: new Date().toISOString(),
      };

      const updated = [createdMember, ...members.filter((m) => m.email.toLowerCase() !== createdMember.email.toLowerCase())];
      setMembers(updated);
      try {
        localStorage.setItem("ikfoods_team_members", JSON.stringify(updated));
      } catch (e) {}

      setSuccessMessage(`User successfully registered in Supabase as ${role} for ${email}!`);
      setTimeout(() => {
        setIsModalOpen(false);
        setFullName("");
        setEmail("");
        setPassword("");
        setPhone("+256 ");
        setRole("Sales");
        setSuccessMessage(null);
      }, 1400);

    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred creating the user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = (memberId: string) => {
    if (!confirm("Are you sure you want to remove this staff member from the roster?")) return;
    const updated = members.filter((m) => m.id !== memberId);
    setMembers(updated);
    try {
      localStorage.setItem("ikfoods_team_members", JSON.stringify(updated));
    } catch (e) {}
  };

  const filteredMembers = members.filter((member) => {
    if (filter === "superadmin") return member.role === "Superadmin";
    if (filter === "manager") return member.role === "Manager";
    if (filter === "sales") return member.role === "Sales";
    if (filter === "active") return member.status.includes("Active");
    return true;
  });

  const getRoleBadge = (userRole: TeamRole) => {
    switch (userRole) {
      case "Superadmin":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">
            <Crown size={11} /> Superadmin
          </span>
        );
      case "Manager":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-beige-50 text-forest-700 border border-beige-200 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">
            <Briefcase size={11} /> Manager
          </span>
        );
      case "Sales":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">
            <ShoppingBag size={11} /> Sales
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-forest-950 tracking-tight">Staff & Team Roles</h1>
          <p className="text-xs text-[#71717a] mt-1">
            Manage users with 3 role tiers: <span className="font-bold text-purple-700">Superadmin</span>, <span className="font-bold text-forest-700">Manager</span>, and <span className="font-bold text-blue-700">Sales</span>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadTeam}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-full border border-beige-200 bg-white px-4 py-2 text-xs font-semibold text-forest-950 hover:bg-beige-50 transition shadow-2xs"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin text-forest-700" : "text-[#71717a]"} /> Sync
          </button>

          {isSuperadmin && (
            <button
              onClick={() => {
                setErrorMessage(null);
                setSuccessMessage(null);
                setIsModalOpen(true);
              }}
              className="rounded-full bg-forest-900 hover:bg-forest-800 px-5 py-2.5 text-xs font-bold text-white transition shadow-sm flex items-center gap-1.5"
            >
              <UserPlus size={16} /> Create New User
            </button>
          )}
        </div>
      </div>

      {/* 3 Role Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-purple-200/80 bg-purple-50/40 p-4 space-y-1">
          <div className="flex items-center gap-2 text-purple-800 font-bold text-xs uppercase tracking-wider">
            <Crown size={14} /> Superadmin
          </div>
          <p className="text-xs text-neutral-600">Full system control, financial oversight, developer settings, user management.</p>
          <p className="text-xs font-bold text-purple-900 pt-1">
            {isLoading ? "—" : members.filter((m) => m.role === "Superadmin").length} Active Superadmins
          </p>
        </div>

        <div className="rounded-2xl border border-beige-200 bg-beige-50/60 p-4 space-y-1">
          <div className="flex items-center gap-2 text-forest-700 font-bold text-xs uppercase tracking-wider">
            <Briefcase size={14} /> Manager
          </div>
          <p className="text-xs text-neutral-600">Store operations, inventory & catalog management, stock adjustments, expenses.</p>
          <p className="text-xs font-bold text-forest-800 pt-1">
            {isLoading ? "—" : members.filter((m) => m.role === "Manager").length} Active Managers
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4 space-y-1">
          <div className="flex items-center gap-2 text-blue-800 font-bold text-xs uppercase tracking-wider">
            <ShoppingBag size={14} /> Sales
          </div>
          <p className="text-xs text-neutral-600">Point of sale, customer order processing, cash handling, and order dispatching.</p>
          <p className="text-xs font-bold text-blue-900 pt-1">
            {isLoading ? "—" : members.filter((m) => m.role === "Sales").length} Active Sales Staff
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "all", label: `All Staff (${isLoading ? "—" : members.length})` },
          { id: "superadmin", label: "Superadmins" },
          { id: "manager", label: "Managers" },
          { id: "sales", label: "Sales Team" },
          { id: "active", label: "Active On Shift" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              filter === tab.id
                ? "bg-forest-900 text-white shadow-2xs"
                : "bg-white text-[#71717a] border border-beige-200 hover:border-forest-950"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Team Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredMembers.map((member) => (
          <div
            key={member.id || member.email}
            className="rounded-3xl border border-beige-200 bg-white p-6 shadow-2xs space-y-4 relative group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div
                  className={`h-12 w-12 rounded-2xl font-extrabold flex items-center justify-center text-base shadow-2xs ${
                    member.role === "Superadmin"
                      ? "bg-purple-100 text-purple-800"
                      : member.role === "Manager"
                      ? "bg-beige-50 text-forest-700 border border-beige-200"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {member.name ? member.name[0].toUpperCase() : "U"}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-forest-950">{member.name}</h3>
                  <div className="mt-1">{getRoleBadge(member.role)}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                    member.status.includes("Active")
                      ? "bg-beige-50 text-forest-700 border border-beige-200"
                      : member.status === "Invited"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {member.status}
                </span>

                <button
                  onClick={() => handleDeleteMember(member.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-600 transition"
                  title="Remove from roster"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-beige-100 space-y-2 text-xs text-[#71717a]">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2">
                  <Mail size={13} className="text-forest-700" /> {member.email}
                </p>
                <span className="font-mono text-[9px] bg-neutral-100 px-2 py-0.5 rounded text-neutral-600">
                  Supabase Auth User
                </span>
              </div>

              <p className="flex items-center gap-2">
                <Phone size={13} className="text-forest-700" /> {member.phone}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="rounded-3xl border border-beige-200 bg-white p-12 text-center text-neutral-500">
          <Users size={32} className="mx-auto mb-2 text-forest-700" />
          <p className="text-sm font-semibold">No team members found in this category.</p>
        </div>
      )}

      {/* CREATE SUPABASE USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-neutral-200 space-y-5">
            
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-beige-50 border border-beige-200 text-forest-700 flex items-center justify-center">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-neutral-900 tracking-tight">
                    Create New User
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Registers a new staff member with assigned role permissions.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-700">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 rounded-2xl bg-green-50 border border-green-200 p-3 text-xs font-semibold text-green-700">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Brenda Namuli"
                  className="w-full h-10 rounded-2xl border border-neutral-200 px-3.5 text-xs text-neutral-900 outline-none focus:border-forest-700 focus:ring-1 focus:ring-forest-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@ikfoodusa.com"
                    className="w-full h-10 rounded-2xl border border-neutral-200 px-3.5 text-xs text-neutral-900 outline-none focus:border-forest-700 focus:ring-1 focus:ring-forest-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+256 700 000000"
                    className="w-full h-10 rounded-2xl border border-neutral-200 px-3.5 text-xs text-neutral-900 outline-none focus:border-forest-700 focus:ring-1 focus:ring-forest-700"
                  />
                </div>
              </div>

              {/* 3 ROLES SELECTOR */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Assigned Team Role <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  {[
                    { id: "Superadmin", label: "Superadmin", desc: "Full Access & Finances", icon: Crown, activeColor: "border-purple-600 bg-purple-50 text-purple-900" },
                    { id: "Manager", label: "Manager", desc: "Inventory & Orders", icon: Briefcase, activeColor: "border-forest-700 bg-beige-50 text-forest-800" },
                    { id: "Sales", label: "Sales", desc: "POS, Orders & Dispatch", icon: ShoppingBag, activeColor: "border-blue-600 bg-blue-50 text-blue-900" },
                  ].map((r) => {
                    const Icon = r.icon;
                    const isSelected = role === r.id;
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => setRole(r.id as TeamRole)}
                        className={`rounded-2xl border p-3 text-left transition ${
                          isSelected
                            ? `${r.activeColor} ring-1 ring-offset-1`
                            : "border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <Icon size={14} />
                          <span>{r.label}</span>
                        </div>
                        <p className="text-[10px] text-neutral-500 mt-1 leading-tight">{r.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-neutral-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] font-bold text-forest-700 hover:underline flex items-center gap-1"
                  >
                    <Key size={12} /> Auto-Generate
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password..."
                    className="w-full h-10 rounded-2xl border border-neutral-200 pl-3.5 pr-10 text-xs font-mono text-neutral-900 outline-none focus:border-forest-700 focus:ring-1 focus:ring-forest-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-neutral-400 hover:text-neutral-700"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-beige-50 p-3 text-[11px] text-neutral-600 space-y-1">
                <p className="flex items-center gap-1.5 font-semibold text-neutral-800">
                  <ShieldCheck size={14} className="text-forest-700" /> Supabase Auth Integration
                </p>
                <p>
                  The user will be created in Supabase Authentication and assigned the <strong className="text-neutral-900">{role}</strong> role in their user metadata.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full border border-neutral-200 px-5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-forest-900 hover:bg-forest-800 px-6 py-2 text-xs font-bold text-white transition flex items-center gap-2 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Registering User...
                    </>
                  ) : (
                    <>
                      <UserCheck size={14} /> Create New User
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
