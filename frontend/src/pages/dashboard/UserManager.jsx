import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "@/lib/notify";
import {
  Users, Search, Crown, ShieldCheck, UserRound, Trash2, Edit, Check, X, Loader2,
  ChevronDown, Eye, RotateCcw, Plus, Equal, ArrowUpDown, RefreshCw, Link2Off,
  ShoppingBag, Store, MessageSquare, ExternalLink, Sparkles, MessageCircle, Mail,
} from "lucide-react";

import { FaDiscord as FaDiscordIcon } from "react-icons/fa6";
import { BADGE_CATALOG } from "@/constants/badges";
import { BadgeChip } from "@/components/BadgeChip";
import { SmartSelect } from "@/components/ui-shared/SmartSelect";
import { PageHeader, EmptyState } from "@/components/ui-shared/PageUI";
import BotManager from "./BotManager";

/* The Users tab — the one admin page for accounts.
 *
 * This used to be two half-pages: the User Manager listed roles and tiers from
 * /admin/users, while the Bot Manager listed the same accounts a second time
 * from /admin/discord/roster so an admin could see the Discord half of a
 * profile. One table is what the job actually is, so the roster (which carries
 * everything the user table did AND the Discord auth info) is the single data
 * source now, with the bot controls — refresh a member, unlink a Discord,
 * booster sync — living in one toolbar.
 */
const ROLES = [
  {
    id: "user",
    label: "User",
    description: "Standard member — can customise their own profile only.",
    Icon: UserRound,
    tint: "#a1a1aa",
  },
  {
    id: "admin",
    label: "Admin",
    description: "Full dashboard access: users, tiers, badges and settings.",
    Icon: ShieldCheck,
    tint: "#b4bffa",
  },
];

const ROLE_MAP = Object.fromEntries(ROLES.map((r) => [r.id, r]));
// Owner is a flag rather than a role value, so the effective role has to be
// resolved in one place or the filter and the sort would disagree.
const roleOf = (u) => (u?.is_owner ? "owner" : u?.role || "user");
const OWNER_TINT = "#fbbf24";

const PROVIDER_LABEL = { discord: "Discord", riot: "Riot", youtube: "YouTube", github: "GitHub" };

