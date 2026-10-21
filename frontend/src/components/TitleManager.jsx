import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const PATH_TITLES = {
  "/": "Home",
  "/!/home": "Home",
  "/!/legal": "Legal",
  "/legal": "Legal",
  "/!/pricing": "Pricing",
  "/pricing": "Pricing",
  "/!/login": "Login",
  "/login": "Login",
  "/!/auth/discord": "Discord Sign In",
  "/auth/discord": "Discord Sign In",
  "/!/dashboard": "Dashboard",
  "/!/dashboard/editor": "About me",
  "/!/dashboard/links": "Links",
  "/!/dashboard/badges": "Badges",
  "/!/dashboard/widgets": "Widgets",
  "/!/dashboard/settings": "Settings",
  "/!/dashboard/stats": "Statistics",
  "/!/dashboard/admin": "Admin",
  "/!/dashboard/admin/users": "User Manager",
  "/!/dashboard/admin/invites": "Invite Codes",
  "/!/dashboard/admin/notify": "Notify",
  "/!/dashboard/admin/devlogs": "Devlogs",
  "/!/dashboard/admin/site": "Site Settings",
  "/!/dashboard/admin/analytics": "Analytics",
};

export function TitleManager() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (PATH_TITLES[path]) {
      document.title = `tourn | ${PATH_TITLES[path]}`;
    } else if (!path.startsWith("/!") && path.length > 1) {
      // Dynamic profile page — handled in PublicProfile.jsx
    } else {
      document.title = "tourn | Home";
    }
  }, [location]);

  return null;
}
