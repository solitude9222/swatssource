import { useMemo } from "react";
import type { Account } from "../lib/auth";
import { EMPTY_ABOUT, loadAbout, type About } from "../lib/about";
import { EMPTY_WIDGET_STORE, loadWidgetStore, type WidgetStore } from "../lib/widgets";
import { EMPTY_BADGE_STORE, loadBadgeStore, type BadgeStore } from "../lib/badges";
import { EMPTY_LINK_STORE, loadLinkStore, type LinkStore } from "../lib/links";
import { LinkerPreview } from "./LinkerPreview";
import { BoltIcon, GridIcon } from "./Icons";
import "../about.css";

type ProfileData = {
  about: About;
  widgets: WidgetStore;
  badges: BadgeStore;
  links: LinkStore;
};

/**
 * /demo — the real public link page, not the marketing home page.
 *
 * - The owner account (VITE_OWNER_EMAIL) sees their live dashboard data.
 * - Any signed-in account previews its own public page.
 * - Visitors see the owner's profile row (Supabase) once it exists.
 * - With no owner configured there is no fake data: a clean placeholder
 *   explains what this page is.
 */
export function DemoPage({
  user,
  isOwner,
  first,
  about,
  widgets,
  badges,
  links,
}: {
  user: Account | null;
  isOwner: boolean;
  first: Account | null;
  about: About;
  widgets: WidgetStore;
  badges: BadgeStore;
  links: LinkStore;
}) {
  const owner = (isOwner && user ? user : null) ?? user ?? first;

  const data = useMemo<ProfileData | null>(() => {
    if (!owner) return null;
    if (isOwner && user) return { about, widgets, badges, links };

    const stored: ProfileData = {
      about: loadAbout(owner.id),
      widgets: loadWidgetStore(owner.id),
      badges: loadBadgeStore(owner.id),
      links: loadLinkStore(owner.id),
    };
    const empty =
      !stored.about.displayName.trim() &&
      !stored.about.bio.trim() &&
      !stored.widgets.widgets.length &&
      !stored.links.links.length;
    return empty ? null : stored;
  }, [owner, isOwner, user, about, widgets, badges, links]);

  if (!owner || !data) {
    const handle = isOwner && user ? user.username : first?.username ?? "yourname";
    return (
      <section className="profile-page demo-page">
        <div className="demo-placeholder">
          <span className="demo-placeholder-icon" aria-hidden="true">
            <BoltIcon size={20} />
          </span>
          <span className="eyebrow eyebrow--sm">tourn.lol/demo</span>
          <h1>The public link page lives here.</h1>
          <p>
            This is where the owner's real bio page renders — the same layout visitors see at
            tourn.lol/{handle}. It appears automatically once the owner account is signed in and
            Supabase is configured.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="profile-page demo-page">
      <LinkerPreview
        user={owner}
        about={data.about}
        widgets={data.widgets}
        badges={data.badges}
        links={data.links}
        interactive
      />
      {user ? (
        <a className="demo-edit-btn" href="#/dashboard">
          <GridIcon size={13} />
          Edit this page
        </a>
      ) : null}
    </section>
  );
}
