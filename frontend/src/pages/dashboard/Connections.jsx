import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, fileUrl } from "@/lib/api";
import { toast } from "@/lib/notify";
import { FaDiscord } from "react-icons/fa6";
import {
  Globe, Link2, Unlink, RefreshCw, Loader2, ExternalLink, Check, Shield,
} from "lucide-react";

export default function Connections() {
  const { user, setUser } = useAuth();
  const discord = user?.discord || {};
  const linked = !!discord.linked;
  const [syncing, setSyncing] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const syncDiscord = async () => {
    setSyncing(true);
    try {
      const { data } = await api.post("/auth/discord/sync");
      if (data.user) setUser(data.user);
      toast.success("Discord synced — roles and badges updated");
    } catch {
      toast.error("Sync failed — try reconnecting");
    } finally {
      setSyncing(false);
    }
  };

  const unlinkDiscord = async () => {
    if (!window.confirm("Unlink your Discord account? You'll lose synced roles and badges.")) return;
    setUnlinking(true);
    try {
      const { data } = await api.post("/auth/discord/unlink");
      if (data.user) setUser(data.user);
      toast.success("Discord unlinked");
    } catch {
      toast.error("Could not unlink — try again later");
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">

      {/* Discord */}
      <div className="rounded-[20px] border border-white/[0.07] bg-[#111113] p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5865F2]/15">
            <FaDiscord className="h-5 w-5 text-[#5865F2]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Discord</h2>
            <p className="text-xs text-zinc-500">Sync your Discord account to earn badges and show presence</p>
          </div>
        </div>

        {linked ? (
          <>
            {/* Connected account card */}
            <div className="rounded-xl border border-white/[0.07] bg-[#0c0c0e] p-4 flex items-center gap-4">
              <div className="relative">
                {discord.avatar ? (
                  <img
                    src={`https://cdn.discordapp.com/avatars/${discord.id}/${discord.avatar}.png?size=64`}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-[#5865F2]/30"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-[#5865F2]/20 flex items-center justify-center">
                    <FaDiscord className="h-5 w-5 text-[#5865F2]" />
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0c0c0e] bg-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white truncate">
                    {discord.username || discord.global_name || "Connected"}
                  </span>
                  <span className="flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/25 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 uppercase">
                    <Check className="h-2.5 w-2.5" /> Linked
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-0.5">
                  <span>ID: {discord.id || "—"}</span>
                  {discord.booster && <span className="text-pink-400">Server Booster</span>}
                  {discord.member && <span className="text-indigo-400">Community Member</span>}
                </div>
              </div>
            </div>

            {/* Synced info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/[0.07] bg-[#0c0c0e] p-3.5">
                <div className="text-[11px] text-zinc-500">Roles synced</div>
                <div className="mt-1 text-sm font-semibold text-white">
                  {[discord.booster && "Booster", discord.member && "Member"].filter(Boolean).join(", ") || "None"}
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-[#0c0c0e] p-3.5">
                <div className="text-[11px] text-zinc-500">Badges earned</div>
                <div className="mt-1 text-sm font-semibold text-white">
                  {[discord.booster && "Booster", discord.member && "OG"].filter(Boolean).length || 0} from Discord
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-[#0c0c0e] p-3.5">
                <div className="text-[11px] text-zinc-500">Presence</div>
                <div className="mt-1 text-sm font-semibold text-white flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Available via Lanyard
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={syncDiscord}
                disabled={syncing}
                className="flex items-center gap-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] px-4 py-2.5 text-xs font-bold text-white transition cursor-pointer disabled:opacity-50"
              >
                {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Sync Now
              </button>
              <button
                type="button"
                onClick={unlinkDiscord}
                disabled={unlinking}
                className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 px-4 py-2.5 text-xs font-semibold text-red-400 transition cursor-pointer disabled:opacity-50"
              >
                {unlinking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlink className="h-3.5 w-3.5" />}
                Unlink
              </button>
              <a
                href={`https://discord.com/users/${discord.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.06] transition"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View Profile
              </a>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2.5 rounded-xl bg-[#0c0c0e] border border-white/[0.05] p-3.5">
              <Shield className="h-4 w-4 shrink-0 text-zinc-600 mt-0.5" />
              <div className="text-[11px] text-zinc-500 leading-relaxed">
                Discord data is synced on login and when you press Sync. Your presence (online status, activity, Spotify)
                requires joining <a href="https://discord.gg/lanyard" target="_blank" rel="noreferrer" className="text-[#5865F2] hover:underline">discord.gg/lanyard</a> with
                this account. We never post or message on your behalf.
              </div>
            </div>
          </>
        ) : (
          /* Not connected */
          <div className="rounded-xl border border-dashed border-white/[0.07] p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/20 flex items-center justify-center mx-auto">
              <FaDiscord className="h-6 w-6 text-[#5865F2]/70" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Discord not connected</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Link your Discord to sync roles, earn badges (Booster, OG, Verified) and show live presence on your profile.
              </p>
            </div>
            <a
              href="/!/auth/discord"
              className="inline-flex items-center gap-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] px-5 py-2.5 text-xs font-bold text-white transition shadow-md"
            >
              <FaDiscord className="h-4 w-4" /> Connect Discord
            </a>
          </div>
        )}
      </div>

      {/* Future connections placeholder */}
      <div className="rounded-[20px] border border-dashed border-white/[0.05] bg-[#0c0c0e]/50 p-6 text-center space-y-2">
        <Globe className="h-5 w-5 text-zinc-700 mx-auto" />
        <p className="text-xs text-zinc-600">More connections coming soon — Spotify, GitHub, Steam</p>
      </div>
    </div>
  );
}
