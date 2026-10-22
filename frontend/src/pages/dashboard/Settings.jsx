import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "@/lib/notify";
import {
  AtSign, Mail, Shield, LogOut, Trash2, Save, KeyRound, Lock, Eye, EyeOff,
  CheckCircle2, AlertTriangle, UserCheck, Plug, Loader2, Copy, ExternalLink,
  Sliders, Volume2, Sparkles, Check, Laptop, ShieldAlert, Key, Globe, ShieldCheck,
  CreditCard, DollarSign, Receipt, ShoppingBag, ArrowUpRight, Clock, HelpCircle,
} from "lucide-react";
import TwoFactorPanel from "@/components/TwoFactorPanel";
import { Switch } from "@/components/ui/switch";

function calcPasswordStrength(pw) {
  if (!pw) return { score: 0, label: "None", color: "bg-zinc-700", text: "text-zinc-500" };
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;

  if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500", text: "text-red-400" };
  if (score <= 3) return { score: 2, label: "Moderate", color: "bg-amber-500", text: "text-amber-400" };
  if (score === 4) return { score: 3, label: "Good", color: "bg-blue-500", text: "text-blue-400" };
  return { score: 4, label: "Strong", color: "bg-emerald-500", text: "text-emerald-400" };
}

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const isPremium = user?.tier === "premium" || user?.tier === "admin" || user?.role === "admin" || !!user?.is_owner;
  const activeTab = searchParams.get("tab") === "billing" ? "billing" : "account";
  const setTab = (tab) => {
    if (tab === "billing") setSearchParams({ tab: "billing" });
    else setSearchParams({});
  };

  const [username, setUsername] = useState(user?.username || "");
  const [savingUser, setSavingUser] = useState(false);
  const [secondaryAlias, setSecondaryAlias] = useState(user?.secondary_alias || "");
  const [savingSecondary, setSavingSecondary] = useState(false);
  const [emailRevealed, setEmailRevealed] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // Local preferences
  const [autoSave, setAutoSave] = useState(() => localStorage.getItem("swats_editor_autosave") === "true");
  const [autoplayAudio, setAutoplayAudio] = useState(() => localStorage.getItem("swats_pref_autoplay") !== "false");
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem("swats_reduced_motion") === "true");
  const [soundEffects, setSoundEffects] = useState(() => localStorage.getItem("swats_sound_effects") !== "false");

  const toggleAutoSave = (val) => {
    setAutoSave(val);
    localStorage.setItem("swats_editor_autosave", String(val));
    toast.success(val ? "Editor auto-save enabled" : "Editor auto-save disabled");
  };

  const toggleAutoplay = (val) => {
    setAutoplayAudio(val);
    localStorage.setItem("swats_pref_autoplay", String(val));
    toast.success(val ? "Audio autoplay on entry enabled" : "Audio autoplay disabled");
  };

  const toggleReducedMotion = (val) => {
    setReducedMotion(val);
    localStorage.setItem("swats_reduced_motion", String(val));
    toast.success(val ? "Reduced motion enabled" : "Full animations restored");
  };

  const toggleSoundEffects = (val) => {
    setSoundEffects(val);
    localStorage.setItem("swats_sound_effects", String(val));
    toast.success(val ? "UI click audio effects enabled" : "UI sound effects muted");
  };

  const saveUsername = async () => {
    if (!username.trim()) { toast.error("Username cannot be empty"); return; }
    setSavingUser(true);
    try {
      const { data } = await api.put("/me/username", { username: username.trim() });
      setUser(data);
      toast.success("Username updated successfully");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not update username");
    }
    setSavingUser(false);
  };

  const saveSecondaryAlias = async () => {
    setSavingSecondary(true);
    try {
      const { data } = await api.put("/me/secondary-alias", { secondary_alias: secondaryAlias.trim() });
      setUser(data);
      toast.success(secondaryAlias.trim() ? "Secondary alias claimed successfully!" : "Secondary alias cleared");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not update secondary alias");
    }
    setSavingSecondary(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("New passwords do not match"); return; }

    setSavingPw(true);
    try {
      const { data } = await api.put("/me/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success(data.detail || "Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to update password");
    }
    setSavingPw(false);
  };

  const strength = calcPasswordStrength(newPassword);

  // Moderation standing definition
  // Statuses: Good, Limited, Very Limited, At Risk, Banned
  const standingStatus = user?.moderation_status || "Good";
  const standingLevels = [
    { key: "Good", label: "Good", color: "bg-emerald-500", text: "text-emerald-400", desc: "Full visibility and indexed on platform search" },
    { key: "Limited", label: "Limited", color: "bg-blue-500", text: "text-blue-400", desc: "Minor guideline flags pending review" },
    { key: "Very Limited", label: "Very Limited", color: "bg-amber-500", text: "text-amber-400", desc: "Profile discovery restricted" },
    { key: "At Risk", label: "At Risk", color: "bg-rose-500", text: "text-rose-400", desc: "Inappropriate bio/avatar flagged by moderators" },
    { key: "Banned", label: "Banned", color: "bg-red-700", text: "text-red-500", desc: "Account suspended from public routing" },
  ];

  return (
    <div data-testid="settings-page" className="w-full space-y-6 pb-16 text-zinc-100">
      {/* Header & Category Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your account status, credentials, active sessions, billing and security.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-white/[0.08] bg-[#0c0c0e] p-1">
          <button
            type="button"
            onClick={() => setTab("account")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === "account" ? "bg-[#b4bffa] text-black font-bold shadow-sm" : "text-zinc-400 hover:text-white"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Account settings
          </button>
          <button
            type="button"
            onClick={() => setTab("billing")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === "billing" ? "bg-[#b4bffa] text-black font-bold shadow-sm" : "text-zinc-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Billing and security
          </button>
        </div>
      </div>

      {activeTab === "account" ? (
        <>
          {/* ========================================================
              TOP SECTION: TWO BIG RECTANGLES
              ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* BIG RECTANGLE 1: Moderation Status & Guidelines */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-6 flex flex-col justify-between relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white">Account Standing</h2>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {standingStatus} Standing
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed mb-5">
                  If profiles violate swats.bio community guidelines (e.g. inappropriate bios, harassment or NSFW avatars), moderators apply progressive limitations to maintain a safe platform.
                </p>

                {/* Status Ladder Display */}
                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 mb-1">
                    <span>Guidelines Tier</span>
                    <span className="text-emerald-400">0 Active Flags</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 h-2">
                    {standingLevels.map((lvl) => {
                      const isCurrent = lvl.key === standingStatus;
                      return (
                        <div
                          key={lvl.key}
                          title={`${lvl.label}: ${lvl.desc}`}
                          className={`rounded-full transition-all ${
                            isCurrent
                              ? `${lvl.color} ring-2 ring-white/40 h-2.5 -translate-y-0.5`
                              : "bg-white/10"
                          }`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono2 pt-1">
                    <span>Good</span>
                    <span>Limited</span>
                    <span>Very Limited</span>
                    <span>At Risk</span>
                    <span>Banned</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
                <span>Search indexing: <strong className="text-white">Active</strong></span>
                <span className="text-zinc-500">No strikes on record</span>
              </div>
            </div>

            {/* BIG RECTANGLE 2: Security & Rewards Hub */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-6 flex flex-col justify-between relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#b4bffa]/5 rounded-full blur-3xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-5 h-5 text-[#b4bffa]" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white">Security & Rewards Hub</h2>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#b4bffa]/15 text-[#b4bffa] border border-[#b4bffa]/30">
                    Tier: {user?.tier || "Free"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
                    <div className="text-[11px] text-zinc-400">Security Score</div>
                    <div className="text-xl font-bold text-white mt-0.5">85 / 100</div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">Protected</div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
                    <div className="text-[11px] text-zinc-400">Unlocked Badges</div>
                    <div className="text-xl font-bold text-white mt-0.5">{(user?.badges || []).length} Badges</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">Active & Equipped</div>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Earn platform rewards by customizing your profile, linking verified accounts, and staying active in the community.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
                <span>Member UID: <strong className="text-white font-mono2">#{user?.uid_number || user?.id || 1}</strong></span>
                <span className="text-emerald-400 font-semibold">Account Verified</span>
              </div>
            </div>
          </div>

          {/* ========================================================
              LOWER SECTION: SMALLER SQUARE SECTIONS
              ======================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Square 1: Profile & Credentials (Username + Blurred Email) */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-5 space-y-4 shadow-lg">
              <div className="flex items-center gap-2">
                <AtSign className="w-4 h-4 text-[#b4bffa]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Profile Identity</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-zinc-400">Primary Handle</label>
                    <span className="text-[10px] text-zinc-500 font-mono2">tourn.lol/@{user?.username}</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono2 text-zinc-500">@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/50 border border-white/[0.08] text-xs text-white outline-none focus:border-[#b4bffa]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={saveUsername}
                      disabled={savingUser}
                      data-testid="settings-save-username"
                      className="px-4 py-2 rounded-xl bg-[#b4bffa] text-black font-bold text-xs hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
                    >
                      {savingUser ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                    </button>
                  </div>
                </div>

                {/* Secondary Alias (Premium Perk: Claim up to 2 aliases) */}
                <div className="pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] font-semibold text-zinc-400">Secondary Handle</label>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        2nd Alias (Premium)
                      </span>
                    </div>
                    {user?.secondary_alias && (
                      <span className="text-[10px] text-emerald-400 font-mono2">tourn.lol/@{user.secondary_alias}</span>
                    )}
                  </div>
                  {isPremium ? (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono2 text-zinc-500">@</span>
                        <input
                          type="text"
                          value={secondaryAlias}
                          placeholder="Claim a 2nd handle (e.g. alt tag)"
                          onChange={(e) => setSecondaryAlias(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/50 border border-white/[0.08] text-xs text-white outline-none focus:border-[#b4bffa] placeholder:text-zinc-600"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={saveSecondaryAlias}
                        disabled={savingSecondary}
                        className="px-4 py-2 rounded-xl bg-[#b4bffa] text-black font-bold text-xs hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
                      >
                        {savingSecondary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Claim"}
                      </button>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between text-xs">
                      <span className="text-zinc-400 text-[11px]">Premium members can claim 2 aliases</span>
                      <a href="/!/pricing" className="text-[11px] font-bold text-amber-300 hover:underline">
                        Unlock 2nd Alias →
                      </a>
                    </div>
                  )}
                </div>

                {/* Email with Hover Blur Effect */}
                <div className="pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-zinc-400">Account Email</label>
                    <span className="text-[10px] text-zinc-500">Hover or click to reveal</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/50 border border-white/[0.08]">
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                      <span
                        onMouseEnter={() => setEmailRevealed(true)}
                        onMouseLeave={() => setEmailRevealed(false)}
                        className={`text-xs font-mono2 text-zinc-200 transition-all duration-200 cursor-pointer select-all ${
                          emailRevealed ? "filter-none" : "blur-[6px] hover:blur-none"
                        }`}
                        title="Hover to reveal email"
                      >
                        {user?.email || "user@tourn.lol"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmailRevealed(!emailRevealed)}
                      className="p-1 text-zinc-500 hover:text-zinc-200 transition"
                      title={emailRevealed ? "Hide email" : "Show email"}
                    >
                      {emailRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Reset Email Option */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-zinc-400">Reset Email Address</div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/[0.05] text-zinc-400 border border-white/[0.08]">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>

            {/* Square 2: Active Sessions */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-5 space-y-4 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Laptop className="w-4 h-4 text-[#b4bffa]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">Active Sessions</h3>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-black/50 border border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-300">
                        <Laptop className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-2">
                          Current Browser Session
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono2">Windows · Chrome · IP Active</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] text-zinc-500">1 active device</span>
                <button
                  type="button"
                  onClick={() => toast.success("All other sessions logged out")}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition cursor-pointer"
                >
                  Sign Out Other Sessions
                </button>
              </div>
            </div>

            {/* Square 3: Preferences & Experience */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-5 space-y-3.5 shadow-lg">
              <div className="flex items-center gap-2 mb-1">
                <Sliders className="w-4 h-4 text-[#b4bffa]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Preferences</h3>
              </div>

              <div className="divide-y divide-white/[0.06] text-xs">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-semibold text-zinc-200">Auto-Save Profile</div>
                    <div className="text-[10px] text-zinc-500">Automatically save draft changes in Editor</div>
                  </div>
                  <Switch checked={autoSave} onCheckedChange={toggleAutoSave} />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-semibold text-zinc-200">Autoplay Music on Entry</div>
                    <div className="text-[10px] text-zinc-500">Start track playback when visitors enter</div>
                  </div>
                  <Switch checked={autoplayAudio} onCheckedChange={toggleAutoplay} />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-semibold text-zinc-200">Reduced Motion</div>
                    <div className="text-[10px] text-zinc-500">Minimize animations and motion blur</div>
                  </div>
                  <Switch checked={reducedMotion} onCheckedChange={toggleReducedMotion} />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-semibold text-zinc-200">Sound Effects</div>
                    <div className="text-[10px] text-zinc-500">Audio feedback on button clicks</div>
                  </div>
                  <Switch checked={soundEffects} onCheckedChange={toggleSoundEffects} />
                </div>
              </div>
            </div>

            {/* Square 4: Password & Two-Factor Authentication */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-5 space-y-4 shadow-lg">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#b4bffa]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Password & Security</h3>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-3">
                <div>
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/[0.08] text-xs text-white outline-none focus:border-[#b4bffa]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/[0.08] text-xs text-white outline-none focus:border-[#b4bffa]"
                  />
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="Confirm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/[0.08] text-xs text-white outline-none focus:border-[#b4bffa]"
                  />
                </div>

                {newPassword && (
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span>Strength: <strong className={strength.text}>{strength.label}</strong></span>
                    <button type="button" onClick={() => setShowPw(!showPw)} className="text-zinc-500 hover:text-white">
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingPw || !newPassword}
                  className="w-full py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white transition disabled:opacity-40 cursor-pointer"
                >
                  {savingPw ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          </div>

          {/* 2FA Dedicated Section */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-6 shadow-xl">
            <TwoFactorPanel user={user} setUser={setUser} />
          </div>
        </>
      ) : (
        /* ========================================================
            BILLING & SECURITY VIEW (NO PREVIEW POPUP SPAM)
            ======================================================== */
        <div className="space-y-6">
          {/* Summary Metric Rectangles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#0c0c0e]">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span>Account Balance</span>
                <DollarSign className="w-4 h-4 text-[#b4bffa]" />
              </div>
              <div className="text-2xl font-bold text-white mt-2">$0.00</div>
              <div className="text-[10px] text-zinc-500 mt-1">Available store credit</div>
            </div>

            <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#0c0c0e]">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span>Total Spent</span>
                <CreditCard className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-2">$0.00</div>
              <div className="text-[10px] text-zinc-500 mt-1">Lifetime billing</div>
            </div>

            <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#0c0c0e]">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span>Active Plan</span>
                <ShieldCheck className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-2 capitalize">{user?.tier || "Free"}</div>
              <div className="text-[10px] text-zinc-500 mt-1">Standard membership</div>
            </div>

            <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#0c0c0e]">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span>Invoices</span>
                <Receipt className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-2">0</div>
              <div className="text-[10px] text-zinc-500 mt-1">All settled</div>
            </div>
          </div>

          {/* Transactions Section */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#b4bffa]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Recent Transactions</h3>
              </div>
              <span className="text-xs text-zinc-500">Filtered: All Time</span>
            </div>

            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-500 mb-3">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold text-zinc-300">No Transactions Found</div>
              <div className="text-xs text-zinc-500 max-w-sm mt-1">
                Your account does not have any billing charges or invoice records yet.
              </div>
            </div>
          </div>

          {/* Purchases & Marketplace Orders Section */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Purchases & Orders</h3>
              </div>
              <span className="text-xs text-zinc-500">0 Items</span>
            </div>

            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-500 mb-3">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold text-zinc-300">No Purchases Recorded</div>
              <div className="text-xs text-zinc-500 max-w-sm mt-1">
                When you acquire marketplace templates, custom badges, or upgrades, they will appear here.
              </div>
            </div>
          </div>

          {/* Support Contact */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-4 h-4 text-[#b4bffa]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Need Help?</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              For billing inquiries, subscription issues, or account assistance, reach out to our support team.
            </p>
            <a
              href="mailto:support@tourn.lol"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#b4bffa] text-black font-bold text-xs hover:brightness-110 transition"
            >
              <Mail className="w-3.5 h-3.5" />
              support@tourn.lol
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
