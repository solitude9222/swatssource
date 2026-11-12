import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, fileUrl } from "@/lib/api";

/* The featured-users band, rebuilt as three chip rows.

   Each row travels the opposite way to the one above it, so the strip reads as
   a moving wall of people rather than a single conveyor. The rows are
   decorative and duplicate their cards for a seamless loop; the single
   accessible copy is the visually hidden list underneath. */

const UserChip = ({ u }) => {
  const avatarSrc = fileUrl(u.avatar);
  return (
    <Link
      to={`/${u.username}`}
      data-testid={`showcase-card-${u.username}`}
      className="mx-1.5 flex h-[97px] w-[105px] shrink-0 flex-col items-center justify-center gap-2 rounded-[14px] border border-[#1f1f1f] bg-[#121212] transition-colors hover:border-[#27397c]"
    >
      <span className="relative h-[42px] w-[42px] overflow-hidden rounded-full border border-white/10">
        {avatarSrc ? (
          <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-[#1a1a1a] text-[12px] font-bold text-[#9fa2af]">
            {(u.display_name || u.username || "?")[0]?.toUpperCase()}
          </span>
        )}
      </span>
      <span className="max-w-[88px] truncate text-[11px] font-medium text-[#9f9f9f]">@{u.username}</span>
    </Link>
  );
};

const SkeletonChip = ({ i }) => (
  <div className="mx-1.5 h-[97px] w-[105px] shrink-0 animate-pulse rounded-[14px] border border-[#1f1f1f] bg-[#121212]" aria-hidden="true" style={{ animationDelay: `${i * 90}ms` }} />
);

const Row = ({ users, direction, loaded }) => {
  const content = loaded ? (
    users.map((u, i) => <UserChip key={`${u.id || u.username}-${i}`} u={u} />)
  ) : (
    Array.from({ length: 8 }).map((_, i) => <SkeletonChip key={i} i={i} />)
  );

  return (
    <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
      <div className={direction === "right" ? "sw-row-right" : "sw-row-left"} aria-hidden="true">
        {content}
        {content}
      </div>
    </div>
  );
};

export const UserCarousel = () => {
  const [users, setUsers] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get("/users/showcase")
      .then(({ data }) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (loaded && !users.length) {
    return (
      <section data-testid="infinite-user-carousel" className="relative overflow-hidden px-4 py-16">
        <div className="text-center">
          <p className="text-[13px] text-[#9fa2af]">
            Nobody has been featured yet — claim your tourn.lol handle and you could be first.
          </p>
        </div>
      </section>
    );
  }

  // Three rows, dealt round-robin so no row is a leftover dump.
  const rows = [[], [], []];
  users.forEach((u, i) => rows[i % 3].push(u));

  return (
    <section data-testid="infinite-user-carousel" className="relative space-y-3 overflow-hidden py-10">
      {[0, 1, 2].map((r) => (
        <Row
          key={r}
          users={rows[r].length ? rows[r] : users}
          direction={r === 1 ? "right" : "left"}
          loaded={loaded}
        />
      ))}

      <ul className="sr-only" data-testid="showcase-user-list">
        {users.map((u) => (
          <li key={u.id || u.username}>
            <Link to={`/${u.username}`}>@{u.username}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default UserCarousel;
