import { BoltIcon } from "./Icons";

/** Small gold "Premium" pill shown on cosmetic options gated behind
 *  premium — used by DashboardAssets (effects, audio) and DashboardLinks
 *  (card styles). Purely visual; the click-redirect logic lives on each
 *  option's own button so it can send the visitor to the Shop. */
export function PremiumTag() {
  return (
    <span className="premium-tag">
      <BoltIcon size={8} />
      Premium
    </span>
  );
}
