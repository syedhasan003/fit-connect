import { NavLink, useNavigate } from "react-router-dom";
import AOrb from "../ai/AIOrb";
import IconButton from "../ui/IconButton";
import { HomeIcon, SearchIcon, NewspaperIcon, UserIcon } from "../icons";

export default function BottomNav() {
  const navigate = useNavigate();

  return (
    <nav
      className="
        fixed 
        left-1/2 -translate-x-1/2 
        bottom-4 safe-bottom 
        w-[92%] max-w-[480px] 
        z-50 
        transition-all duration-300
      "
    >
      <div
        className="
          relative
          flex items-center justify-between
          px-6 py-3

          rounded-3xl 
          bg-black/30 backdrop-blur-2xl
          shadow-[0_8px_20px_rgba(0,0,0,0.45)]
          border border-white/10
        "
      >
        {/* LEFT SECTION */}
        <div className="flex items-center gap-6">
          <NavLink to="/" className="flex flex-col items-center">
            {({ isActive }) => (
              <IconButton active={isActive}>
                <HomeIcon className="w-6 h-6" />
              </IconButton>
            )}
          </NavLink>

          <NavLink to="/feed" className="flex flex-col items-center">
            {({ isActive }) => (
              <IconButton active={isActive}>
                <NewspaperIcon className="w-6 h-6" />
              </IconButton>
            )}
          </NavLink>
        </div>

        {/* CENTER ORB */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-6">
          <button onClick={() => navigate("/coach")}>
            <AOrb size="large" />
          </button>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-6">
          <NavLink to="/discover" className="flex flex-col items-center">
            {({ isActive }) => (
              <IconButton active={isActive}>
                <SearchIcon className="w-6 h-6" />
              </IconButton>
            )}
          </NavLink>

          <NavLink to="/profile" className="flex flex-col items-center">
            {({ isActive }) => (
              <IconButton active={isActive}>
                <UserIcon className="w-6 h-6" />
              </IconButton>
            )}
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
