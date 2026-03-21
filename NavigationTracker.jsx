import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function NavigationTracker() {
  const location = useLocation();

  useEffect(() => {
    console.log(
      "[NavigationTracker] LOCATION CHANGE",
      {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
        href: window.location.href
      }
    );
  }, [location]);

  return null;
}