import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { getSiteStats, type SiteStats } from "../lib/siteStats";
import { api } from "../lib/backend";
import { formatJoined } from "../lib/format";
import {
  ArrowUpRight,
  BoltIcon,
  CheckIcon,
  CodeIcon,
  LinkIcon,
  LogoutIcon,
  SearchIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
} from "./Icons";
import { profileHref } from "../lib/router";

type AdminProfile = {
  id: string;
  username: string;
  alias: string | null;
  alias2: string | null;
  avatar_url: string | null;
  premium: boolean;
  is_admin: boolean;
  created_at: string;
};

export function AdminDashboard() {
  const { user, isOwner, isAdmin, isPremiumUser, security, signOut } = useAuth();
  const [rows, setRows] = useState<AdminProfile[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [stats, setStats] = useState<SiteStats>({ users: null, views: null });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await api<{ profiles: AdminProfile[] }>("/api/admin/profiles");
    if (!result.ok) {
      setLoadError(
        result.error === "Admins only."
          ? "Your account isn't an admin on the backend, so there's no directory to manage."
          : result.error,
      );
      setRows([]);
      return;
    }
    setLoadError(null);
    setRows(result.data.profiles);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void getSiteStats().then(setStats);
  }, []);

  // Every admin action is checked server-side (requireAdmin on the backend)
  // — the UI hiding it is never the gate.
  const patch = async (id: string, fields: Partial<AdminProfile>) => {
    setBusyId(id);
    setMsg(null);
    const result = await api<{ profile: AdminProfile }>(`/api/admin/profiles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(fields),
    });
    setBusyId(null);
    if (!result.ok) setMsg(result.error);
    else void load();
  };

  if (!isAdmin) {
    return (
      <main className="adm adm--gate">
        <div className="adm-gate" data-reveal>
          <span className="adm-gate-icon" aria-hidden="true">
            <ShieldIcon size={22} />
          </span>
          <span className="eyebrow eyebrow--sm">restricted</span>
          <h1>Admins only.</h1>
          <p>
            This area checks your account against the directory's admin list on every load — the
            server rejects any write from an account that isn't one, not just the UI.
          </p>
          <a className="btn btn-ghost btn-sm" href="#/dashboard">
            Back to your dashboard
          </a>
        </div>
      </main>
    );
  }

  const filtered = (rows ?? []).filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      row.username.toLowerCase().includes(q) ||
      (row.alias ?? "").toLowerCase().includes(q) ||
      (row.alias2 ?? "").toLowerCase().includes(q)
    );
  });
  const premiumCount = (rows ?? []).filter((row) => row.premium).length;
  const adminCount = (rows ?? []).filter((row) => row.is_admin).length;

  return (
    <main className="adm">
      <header className="adm-top">
        <div>
          <span className="eyebrow eyebrow--sm">
            <ShieldIcon size={11} />
            admin console
          </span>
          <h1>Directory control</h1>
          <p>
            Signed in as <b>{user?.email ?? user?.username}</b>
            {isOwner ? " (owner)" : ""} · session <code>{user?.id.slice(0, 8)}…</code> at{" "}
            {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className="adm-top-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => void security.signOutOthers()}
            title="Sign out every device except this one"
          >
            <LogoutIcon size={13} />
            Kill other sessions
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void load()}>
            Refresh
          </button>
          <a className="btn btn-ghost btn-sm" href="#/dashboard">
            Dashboard
          </a>
        </div>
      </header>

      <section className="adm-stats">
        <article className="adm-stat">
          <span className="adm-stat-label">Accounts</span>
          <b className="adm-stat-value">{stats.users ?? "—"}</b>
          <small>from the public stats function</small>
        </article>
        <article className="adm-stat">
          <span className="adm-stat-label">Total profile views</span>
          <b className="adm-stat-value">{stats.views?.toLocaleString() ?? "—"}</b>
          <small>all handles, since launch</small>
        </article>
        <article className="adm-stat">
          <span className="adm-stat-label">Premium grants</span>
          <b className="adm-stat-value">{premiumCount}</b>
          <small>rows with premium = true</small>
        </article>
        <article className="adm-stat">
          <span className="adm-stat-label">Admins</span>
          <b className="adm-stat-value">{adminCount}</b>
          <small>rows with is_admin = true</small>
        </article>
      </section>

      {msg ? <p className="adm-msg">{msg}</p> : null}
      {loadError ? <p className="adm-msg">{loadError}</p> : null}

      <section className="adm-panel">
        <div className="adm-panel-head">
          <h2>
            <UsersIcon size={14} />
            Members
          </h2>
          <label className="adm-search">
            <SearchIcon size={13} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search handle or alias…"
              spellCheck={false}
            />
          </label>
        </div>

        {rows === null ? (
          <p className="adm-empty">Loading directory…</p>
        ) : filtered.length === 0 ? (
          <p className="adm-empty">No accounts match.</p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Claims</th>
                  <th>Joined</th>
                  <th>Premium</th>
                  <th>Admin</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className={busyId === row.id ? "is-busy" : undefined}>
                    <td>
                      <span className="adm-user-cell">
                        {row.avatar_url ? (
                          <img src={row.avatar_url} alt="" width={22} height={22} />
                        ) : (
                          <span className="adm-user-initial">{row.username.slice(0, 1).toUpperCase()}</span>
                        )}
                        <span>
                          <b>@{row.username}</b>
                          {row.id === user?.id ? <small>you</small> : null}
                        </span>
                      </span>
                    </td>
                    <td>
                      <span className="adm-claim">
                        tourn.lol/<b>{row.alias?.trim() || row.username}</b>
                      </span>
                      <span className={`adm-claim${row.alias2 ? "" : " adm-claim--unset"}`}>
                        swats.bio/<b>{row.alias2 || "—"}</b>
                      </span>
                    </td>
                    <td>{formatJoined(new Date(row.created_at))}</td>
                    <td>
                      <button
                        type="button"
                        className={`adm-toggle${row.premium ? " is-on" : ""}`}
                        onClick={() => void patch(row.id, { premium: !row.premium })}
                        disabled={busyId === row.id}
                        aria-label={row.premium ? "Revoke premium" : "Grant premium"}
                      >
                        <BoltIcon size={12} />
                        {row.premium ? "active" : "off"}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`adm-toggle adm-toggle--admin${row.is_admin ? " is-on" : ""}`}
                        onClick={() => void patch(row.id, { is_admin: !row.is_admin })}
                        disabled={busyId === row.id || row.id === user?.id}
                        title={row.id === user?.id ? "You can't demote yourself" : undefined}
                      >
                        <ShieldIcon size={12} />
                        {row.is_admin ? "admin" : "off"}
                      </button>
                    </td>
                    <td>
                      <a className="adm-open" href={profileHref(row.alias?.trim() || row.username)}>
                        <LinkIcon size={12} />
                        open
                        <ArrowUpRight size={10} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="adm-panel adm-panel--notes">
        <h2>
          <CodeIcon size={14} />
          How the security works
        </h2>
        <ul className="adm-notes">
          <li>
            <CheckIcon size={12} /> Every write is checked server-side — the backend rejects
            premium/admin changes from any account that isn't an admin, even with the console
            open.
          </li>
          <li>
            <CheckIcon size={12} /> The admin <em>flag</em> lives in the same directory this page
            lists, so the state you see is the live permission set, not an env copy.
          </li>
          <li>
            <CheckIcon size={12} /> "Kill other sessions" bumps the account's token version; every
            other device's cookie dies immediately.
          </li>
          <li>
            <CheckIcon size={12} /> Two-factor (TOTP) enrollment lives in Settings → Security and
            gates security-sensitive changes{isPremiumUser || isOwner ? "" : " — admins are encouraged to turn it on"}.
          </li>
          <li>
            <CheckIcon size={12} /> Self-protection: you can't remove your own admin flag; owner
            status comes back from the VITE_OWNER_EMAIL check.
          </li>
        </ul>
      </section>

      <footer className="adm-foot">
        <a className="adm-signout" href="#/" onClick={() => void signOut()}>
          <LogoutIcon size={12} />
          Sign out of this device
        </a>
      </footer>
    </main>
  );
}