function RoleBadge({ user, size = "sm" }) {
  const role = user?.is_owner
    ? { label: "Owner", Icon: Crown, tint: OWNER_TINT }
    : ROLE_MAP[user?.role] || ROLE_MAP.user;

  const pad = size === "lg" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${pad}`}
      style={{
        color: role.tint,
        borderColor: `${role.tint}55`,
        background: `${role.tint}1f`,
      }}
    >
      <role.Icon className={size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5"} />
      {role.label}
    </span>
  );
}

/* A drawn checkbox: `sr-only peer` keeps the real input available to screen
   readers and keyboard focus while the painted box is what shows — the same
   pattern SiteSettings uses, per the "no stock browser controls" contract
   the dashboard tests enforce on every page here. */
const CheckPin = ({ label, testid, checked, onChange }) => (
  <label className="relative inline-flex cursor-pointer items-center">
    <input
      type="checkbox"
      aria-label={label}
      data-testid={testid}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="peer sr-only"
    />
    <span
      className={`grid h-4 w-4 place-items-center rounded-md border outline-none transition-colors duration-200 ${
        checked
          ? "border-brand-400/50 bg-brand-500/30"
          : "border-white/20 bg-white/[0.04] peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500/60"
      }`}
    >
      {checked && <Check className="h-3 w-3 text-brand-200" />}
    </span>
  </label>
);

const Avatar = ({ u }) => (
  <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-zinc-800 text-xs font-bold text-zinc-400 ring-1 ring-white/10">
    {u.discord_avatar ? (
      <img src={u.discord_avatar} alt="" className="h-full w-full object-cover" />
    ) : (
      (u.display_name || u.username || "?")?.[0]?.toUpperCase()
    )}
  </span>
);

// What the Discord column reads, in the owner's requested format:
//   discord username (tourn.lol username)   →  "fbidiscord (@fbi)"
// The raw Discord handle is only meaningful when the account is actually in
// OUR guild (roster rows carry that member flag from the bot), so a linked
// account outside the server reads as linked-but-not-in-server instead.
const DiscordCell = ({ u }) => (
  <div className="flex flex-col gap-1">
    {u.discord_linked && u.member && u.discord_username ? (
      <span className="text-xs text-zinc-200">
        {u.discord_username} <span className="font-mono2 text-zinc-500">(@{u.username})</span>
      </span>
    ) : u.discord_linked ? (
      <span className="text-xs text-zinc-400">
        linked <span className="font-mono2 text-[10px] text-amber-300">not in server</span>
      </span>
    ) : (
      <span className="w-fit rounded-full bg-amber-500/10 px-2 py-0.5 font-mono2 text-[10px] uppercase tracking-wide text-amber-300">
        not linked
      </span>
    )}
    <div className="flex flex-wrap gap-1">
      {u.booster && (
        <span className="rounded-full bg-brand-500/12 px-2 py-0.5 font-mono2 text-[10px] uppercase tracking-wide text-brand-300">
          booster
        </span>
      )}
      {u.member && (
        <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 font-mono2 text-[10px] uppercase tracking-wide text-emerald-300">
          in server
        </span>
      )}
    </div>
  </div>
);

export default function UserManager() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isOwner = user?.is_owner || user?.role === "owner";
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || "users");
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const [viewsDraft, setViewsDraft] = useState("");
  const [viewsBusy, setViewsBusy] = useState(null);
  const [sortKey, setSortKey] = useState("created");
  const [sortDir, setSortDir] = useState("desc");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selected, setSelected] = useState(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(null);

  // Store Management State
  const [stores, setStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storeSearch, setStoreSearch] = useState("");
  const [expandedStoreId, setExpandedStoreId] = useState(null);

  // Chat / Inquiries Monitoring State
  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatFilter, setChatFilter] = useState("all");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/discord/roster", { params: { search, filter: "all", limit: 200 } });
      setUsers(data.users || []);
      setStats(data.stats || null);
    } catch {
      toast.error("Failed to load users");
    }
    setLoading(false);
  }, [search]);

  const fetchStores = useCallback(async () => {
    setStoresLoading(true);
    try {
      const { data } = await api.get("/admin/stores");
      setStores(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load creator stores");
    }
    setStoresLoading(false);
  }, []);

  const fetchChats = useCallback(async () => {
    setChatsLoading(true);
    try {
      const { data } = await api.get("/admin/store-chats");
      setChats(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load buyer inquiries");
    }
    setChatsLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === "users") {
      const timer = setTimeout(fetchUsers, 250);
      return () => clearTimeout(timer);
    } else if (activeTab === "stores") {
      fetchStores();
    } else if (activeTab === "chats") {
      fetchChats();
    }
  }, [activeTab, fetchUsers, fetchStores, fetchChats]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === "users") next.delete("tab");
      else next.set("tab", tab);
      return next;
    });
  };

  const toggleStore = async (userId, currentEnabled) => {
    try {
      await api.put(`/admin/stores/${userId}/toggle`, { enabled: !currentEnabled });
      setStores((prev) =>
        prev.map((s) => (s.user_id === userId ? { ...s, store_enabled: !currentEnabled } : s))
      );
      toast.success(!currentEnabled ? "Store enabled" : "Store disabled");
    } catch {
      toast.error("Failed to toggle store");
    }
  };

  const deleteProduct = async (userId, productId, productTitle) => {
    if (!window.confirm(`Delete product "${productTitle || productId}"? This will remove it from the user's store.`)) return;
    try {
      await api.delete(`/admin/stores/${userId}/products/${productId}`);
      setStores((prev) =>
        prev.map((s) =>
          s.user_id === userId
            ? { ...s, items: (s.items || []).filter((it) => it.id !== productId) }
            : s
        )
      );
      toast.success("Product deleted from store");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const updateChatStatus = async (chatId, newStatus) => {
    try {
      await api.put(`/admin/store-chats/${chatId}/status`, { status: newStatus });
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, status: newStatus } : c))
      );
      toast.success(`Inquiry marked as ${newStatus}`);
    } catch {
      toast.error("Failed to update inquiry status");
    }
  };

  const openEditor = (u) => {
    setEditingUser({
      ...u,
      _orig_username: u.username,
      display_name: u.display_name || "",
      bio: u.bio || u.profile?.bio || "",
      accent_color: u.accent_color || u.profile?.accent_color || "#7c3aed",
      secondary_alias: u.secondary_alias || u.profile?.secondary_alias || "",
      store_enabled: u.store_enabled ?? (u.profile?.store_enabled !== false),
    });
    setViewsDraft(String(u.views || 0));
  };

  const saveUser = async (u) => {
    setBusy(true);
    try {
      const payload = isOwner
        ? {
            role: u.role,
            tier: u.tier,
            is_owner: u.is_owner,
            badges: u.badges,
            ...(u.username && u.username.trim().toLowerCase() !== u._orig_username
              ? { username: u.username.trim().toLowerCase() }
              : {}),
          }
        : {
            badges: u.badges,
          };
      const { data } = await api.put(`/admin/users/${u.id}`, payload);

      // Save admin profile details & store permissions
      try {
        await api.put(`/admin/users/${u.id}/profile`, {
          display_name: u.display_name,
          bio: u.bio,
          accent_color: u.accent_color,
          secondary_alias: u.secondary_alias,
          store_enabled: u.store_enabled,
        });
      } catch (err) {
        console.warn("Could not save extra profile details:", err);
      }

      setUsers(users.map((x) => (x.id === data.id ? { ...x, ...data, display_name: u.display_name, secondary_alias: u.secondary_alias } : x)));
      setEditingUser(null);
      toast.success("User updated successfully");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to update user");
    }
    setBusy(false);
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Delete user @${u.username}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      setUsers(users.filter((x) => x.id !== u.id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(u.id);
        return next;
      });
      toast.success(`User @${u.username} deleted`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to delete user");
    }
  };

  /* ---- bulk actions ------------------------------------------------------ */
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => (prev.size === sortedUsers.length ? new Set() : new Set(sortedUsers.map((u) => u.id))));
  };

  // Run an API call per selected row, then reload once. The admin API is a
  // per-row REST surface, so N small confirmed calls beats a new bulk endpoint
  // that would have to re-implement every guard it wraps.
  const runBulk = async (label, action) => {
    const ids = sortedUsers.filter((u) => selected.has(u.id) && !u.is_owner && roleOf(u) !== "owner");
    if (!ids.length) {
      toast.info("Nothing deletable selected.");
      return;
    }
    if (!window.confirm(`${label} ${ids.length} account(s)? This cannot be undone.`)) return;
    setBulkBusy(true);
    let ok = 0;
    for (const u of ids) {
      // eslint-disable-next-line no-await-in-loop -- sequential on purpose: one row at a time.
      try {
        await action(u);
        ok += 1;
      } catch (e) {
        toast.error(`@${u.username}: ${e.response?.data?.detail || "failed"}`);
      }
    }
    setBulkBusy(false);
    if (ok) toast.success(`${label} done for ${ok} account(s)`);
    setSelected(new Set());
    fetchUsers();
  };

  const bulkDelete = () => runBulk("Delete", (u) => api.delete(`/admin/users/${u.id}`));

  const bulkTier = (tier) =>
    runBulk(`Set tier ${tier}`, (u) => api.put(`/admin/users/${u.id}`, { tier }));

  const bulkRemoveBadge = (badgeId) =>
    runBulk(`Remove ${badgeId}`, (u) =>
      api.put(`/admin/users/${u.id}`, { badges: (u.badges || []).filter((b) => b !== badgeId) }),
    );

  /* Applying the bot's role mapping to a selection goes through ONE request
     rather than the per-row loop above: Discord rate-limits role writes per
     guild, so forty parallel PUTs to the same route earn a 429 and half the
     members silently keep the wrong roles. The endpoint works through the list
     sequentially and answers with a per-account report. */
  const bulkApplyRoles = async () => {
    const ids = sortedUsers.filter((u) => selected.has(u.id)).map((u) => u.id);
    if (!ids.length) return;
    setBulkBusy(true);
    try {
      const { data } = await api.post("/admin/bot/apply-roles", { user_ids: ids });
      const results = data.results || [];
      const failed = results.filter((r) => r.error);
      const unlinked = results.filter((r) => r.skipped === "no_discord").length;

      if (data.touched) toast.success(`Discord roles applied to ${data.touched} member(s)`);
      else toast.info("No wired role matched those accounts — check the bot panel mapping.");
      if (unlinked) toast.info(`${unlinked} account(s) have no Discord linked.`);
      for (const f of failed.slice(0, 3)) toast.error(`@${f.username}: ${f.error}`);
      if (failed.length > 3) toast.error(`...and ${failed.length - 3} more failed`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not apply roles");
    }
    setBulkBusy(false);
    setSelected(new Set());
    fetchUsers();
  };

  /* Sync all — one pass that repairs roles AND badges for every linked account.

     "Apply Discord roles" only ever touched Discord, and nothing re-read a
     member's roles afterwards, so a member whose role was granted months ago
     could still have no badge for it. The backend walks the roster, re-reads each
     member from Discord, applies the mapping, recomputes the badges and stores
     the fresh member payload; this button is the report of what moved. */
  const syncAll = async () => {
    if (!window.confirm("Re-read every linked account from Discord, apply the role mapping and fix up their badges?")) return;
    setSyncing(true);
    setSyncProgress(null);

    // Defensive about the shape on purpose: this reports what the server says, so
    // a field that is missing must not print "undefined account(s)".
    const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const totals = { scanned: 0, roles: 0, badges: 0, missing: 0, failed: 0 };
    const errors = [];
    let discordConfigured = true;
    let offset = 0;
    let stoppedEarly = false;

    try {
      // The endpoint pages: one request per 100 accounts instead of one request
      // that outlives its own connection. This loop is what makes the button
      // "all" — pressing it once works through the whole guild, with the count
      // in the label showing how far it has got.
      for (let page = 0; page < 25; page += 1) {
        const { data } = await api.post("/admin/bot/sync-all", { offset });
        totals.scanned += n(data.scanned);
        totals.roles += n(data.roles_applied);
        totals.badges += n(data.badges_added);
        totals.missing += n(data.members_missing);
        totals.failed += n(data.failed);
        errors.push(...(data.errors || []));
        if (data.discord_configured === false) discordConfigured = false;
        setSyncProgress({ done: n(data.next_offset), total: n(data.total) });

        const remaining = n(data.remaining);
        // No progress is the other way this could spin: an empty page means there
        // is nothing after it, whatever `remaining` says.
        if (!remaining || !n(data.scanned)) break;
        if (page === 24) {
          stoppedEarly = true;
          break;
        }
        offset = n(data.next_offset);
      }

      if (!totals.scanned) {
        toast.info("Nothing to sync — no account has Discord linked yet.");
      } else {
        const parts = [`${totals.scanned} account${totals.scanned === 1 ? "" : "s"} checked`];
        if (totals.roles) parts.push(`${totals.roles} got roles`);
        if (totals.badges) parts.push(`${totals.badges} gained badges`);
        if (totals.missing) parts.push(`${totals.missing} not in the server`);
        if (totals.failed) parts.push(`${totals.failed} failed`);
        toast.success(`Sync complete — ${parts.join(", ")}.`);
        if (stoppedEarly) toast.info("Stopped after 2,500 accounts — press Sync all again for the rest.");
        if (!discordConfigured) {
          toast.info("Discord bot is not configured — badges were rebuilt from what is stored.");
        }
        for (const e of errors.slice(0, 3)) toast.error(`@${e.username}: ${e.error}`);
        if (totals.failed > 3) toast.error(`...and ${totals.failed - 3} more failed`);
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not run the sync");
    }
    setSyncing(false);
    setSyncProgress(null);
    // Only re-read the roster when something was actually checked: a click that
    // synced nothing should not cost a second load of 200 rows.
    if (totals.scanned) fetchUsers();
  };

  const refreshUser = async (u) => {
    try {
      const { data } = await api.post(`/admin/discord/${u.id}/refresh`);
      setUsers((prev) => prev.map((x) => (x.id === data.user.id ? { ...x, ...data.user } : x)));
      toast.success(`Refreshed @${u.username}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not refresh that member");
    }
  };

  const unlinkUser = async (u) => {
    if (!window.confirm(`Unlink Discord from @${u.username}? They can link it again by signing in with Discord.`)) return;
    try {
      await api.post(`/admin/discord/${u.id}/unlink`);
      toast.success(`Unlinked Discord from @${u.username}`);
      fetchUsers();
    } catch {
      toast.error("Failed to unlink Discord");
    }
  };

  /* ---- the editor's view changer ------------------------------------------ */
  const changeViews = async (mode) => {
    if (!editingUser) return;
    const amount = Math.max(0, Math.trunc(Number(viewsDraft) || 0));
    setViewsBusy(mode);
    try {
      const { data } = await api.put(`/admin/users/${editingUser.id}/views`, {
        mode,
        amount: mode === "reset" ? 0 : amount,
      });
      setEditingUser((u) => ({ ...u, views: data.views }));
      setUsers((list) => list.map((x) => (x.id === data.id ? { ...x, views: data.views } : x)));
      setViewsDraft(mode === "reset" ? "0" : String(mode === "add" ? (data.views || 0) : amount));
      toast.success(
        mode === "reset" ? "Views reset to 0" : mode === "add" ? `Added ${amount} views` : `Views set to ${amount}`,
      );
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to update views");
    }
    setViewsBusy(null);
  };

  const sortedUsers = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const val = (u) => {
      switch (sortKey) {
        case "username": return String(u.username || "").toLowerCase();
        case "tier": return String(u.tier || "");
        case "role": return roleOf(u);
        case "views": return Number(u.views || 0);
        case "discord": return u.discord_linked ? 1 : 0;
        case "badges": return (u.badges || []).length;
        default: return new Date(u.created_at || 0).getTime() || 0;
      }
    };
    const list = roleFilter === "all" ? users : users.filter((u) => roleOf(u) === roleFilter);
    return [...list].sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [users, roleFilter, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "views" || key === "created" ? "desc" : "asc");
    }
  };

  const allSelected = sortedUsers.length > 0 && sortedUsers.every((u) => selected.has(u.id));

  return (
    <div className="space-y-5" data-testid="user-manager-page">
      <PageHeader
        icon={Users}
        title="Users"
        subtitle="Every account, its Discord link and what it is allowed to do — search, edit, or take the bot's view of the roster at face value."
        actions={
          <>
            {/* Sync all: roles and badges in one pass, for every linked account
                rather than a selection — the drift it repairs is not something
                an admin can see by looking at the table. */}
            <button
              type="button"
              onClick={syncAll}
              disabled={syncing}
              data-testid="sync-all"
              title="Re-read every linked account from Discord, apply the role mapping and fix up badges"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-zinc-200 transition hover:border-brand-400/30 hover:bg-brand-500/10 hover:text-white disabled:opacity-50"
            >
              {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {syncing
                ? syncProgress?.total
                  ? `Syncing ${syncProgress.done}/${syncProgress.total}`
                  : "Syncing…"
                : "Sync all"}
            </button>
            {stats && (
              <span className="hidden items-center gap-2 font-mono2 text-[10px] uppercase tracking-wide text-zinc-500 sm:flex">
                <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-emerald-300">
                  {stats.discord_linked} linked
                </span>
                <span className="rounded-full bg-amber-500/12 px-2 py-0.5 text-amber-300">
                  {stats.discord_missing} without Discord
                </span>
                <span>{stats.boosters} boosters</span>
              </span>
            )}
            <SmartSelect
              testid="user-role-filter"
              ariaLabel="Filter by role"
              value={roleFilter}
              onChange={setRoleFilter}
              options={[
                { value: "all", label: "All roles" },
                { value: "user", label: "Users" },
                { value: "admin", label: "Admins" },
                { value: "owner", label: "Owners" },
              ]}
            />
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search username, email or Discord…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-brand-500/50 transition"
              />
            </div>
          </>
        }
      />

      {/* Admin Module Tabs: Accounts Roster, Creator Stores & Products, Store Buyer Chats */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => handleTabChange("users")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === "users"
              ? "bg-brand-500/20 text-brand-200 border border-brand-500/40"
              : "bg-white/[0.03] text-zinc-400 hover:text-white border border-white/5"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Accounts Roster</span>
          <span className="font-mono2 text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-zinc-300">
            {stats?.total || users.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("stores")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === "stores"
              ? "bg-brand-500/20 text-brand-200 border border-brand-500/40"
              : "bg-white/[0.03] text-zinc-400 hover:text-white border border-white/5"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Creator Stores &amp; Products</span>
          {stores.length > 0 && (
            <span className="font-mono2 text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-zinc-300">
              {stores.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("chats")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === "chats"
              ? "bg-brand-500/20 text-brand-200 border border-brand-500/40"
              : "bg-white/[0.03] text-zinc-400 hover:text-white border border-white/5"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Store Buyer Chats</span>
          {chats.length > 0 && (
            <span className="font-mono2 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {chats.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "users" && (
        <>
          {/* Bot Manager — visible to Owner only */}
      {isOwner && <BotManager />}

      {/* Bulk bar — appears once anything is selected, Owner only */}
      {isOwner && selected.size > 0 && (
        <div className="glass flex flex-wrap items-center gap-2 rounded-2xl px-4 py-3" data-testid="bulk-bar">
          <span className="text-xs font-semibold text-zinc-200">{selected.size} selected</span>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={() => bulkTier("premium")}
            className="rounded-xl border border-brand-500/40 bg-brand-500/15 px-3 py-2 text-xs font-semibold text-brand-200 transition hover:bg-brand-500/25 disabled:opacity-50"
          >
            Set Premium
          </button>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={() => bulkTier("free")}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.08] disabled:opacity-50"
          >
            Set Free
          </button>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={() => bulkRemoveBadge("booster")}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.08] disabled:opacity-50"
          >
            Remove booster badge
          </button>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={bulkApplyRoles}
            data-testid="bulk-apply-roles"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.08] disabled:opacity-50"
          >
            Apply Discord roles
          </button>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={bulkDelete}
            data-testid="bulk-delete"
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            <Trash2 className="mr-1 inline h-3.5 w-3.5" /> Delete selected
          </button>
        </div>
      )}

      {/* The roster arrives capped at a page. Without this line a guild of 1,300
          members looks like a guild of 200, and the member an admin is hunting
          for is simply "not here". */}
      {stats?.total > users.length && (
        <p className="text-[11px] text-zinc-500" data-testid="user-roster-truncated">
          Showing {users.length} of {Number(stats.total).toLocaleString()} accounts — refine the search to
          reach the rest.
        </p>
      )}

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-white/[0.02] text-xs font-mono2 uppercase tracking-wider text-zinc-500 border-b border-white/5">
              <tr>
                <th className="px-3 py-3">
                  <CheckPin
                    label="Select all"
                    testid="select-all-users"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                {[
                  ["username", "User"],
                  ["discord", "Discord"],
                  ["role", "Role"],
                  ["tier", "Tier"],
                  ["views", "Views"],
                  ["badges", "Badges"],
                ].map(([key, label]) => (
                  <th key={key} className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort(key)}
                      data-testid={`user-sort-${key}`}
                      className={`inline-flex items-center gap-1.5 outline-none transition-colors hover:text-zinc-200 focus-visible:text-brand-300 ${
                        sortKey === key ? "text-brand-300" : ""
                      }`}
                    >
                      {label}
                      {sortKey === key ? (
                        <ChevronDown className={`h-3 w-3 transition-transform ${sortDir === "asc" ? "rotate-180" : ""}`} />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  </th>
                ))}
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5" data-testid="user-rows">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-zinc-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-400" /> Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={Search}
                      title="No users match"
                      hint="Try a different search term or clear the role filter."
                    />
                  </td>
                </tr>
              ) : (
                sortedUsers.map((u) => (
                  <tr key={u.id} className={`hover:bg-white/[0.02] transition ${selected.has(u.id) ? "bg-brand-500/[0.06]" : ""}`} data-testid="user-row">
                    <td className="px-3 py-3.5">
                      <CheckPin
                        label={`Select ${u.username}`}
                        testid={`user-select-${u.username}`}
                        checked={selected.has(u.id)}
                        onChange={() => toggleSelect(u.id)}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar u={u} />
                        <div className="min-w-0">
                          <div className="font-semibold text-zinc-100 flex items-center gap-1.5 flex-wrap">
                            <span className="truncate">@{u.username}</span>
                            {u.is_owner && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                            {(u.entry_pin || u.profile?.entry_text) && (
                              <span
                                data-testid={`user-entry-pin-${u.username}`}
                                className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 font-mono2 text-[9px] text-amber-300 border border-amber-500/20"
                                title={`Entry PIN: ${u.entry_pin || u.profile?.entry_text}`}
                              >
                                PIN: {u.entry_pin || u.profile?.entry_text}
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-xs truncate ${
                              isOwner
                                ? "text-zinc-500"
                                : "text-zinc-600 filter blur-[4px] select-none pointer-events-none"
                            }`}
                            title={isOwner ? u.email : "Email hidden for privacy"}
                          >
                            {u.email || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <DiscordCell u={u} />
                    </td>
                    <td className="px-5 py-3.5">
                      <RoleBadge user={u} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${u.tier === "premium" ? "bg-brand-500/20 text-brand-300 border border-brand-500/30" : u.tier === "admin" ? "bg-amber-500/20 text-amber-300" : "bg-white/5 text-zinc-400"}`}>
                        {u.tier}
                      </span>
                      {/* Timed premium (invite-code or view-reward trials): the
                          expiry rides with the account, so the admin can see
                          when a trial ends instead of digging into the row. */}
                      {u.premium_until && (
                        <span className="ml-1.5 font-mono2 text-[10px] text-zinc-500">
                          until {new Date(u.premium_until).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono2 text-xs text-zinc-400">{(u.views || 0).toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(u.badges || []).map((b) => (
                          <span key={b} className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 text-[10px] font-mono2">
                            {b}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/${u.username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-white/5 p-2 text-zinc-300 transition hover:bg-white/10"
                          title="View public profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => refreshUser(u)}
                          disabled={!u.discord_linked}
                          className="rounded-lg bg-white/5 p-2 text-zinc-300 transition hover:bg-white/10 disabled:opacity-40"
                          title="Re-check this member with the bot"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditor(u)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition"
                          title="Edit User"
                          aria-label={`Edit ${u.username}`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {isOwner && (
                          <>
                            <button
                              type="button"
                              onClick={() => unlinkUser(u)}
                              disabled={!u.discord_linked}
                              className="rounded-lg bg-white/5 p-2 text-amber-300 transition hover:bg-amber-500/15 disabled:opacity-40"
                              title="Unlink Discord"
                            >
                              <Link2Off className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteUser(u)}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-200 transition"
                              title="Delete User"
                              aria-label={`Delete ${u.username}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {activeTab === "stores" && (
        <div className="space-y-4" data-testid="stores-manager">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search store owner or product..."
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-brand-500/50 transition"
                />
              </div>
              <button
                type="button"
                onClick={fetchStores}
                disabled={storesLoading}
                className="p-2 rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 hover:text-white transition cursor-pointer"
                title="Refresh stores"
              >
                <RefreshCw className={`w-4 h-4 ${storesLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="flex items-center gap-2 font-mono2 text-xs text-zinc-400">
              <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/5">
                {stores.length} Stores Total
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                {stores.filter((s) => s.store_enabled !== false).length} Enabled
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-300 border border-brand-500/20">
                {stores.reduce((acc, s) => acc + (s.items?.length || 0), 0)} Products
              </span>
            </div>
          </div>

          {storesLoading ? (
            <div className="p-12 text-center rounded-2xl glass">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-400 mb-2" />
              <p className="text-xs text-zinc-400">Loading creator stores &amp; products...</p>
            </div>
          ) : stores.length === 0 ? (
            <div className="p-12 text-center rounded-2xl glass text-zinc-500 space-y-2">
              <Store className="w-8 h-8 mx-auto text-zinc-600" />
              <div className="text-sm font-semibold text-zinc-300">No stores found</div>
              <p className="text-xs text-zinc-500">No member accounts currently have active storefront items.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stores
                .filter((s) => {
                  if (!storeSearch) return true;
                  const q = storeSearch.toLowerCase();
                  return (
                    s.username?.toLowerCase().includes(q) ||
                    s.display_name?.toLowerCase().includes(q) ||
                    (s.items || []).some((it) => it.title?.toLowerCase().includes(q) || it.description?.toLowerCase().includes(q))
                  );
                })
                .map((s) => {
                  const isExpanded = expandedStoreId === s.user_id;
                  const itemCount = s.items?.length || 0;
                  return (
                    <div key={s.user_id} className="glass rounded-2xl p-4 sm:p-5 transition hover:border-white/20">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-zinc-800 text-sm font-bold text-zinc-300 ring-1 ring-white/10">
                            {(s.display_name || s.username || "?")[0]?.toUpperCase()}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">
                                {s.display_name}
                              </span>
                              <span className="font-mono2 text-xs text-zinc-500">
                                @{s.username}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono2 font-bold uppercase bg-brand-500/10 text-brand-300 border border-brand-500/20">
                                {s.tier || "user"}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                              <span className="font-mono2 text-[11px]">
                                {itemCount} product{itemCount !== 1 ? "s" : ""}
                              </span>
                              <span>•</span>
                              <a
                                href={`/tourn.lol/${s.username}/shop`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-brand-300 hover:underline flex items-center gap-1 font-mono2 text-[11px]"
                              >
                                <ExternalLink className="w-3 h-3" /> View Public Storefront
                              </a>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleStore(s.user_id, s.store_enabled)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                              s.store_enabled
                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                                : "border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${s.store_enabled ? "bg-emerald-400" : "bg-rose-400"}`} />
                            {s.store_enabled ? "Store Enabled" : "Store Disabled"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setExpandedStoreId(isExpanded ? null : s.user_id)}
                            className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Products ({itemCount})</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Products list */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                          {itemCount === 0 ? (
                            <p className="text-xs text-zinc-500 italic">No products listed by this user yet.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {s.items.map((prod) => (
                                <div key={prod.id} className="rounded-xl border border-white/10 bg-black/40 p-3.5 flex flex-col justify-between space-y-3">
                                  <div className="space-y-1.5">
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="font-bold text-xs text-white line-clamp-1">{prod.title}</span>
                                      <span className="font-mono2 font-extrabold text-xs text-brand-300 shrink-0">
                                        {prod.price || "Free"}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                                      {prod.description || "No description provided."}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[10px] font-mono2 text-zinc-500">
                                      <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                                        {prod.category || "General"}
                                      </span>
                                      {prod.tag && (
                                        <span className="px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-300">
                                          {prod.tag}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-white/5 flex items-center justify-end">
                                    <button
                                      type="button"
                                      onClick={() => deleteProduct(s.user_id, prod.id, prod.title)}
                                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" /> Remove Product
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {activeTab === "chats" && (
        <div className="space-y-4" data-testid="chats-overcheck">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {["all", "open", "replied", "closed", "spam"].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setChatFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
                    chatFilter === filter
                      ? "bg-brand-500/25 text-brand-200 border border-brand-500/40"
                      : "bg-white/[0.04] text-zinc-400 hover:text-white border border-white/5"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono2 text-xs text-zinc-400">
                {chats.length} Inquir{chats.length !== 1 ? "ies" : "y"} Logged
              </span>
              <button
                type="button"
                onClick={fetchChats}
                disabled={chatsLoading}
                className="p-2 rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 hover:text-white transition cursor-pointer"
                title="Refresh chats"
              >
                <RefreshCw className={`w-4 h-4 ${chatsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {chatsLoading ? (
            <div className="p-12 text-center rounded-2xl glass">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-400 mb-2" />
              <p className="text-xs text-zinc-400">Loading buyer inquiries &amp; order chats...</p>
            </div>
          ) : chats.length === 0 ? (
            <div className="p-12 text-center rounded-2xl glass text-zinc-500 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-zinc-600" />
              <div className="text-sm font-semibold text-zinc-300">No buyer messages found</div>
              <p className="text-xs text-zinc-500">When visitors send inquiries on creator storefronts, they will show up here for moderation.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chats
                .filter((c) => chatFilter === "all" || c.status === chatFilter)
                .map((chat) => (
                  <div key={chat.id} className="glass rounded-2xl p-4 sm:p-5 space-y-3 transition hover:border-white/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs sm:text-sm">
                              {chat.buyer_name}
                            </span>
                            {chat.buyer_contact && (
                              <span className="font-mono2 text-[11px] text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/5">
                                {chat.buyer_contact}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">
                            Inquired to store: <strong className="text-zinc-300">@{chat.creator_username || "creator"}</strong>
                            {chat.product_title && (
                              <span> • Product: <strong className="text-brand-300">{chat.product_title}</strong></span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono2 uppercase font-bold border ${
                          chat.status === "open"
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                            : chat.status === "replied"
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                            : chat.status === "spam"
                            ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
                            : "bg-zinc-700/30 text-zinc-400 border-zinc-700/50"
                        }`}>
                          {chat.status || "open"}
                        </span>
                        <span className="font-mono2 text-[10px] text-zinc-500">
                          {new Date(chat.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-300 leading-relaxed font-sans">
                      {chat.message}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 text-xs">
                      <span className="text-[10px] text-zinc-500 font-mono2 mr-auto">Change status:</span>
                      {["open", "replied", "closed", "spam"].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => updateChatStatus(chat.id, st)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition cursor-pointer ${
                            chat.status === st
                              ? "bg-white/20 text-white font-bold"
                              : "bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div data-testid="user-edit-modal" className="glass-strong rounded-3xl p-5 sm:p-8 max-w-xl w-full space-y-5 my-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-zinc-100">
                  Edit @{editingUser.username}
                </h2>
                <div className="mt-2 flex items-center gap-2">
                  <RoleBadge user={editingUser} size="lg" />
                  {editingUser.discord_linked && editingUser.member && editingUser.discord_username && (
                    // Same identity format the table column uses.
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-200">
                      <FaDiscordIcon className="h-3.5 w-3.5" /> {editingUser.discord_username} <span className="font-mono2 text-xs text-zinc-500">(@{editingUser.username})</span>
                    </span>
                  )}
                </div>
                {/* Timed premium (invite or view-reward trial) with its own expiry chip. */}
                {editingUser.premium_until && (
                  <span className="inline-flex items-center rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-xs font-semibold text-brand-200">
                    <Crown className="mr-1.5 h-3.5 w-3.5" /> Trial ends {new Date(editingUser.premium_until).toLocaleDateString()}
                  </span>
                )}
              </div>
              <button onClick={() => setEditingUser(null)} className="text-zinc-500 hover:text-zinc-200" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Role assignment — a clear, described picker instead of a bare select */}
            {isOwner ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Assigned role</div>
                  <span className="font-mono2 text-[10px] text-zinc-500">what this account can do</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {ROLES.map((r) => {
                    const active = editingUser.role === r.id && !editingUser.is_owner;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setEditingUser({ ...editingUser, role: r.id, is_owner: false })}
                        className={`text-left rounded-xl border p-3 transition ${active ? "border-brand-500/50 bg-brand-500/15" : "border-white/10 hover:bg-white/[0.04]"}`}
                      >
                        <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: r.tint }}>
                          <r.Icon className="w-4 h-4" /> {r.label}
                          {active && <Check className="w-3.5 h-3.5 ml-auto" />}
                        </div>
                        <div className="mt-1 text-[11px] leading-snug text-zinc-500">{r.description}</div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  aria-pressed={!!editingUser.is_owner}
                  onClick={() => setEditingUser({ ...editingUser, is_owner: !editingUser.is_owner })}
                  className={`w-full flex items-center justify-between rounded-xl border p-3 transition ${editingUser.is_owner ? "border-amber-400/50 bg-amber-400/10" : "border-white/10 hover:bg-white/[0.04]"}`}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: OWNER_TINT }}>
                    <Crown className="w-4 h-4" /> Owner
                  </span>
                  <span className={`text-[11px] font-mono2 ${editingUser.is_owner ? "text-amber-300" : "text-zinc-500"}`}>
                    {editingUser.is_owner ? "enabled" : "disabled"}
                  </span>
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-zinc-400 flex items-center justify-between">
                <span>Account Role: <strong className="text-zinc-200 capitalize">{editingUser.is_owner ? "Owner" : (editingUser.role || "user")}</strong></span>
                <span className="text-[11px] text-zinc-500">Only the owner can reassign roles or tiers</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isOwner ? (
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Account Tier</label>
                  <SmartSelect
                    testid="user-tier-select"
                    ariaLabel="Account tier"
                    value={editingUser.tier}
                    onChange={(tier) => setEditingUser({ ...editingUser, tier })}
                    options={[
                      { value: "free", label: "Free" },
                      { value: "premium", label: "Premium" },
                      { value: "admin", label: "Admin" },
                    ]}
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Account Tier</label>
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm text-zinc-200 capitalize">
                    {editingUser.tier || "free"}
                  </div>
                </div>
              )}

              {isOwner && (
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Username (admin override)</label>
                  <input
                    data-testid="user-username-input"
                    value={editingUser.username || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2 text-sm font-mono2 text-zinc-100 outline-none focus:border-brand-500/50 transition"
                  />
                  <p className="mt-1 text-[10px] text-zinc-500">tourn.lol/{editingUser.username} — saved only if free</p>
                </div>
              )}

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Current views</label>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <Eye className="w-4 h-4 text-brand-400" />
                  <span className="font-mono2 text-sm text-zinc-200">{(editingUser.views || 0).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Entry Screen PIN</label>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span className="font-mono2 text-sm text-zinc-200" data-testid="modal-entry-pin">
                    {editingUser.entry_pin || editingUser.profile?.entry_text || "None (Open)"}
                  </span>
                  {(editingUser.entry_pin || editingUser.profile?.entry_text) && (
                    <span className="ml-auto text-[10px] uppercase font-mono2 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {editingUser.entry_style || editingUser.profile?.entry_style || "pin"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* View changer (Owner only) */}
            {isOwner && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> View changer
                  </div>
                  <span className="font-mono2 text-[10px] text-zinc-500">
                    views are otherwise counted on real visits only
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={viewsDraft}
                    onChange={(e) => setViewsDraft(e.target.value)}
                    placeholder="0"
                    className="w-32 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-100 outline-none transition-colors duration-200 focus:border-brand-500/50"
                  />
                  <button
                    type="button"
                    disabled={viewsBusy !== null}
                    onClick={() => changeViews("set")}
                    className="px-3.5 py-2 rounded-xl bg-brand-500/20 border border-brand-500/40 text-brand-200 text-xs font-semibold hover:bg-brand-500/30 transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {viewsBusy === "set" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Equal className="w-3.5 h-3.5" />} Set
                  </button>
                  <button
                    type="button"
                    disabled={viewsBusy !== null}
                    onClick={() => changeViews("add")}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs font-semibold hover:bg-emerald-500/25 transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {viewsBusy === "add" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add
                  </button>
                  <button
                    type="button"
                    disabled={viewsBusy !== null}
                    onClick={() => changeViews("reset")}
                    className="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {viewsBusy === "reset" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />} Reset
                  </button>
                </div>
              </div>
            )}

            {/* Profile & Store Management (Admin Direct Edit) */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <UserRound className="w-3.5 h-3.5 text-brand-400" /> Profile &amp; Store Management
                </div>
                <span className="font-mono2 text-[10px] text-zinc-500">direct admin edit</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1">Display Name</label>
                  <input
                    type="text"
                    value={editingUser.display_name || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, display_name: e.target.value })}
                    placeholder="User's display name"
                    className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-zinc-100 outline-none focus:border-brand-500/50"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Secondary Alias</label>
                  <input
                    type="text"
                    value={editingUser.secondary_alias || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, secondary_alias: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })}
                    placeholder="e.g. alias2 (tourn.lol/alias2)"
                    className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-zinc-100 font-mono2 outline-none focus:border-brand-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1">Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingUser.accent_color || "#7c3aed"}
                      onChange={(e) => setEditingUser({ ...editingUser, accent_color: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={editingUser.accent_color || "#7c3aed"}
                      onChange={(e) => setEditingUser({ ...editingUser, accent_color: e.target.value })}
                      className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-zinc-100 font-mono2 outline-none focus:border-brand-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Creator Storefront Access</label>
                  <button
                    type="button"
                    onClick={() => setEditingUser({ ...editingUser, store_enabled: !editingUser.store_enabled })}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition ${
                      editingUser.store_enabled
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-zinc-700 bg-white/[0.02] text-zinc-400"
                    }`}
                  >
                    <span>{editingUser.store_enabled ? "Store Enabled" : "Store Disabled"}</span>
                    <span className="text-[10px] font-mono2 uppercase px-1.5 py-0.5 rounded bg-black/40">
                      {editingUser.store_enabled ? "Active" : "Locked"}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 text-xs">Bio / About Me</label>
                <textarea
                  rows={2}
                  value={editingUser.bio || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })}
                  placeholder="User bio..."
                  className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-brand-500/50 resize-none"
                />
              </div>

              <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
                <a
                  href={`/tourn.lol/${editingUser.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-300 hover:underline flex items-center gap-1 font-mono2 text-[11px]"
                >
                  <ExternalLink className="w-3 h-3" /> View Public Profile
                </a>
                <a
                  href={`/tourn.lol/${editingUser.username}/shop`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-300 hover:underline flex items-center gap-1 font-mono2 text-[11px]"
                >
                  <ExternalLink className="w-3 h-3" /> View Creator Store
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-2 font-semibold">Granted Badges (Platform &amp; Staff)</label>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                  {BADGE_CATALOG.filter((b) => !b.id.startsWith("rank_")).map((b) => {
                    const active = (editingUser.badges || []).includes(b.id);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() =>
                          setEditingUser({
                            ...editingUser,
                            badges: (editingUser.badges || []).includes(b.id)
                              ? (editingUser.badges || []).filter((x) => x !== b.id)
                              : [...(editingUser.badges || []), b.id],
                          })
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                          active
                            ? "bg-brand-500/25 text-brand-200 border border-brand-500/40"
                            : "bg-white/5 text-zinc-500 border border-transparent hover:text-zinc-300"
                        }`}
                      >
                        <BadgeChip id={b.id} size="sm" />
                        {active && <Check className="w-3 h-3 text-brand-400" />} {b.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-zinc-400 block font-semibold">Ranked Tier Badges (Assign / Elevate Rank)</label>
                  <span className="font-mono2 text-[10px] text-zinc-500">Admins &amp; Owner can grant</span>
                </div>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                  {BADGE_CATALOG.filter((b) => b.id.startsWith("rank_")).map((b) => {
                    const active = (editingUser.badges || []).includes(b.id);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          const current = editingUser.badges || [];
                          if (current.includes(b.id)) {
                            setEditingUser({
                              ...editingUser,
                              badges: current.filter((x) => x !== b.id),
                            });
                          } else {
                            // Replace other rank badges and set this peak rank badge
                            const cleaned = current.filter((x) => !x.startsWith("rank_"));
                            setEditingUser({
                              ...editingUser,
                              badges: [...cleaned, b.id],
                            });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                          active
                            ? "bg-amber-500/25 text-amber-200 border border-amber-500/40 shadow-sm"
                            : "bg-white/5 text-zinc-500 border border-transparent hover:text-zinc-300"
                        }`}
                      >
                        <BadgeChip id={b.id} size="sm" />
                        {active && <Check className="w-3 h-3 text-amber-400" />} {b.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl text-sm text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => saveUser(editingUser)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-semibold hover:brightness-110 transition flex items-center gap-2"
              >
                {busy && <Loader2 className="w-4 w-4 animate-spin" />} Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
