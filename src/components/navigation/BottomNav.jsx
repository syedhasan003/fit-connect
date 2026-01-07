import { NavLink } from "react-router-dom";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-neutral-900 border-t border-neutral-800 flex justify-around items-center">
      <NavLink to="/" className="text-sm text-neutral-400">
        Home
      </NavLink>

      <NavLink to="/discovery" className="text-sm text-neutral-400">
        Discover
      </NavLink>

      <NavLink to="/central" className="text-sm text-neutral-400">
        Central
      </NavLink>

      <NavLink to="/vault" className="text-sm text-neutral-400">
        Vault
      </NavLink>

      <NavLink to="/profile" className="text-sm text-neutral-400">
        Profile
      </NavLink>
    </nav>
  );
}
