import type { GuildInvite } from "../lib/api";
import { CheckIcon, DiscordIcon, LinkIcon, ArrowRight } from "./Icons";

export type ProfileDetail = {
  label: string;
  hint: string;
  done: boolean;
};

const PROFILE_RADIUS = 54;
const PROFILE_CIRCUMFERENCE = 2 * Math.PI * PROFILE_RADIUS;

const REACH_RADIUS = 50;
const REACH_CIRCUMFERENCE = 2 * Math.PI * REACH_RADIUS;

export function ProfileCompletionChart({
  details,
  score,
  onEdit,
}: {
  details: ProfileDetail[];
  score: number;
  onEdit: () => void;
}) {
  const completed = details.filter((detail) => detail.done).length;

  return (
    <section className="dash-panel dash-chart-panel dash-profile-chart" data-reveal data-reveal-delay="60">
      <div className="dash-panel-head">
        <div>
          <h2>Profile strength</h2>
        </div>
        <span className="chart-count">
          {completed}/{details.length}
        </span>
      </div>

      <div className="chart-split chart-split--profile">
        <div className="chart-donut chart-donut--profile">
          <svg viewBox="0 0 140 140" role="img" aria-label={`Profile ${score}% complete`}>
            <defs>
              <linearGradient id="dashProfileRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3f9bc4" />
                <stop offset="100%" stopColor="#c2efff" />
              </linearGradient>
            </defs>
            <circle className="chart-ring-track" cx="70" cy="70" r={PROFILE_RADIUS} />
            <circle
              className="chart-ring-value"
              cx="70"
              cy="70"
              r={PROFILE_RADIUS}
              stroke="url(#dashProfileRing)"
              strokeDasharray={`${PROFILE_CIRCUMFERENCE} ${PROFILE_CIRCUMFERENCE}`}
              strokeDashoffset={PROFILE_CIRCUMFERENCE * (1 - score / 100)}
            />
          </svg>
          <div className="chart-donut-center">
            <b>{score}%</b>
            <span>complete</span>
          </div>
        </div>

        <div className="profile-bars">
          <div className="profile-bars-axis" aria-hidden="true">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
          <ul className="profile-bar-list">
            {details.map((detail) => (
              <li
                key={detail.label}
                className={`profile-bar${detail.done ? " is-done" : " is-missing"}`}
              >
                <div className="profile-bar-meta">
                  <span>{detail.label}</span>
                  <small>{detail.hint}</small>
                  <b>
                    {detail.done ? (
                      <>
                        <CheckIcon size={10} />
                        Done
                      </>
                    ) : (
                      "Missing"
                    )}
                  </b>
                </div>
                <div className="profile-bar-track">
                  <span />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="chart-foot">
        <span>
          {completed} of {details.length} details complete
        </span>
        <button type="button" className="dash-link" onClick={onEdit}>
          Edit profile
          <ArrowRight size={11} />
        </button>
      </div>
    </section>
  );
}

export function ServerReachChart({
  invite,
  loading,
  hasInvite,
  error,
  onConnect,
  onRetry,
}: {
  invite: GuildInvite | null;
  loading: boolean;
  hasInvite: boolean;
  error: string | null;
  onConnect: () => void;
  onRetry: () => void;
}) {
  const members = invite?.approximate_member_count ?? 0;
  const online = invite?.approximate_presence_count ?? 0;
  const offline = Math.max(0, members - online);
  const onlinePercent = members > 0 ? Math.min(100, Math.round((online / members) * 100)) : 0;
  const guild = invite?.guild ?? null;
  const icon = guild?.icon
    ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`
    : null;

  return (
    <section className="dash-panel dash-chart-panel dash-reach-chart" data-reveal data-reveal-delay="100">
      <div className="dash-panel-head">
        <div>
          <h2>Server reach</h2>
        </div>
        {invite ? (
          <span className="dash-live is-live">
            <i />
            Live
          </span>
        ) : null}
      </div>

      {invite && guild ? (
        <>
          <div className="reach-guild">
            {icon ? (
              <img className="reach-guild-icon" src={icon} alt="" width={34} height={34} />
            ) : (
              <span className="reach-guild-icon reach-guild-icon--fallback">
                <DiscordIcon size={16} />
              </span>
            )}
            <div className="reach-guild-text">
              <b>{guild.name}</b>
              <span>discord.gg/{invite.code}</span>
            </div>
            <span className="reach-online-pill">{online} online</span>
          </div>

          <div className="reach-body">
            <div className="chart-donut chart-donut--reach">
              <svg viewBox="0 0 140 140" role="img" aria-label={`${onlinePercent}% of members online`}>
                <defs>
                  <linearGradient id="dashReachRing" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3f9bc4" />
                    <stop offset="100%" stopColor="#c2efff" />
                  </linearGradient>
                </defs>
                <circle className="chart-ring-track" cx="70" cy="70" r={REACH_RADIUS} />
                <circle
                  className="chart-ring-value"
                  cx="70"
                  cy="70"
                  r={REACH_RADIUS}
                  stroke="url(#dashReachRing)"
                  strokeDasharray={`${REACH_CIRCUMFERENCE} ${REACH_CIRCUMFERENCE}`}
                  strokeDashoffset={REACH_CIRCUMFERENCE * (1 - onlinePercent / 100)}
                />
              </svg>
              <div className="chart-donut-center">
                <b>{onlinePercent}%</b>
                <span>online</span>
              </div>
            </div>

            <div className="reach-stats">
              <div>
                <span>Members</span>
                <b>{members.toLocaleString()}</b>
              </div>
              <div>
                <span>Online</span>
                <b>{online.toLocaleString()}</b>
              </div>
              <div>
                <span>Offline</span>
                <b>{offline.toLocaleString()}</b>
              </div>
            </div>
          </div>

          <div className="reach-meter" aria-hidden="true">
            <span className="is-online" style={{ width: `${onlinePercent}%` }} />
            <span className="is-offline" style={{ width: `${100 - onlinePercent}%` }} />
          </div>
          <p className="reach-note">Discord updates presence every few minutes. Counts refresh here every 60s.</p>
        </>
      ) : (
        <div className="chart-empty">
          <span className="chart-empty-icon">
            <LinkIcon size={18} />
          </span>
          <b>
            {loading
              ? "Checking your invite…"
              : hasInvite
                ? "Couldn't read the server"
                : "No server linked yet"}
          </b>
          <p>
            {loading
              ? "Discord is returning the live member count."
              : hasInvite
                ? (error ?? "Try again in a moment.")
                : "Add a Discord invite to see member and online counts here."}
          </p>
          {loading ? null : hasInvite ? (
            <button type="button" className="dash-secondary" onClick={onRetry}>
              Try again
            </button>
          ) : (
            <button type="button" className="dash-secondary" onClick={onConnect}>
              Connect a server
            </button>
          )}
        </div>
      )}
    </section>
  );
}
