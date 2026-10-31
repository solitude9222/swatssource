import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "./supabase";
import { loadIsPremium } from "./premium";

export type Account = {
  id: string;
  username: string;
  alias?: string | null;
  /** Premium second claim — shown as swats.bio/<alias2>. */
  alias2?: string | null;
  email: string | null;
  avatarUrl: string | null;
  joinedAt: string;
  /** Granted by an admin (profiles.premium) — re-exports auth.tsx consumers. */
  premium?: boolean;
  /** True when the profiles row is flaged is_admin OR the owner env matches. */
  isAdmin?: boolean;
};

type AuthResult = { error?: string; needsConfirmation?: boolean };

/** Handles that resolve to app pages and can never be claimed. */
export const RESERVED_HANDLES = new Set([
  "admin",
  "about",
  "shop",
  "leaderboard",
  "dashboard",
  "profile",
  "demo",
  "login",
  "signin",
  "signup",
  "help",
  "support",
  "api",
]);

export function normalizeHandle(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

/**
 * Stable numeric UID shown on the profile card ("UID#1").
 * Every account gets a deterministic number derived from its id, so the same
 * account always shows the same UID.
 */
export function accountUid(accountId: string | undefined | null): number {
  if (!accountId) return 1;
  let hash = 5381;
  for (let index = 0; index < accountId.length; index += 1) {
    hash = ((hash * 33) ^ accountId.charCodeAt(index)) >>> 0;
  }
  return (hash % 999_999) + 1;
}

type AuthValue = {
  user: Account | null;
  first: Account | null;
  isOwner: boolean;
  isAdmin: boolean;
  isPremiumUser: boolean;
  /** Trait aliases (primary claim). Owner can set it; all accounts can claim. */
  setAlias: (alias: string) => Promise<AuthResult>;
  /** Second alias (swats.bio claim) — premium only. */
  setAlias2: (alias2: string | null) => Promise<AuthResult>;
  security: {
    changePassword: (input: { currentPassword: string; newPassword: string }) => Promise<AuthResult>;
    changeEmail: (email: string) => Promise<AuthResult>;
    /** Kills every other signed-in device; the current one stays. */
    signOutOthers: () => Promise<AuthResult>;
    mfaFactors: () => Promise<{ factors: { id: string; createdAt: string }[]; error?: string }>;
    mfaEnroll: () => Promise<{ factorId: string; qr: string; secret: string; error?: string }>;
    mfaVerify: (factorId: string, code: string) => Promise<AuthResult>;
    mfaUnenroll: (factorId: string) => Promise<AuthResult>;
  };
  loading: boolean;
  configured: boolean;
  /** Email + password sign-in for accounts that added a password. */
  signIn: (input: { email: string; password: string }) => Promise<AuthResult>;
  /** Discord OAuth — the ONLY way to create an account. */
  signInWithDiscord: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

function fromSession(session: Session | null): Account | null {
  const user = session?.user;
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const username =
    String(meta.username ?? meta.user_name ?? meta.preferred_username ?? user.email?.split("@")[0] ?? "player");
  const avatar =
    typeof meta.avatar_url === "string" ? meta.avatar_url : typeof meta.picture === "string" ? meta.picture : null;
  return {
    id: user.id,
    username,
    email: user.email ?? null,
    avatarUrl: avatar,
    joinedAt: user.created_at ?? new Date().toISOString(),
  };
}

/** Owner is the account whose email matches VITE_OWNER_EMAIL in .env. */
export function isOwnerEmail(email: string | null): boolean {
  const owner = (import.meta.env.VITE_OWNER_EMAIL as string | undefined)?.trim().toLowerCase();
  return Boolean(owner && email && email.trim().toLowerCase() === owner);
}

async function syncProfile(session: Session): Promise<void> {
  const profile = fromSession(session);
  if (!profile || !supabase) return;
  try {
    await supabase.from("profiles").upsert(
      {
        id: profile.id,
        username: profile.username,
        avatar_url: profile.avatarUrl,
        is_owner: isOwnerEmail(profile.email),
      },
      { onConflict: "id" },
    );
  } catch {
    /* the profiles table may not exist yet; auth still works */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Account | null>(null);
  const [first, setFirst] = useState<Account | null>(null);
  const [alias, setAliasState] = useState<string | null>(null);
  const [alias2, setAlias2State] = useState<string | null>(null);
  const [ownPremium, setOwnPremium] = useState(false);
  const [ownAdmin, setOwnAdmin] = useState(false);
  const [loading, setLoading] = useState(supabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(fromSession(data.session));
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(fromSession(session));
      if (event === "SIGNED_IN" && session) void syncProfile(session);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const refreshFirst = useCallback(async () => {
    if (!supabase) {
      setFirst(null);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, alias, avatar_url, created_at")
      .eq("is_owner", true)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setFirst({
        id: String(data.id),
        username: String(data.username),
        alias: data.alias ? String(data.alias) : null,
        email: null,
        avatarUrl: data.avatar_url ? String(data.avatar_url) : null,
        joinedAt: String(data.created_at),
      });
    } else {
      setFirst(null);
    }
  }, []);

  useEffect(() => {
    void refreshFirst();
  }, [refreshFirst, user]);

  // Load the signed-in user's own profile row: aliases, premium grant and
  // the admin flag, all kept in single-row state.
  useEffect(() => {
    if (!supabase) return;
    if (!user?.id) {
      setAliasState(null);
      setAlias2State(null);
      setOwnPremium(false);
      setOwnAdmin(false);
      return;
    }
    let active = true;
    void supabase
      .from("profiles")
      .select("alias, alias2, premium, is_admin")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setAliasState(data?.alias ? String(data.alias) : null);
        setAlias2State(data?.alias2 ? String(data.alias2) : null);
        setOwnPremium(Boolean(data?.premium));
        setOwnAdmin(Boolean(data?.is_admin));
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const signIn = useCallback<AuthValue["signIn"]>(async ({ email, password }) => {
    if (!supabase) {
      return {
        error:
          "Sign-in isn't wired up yet — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env, then restart the dev server.",
      };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    setUser(fromSession(data.session));
    return {};
  }, []);

  const signInWithDiscord = useCallback<AuthValue["signInWithDiscord"]>(async () => {
    if (!supabase) {
      return {
        error:
          "Discord sign-up isn't wired up yet — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env, then restart the dev server.",
      };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: window.location.origin },
    });
    return error ? { error: error.message } : {};
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  }, []);

  const setAlias = useCallback<AuthValue["setAlias"]>(
    async (alias) => {
      if (!supabase) return { error: "Claims need Supabase — add the keys to .env first." };
      if (!user) return { error: "Sign in to claim an alias." };
      const clean = normalizeHandle(alias);
      if (clean.length > 24) return { error: "Aliases must be 24 characters or fewer." };
      if (clean.length < 3) return { error: "Aliases need at least 3 characters." };
      if (RESERVED_HANDLES.has(clean)) {
        return { error: `"${clean}" is reserved by the site.` };
      }

      // First free claim, any account. Uniqueness is checked against the
      // handle, both alias columns and the premium second-claim column.
      const { data: taken, error: takenError } = await supabase
        .from("profiles")
        .select("username, alias, alias2")
        .or(`username.eq.${clean},alias.eq.${clean},alias2.eq.${clean}`)
        .neq("id", user.id)
        .limit(1)
        .maybeSingle();
      if (!takenError && taken) {
        return { error: `@${clean} is already claimed — try another.` };
      }
      const { error } = await supabase.from("profiles").update({ alias: clean || null }).eq("id", user.id);
      if (!error) {
        setAliasState(clean || null);
        void refreshFirst();
      }
      return error ? { error: error.message } : {};
    },
    [user, refreshFirst],
  );

  const setAlias2 = useCallback<AuthValue["setAlias2"]>(
    async (input) => {
      if (!supabase) return { error: "Claims need Supabase — add the keys to .env first." };
      if (!user) return { error: "Sign in to claim an alias." };
      const clean = input ? normalizeHandle(input) : "";
      if (!clean) {
        // Clearing is always allowed.
        setAlias2State(null);
        const { error } = await supabase.from("profiles").update({ alias2: null }).eq("id", user.id);
        return error ? { error: error.message } : {};
      }
      if (clean.length < 3) return { error: "Aliases need at least 3 characters." };
      if (clean.length > 24) return { error: "Aliases must be 24 characters or fewer." };
      if (RESERVED_HANDLES.has(clean) || clean === user.username) {
        return { error: `"${clean}" is already taken.` };
      }
      // Premium check uses the freshest state at write time because an admin
      // grant may land while this account is signed in.
      const premiumOk = Boolean(user.premium) || loadIsPremium(user.id);
      if (!premiumOk) return { error: "A second alias is part of Premium." };

      const { data: taken, error: takenError } = await supabase
        .from("profiles")
        .select("username, alias, alias2")
        .or(`username.eq.${clean},alias.eq.${clean},alias2.eq.${clean}`)
        .neq("id", user.id)
        .limit(1)
        .maybeSingle();
      if (!takenError && taken) {
        return { error: `@${clean} is already claimed — try another.` };
      }
      const { error } = await supabase.from("profiles").update({ alias2: clean }).eq("id", user.id);
      if (!error) setAlias2State(clean);
      return error ? { error: error.message } : {};
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user],
  );

  const changePassword = useCallback<AuthValue["security"]["changePassword"]>(
    async ({ currentPassword, newPassword }) => {
      if (!supabase || !user) return { error: "Sign in to manage your password." };
      if (newPassword.length < 8) return { error: "Use a password with at least 8 characters." };

      // Accounts that already sign in with email + password must confirm the
      // current one first. Discord-only accounts (no password yet) can set
      // one directly — leave the current-password field empty.
      if (currentPassword) {
        if (!user.email) return { error: "This account signs in with Discord." };
        const { error: reauth } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });
        if (reauth) return { error: "Your current password is incorrect." };
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return error ? { error: error.message } : {};
    },
    [user],
  );

  const changeEmail = useCallback<AuthValue["security"]["changeEmail"]>(
    async (email) => {
      if (!supabase || !user) return { error: "Sign in to change your email." };
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter a valid email address." };
      const { error } = await supabase.auth.updateUser({ email });
      // Supabase emails the new address for a confirmation click before the
      // change actually lands.
      return error ? { error: error.message } : { needsConfirmation: true };
    },
    [user],
  );

  const signOutOthers = useCallback<AuthValue["security"]["signOutOthers"]>(async () => {
    if (!supabase) return { error: "Sign-in isn't configured yet." };
    const { error } = await supabase.auth.signOut({ scope: "others" });
    return error ? { error: error.message } : {};
  }, []);

  const mfaFactors = useCallback<AuthValue["security"]["mfaFactors"]>(async () => {
    if (!supabase) return { factors: [], error: "Sign-in isn't configured yet." };
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) return { factors: [], error: error.message };
    return {
      factors: data.totp.map((factor) => ({ id: factor.id, createdAt: factor.created_at })),
    };
  }, []);

  const mfaEnroll = useCallback<AuthValue["security"]["mfaEnroll"]>(async () => {
    if (!supabase) return { factorId: "", qr: "", secret: "", error: "Sign-in isn't configured yet." };
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "tourn.lol" });
    if (error) return { factorId: "", qr: "", secret: "", error: error.message };
    return {
      factorId: data.id,
      qr: data.totp.qr_code,
      secret: data.totp.secret,
    };
  }, []);

  const mfaVerify = useCallback<AuthValue["security"]["mfaVerify"]>(
    async (factorId, code) => {
      if (!supabase) return { error: "Sign-in isn't configured yet." };
      const { data, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) return { error: challengeError.message };
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: data.id,
        code: code.trim(),
      });
      return error ? { error: error.message } : {};
    },
    [],
  );

  const mfaUnenroll = useCallback<AuthValue["security"]["mfaUnenroll"]>(
    async (factorId) => {
      if (!supabase) return { error: "Sign-in isn't configured yet." };
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      return error ? { error: error.message } : {};
    },
    [],
  );

  const isOwner = isOwnerEmail(user?.email ?? null);
  const isPremiumUser = user ? ownPremium || loadIsPremium(user.id) : false;
  const isAdmin = isOwner || ownAdmin;

  const accountWithProfile = useMemo<Account | null>(
    () =>
      user
        ? { ...user, alias, alias2, premium: isPremiumUser, isAdmin: isOwner || ownAdmin }
        : null,
    [user, alias, alias2, isPremiumUser, isOwner, ownAdmin],
  );

  const security = useMemo<AuthValue["security"]>(
    () => ({ changePassword, changeEmail, signOutOthers, mfaFactors, mfaEnroll, mfaVerify, mfaUnenroll }),
    [changePassword, changeEmail, signOutOthers, mfaFactors, mfaEnroll, mfaVerify, mfaUnenroll],
  );

  const value = useMemo<AuthValue>(
    () => ({
      user: accountWithProfile,
      first,
      isOwner,
      isAdmin,
      isPremiumUser,
      setAlias,
      setAlias2,
      security,
      loading,
      configured: supabaseConfigured,
      signIn,
      signInWithDiscord,
      signOut,
    }),
    [
      accountWithProfile,
      first,
      isOwner,
      isAdmin,
      isPremiumUser,
      setAlias,
      setAlias2,
      security,
      loading,
      signIn,
      signInWithDiscord,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}
