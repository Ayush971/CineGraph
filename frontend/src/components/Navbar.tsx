import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import SearchBar from "./SearchBar";
import ProjectorMark from "./ui/ProjectorMark";

interface NavItem {
  to: string;
  label: string;
  auth?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/movies", label: "Movies" },
  { to: "/series", label: "Series" },
  { to: "/diary", label: "Diary", auth: true },
  { to: "/lists", label: "Lists", auth: true },
  { to: "/feed", label: "Feed", auth: true },
  { to: "/recommendations", label: "For You", auth: true },
  { to: "/analytics", label: "Analytics", auth: true },
];

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const items = NAV_ITEMS.filter((item) => !item.auth || user);

  return (
    <nav className="bg-surface/80 backdrop-blur-xl border-b border-line sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          {/* Wordmark — projector mark + Bricolage */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 group"
            aria-label="CineGraph home"
          >
            <ProjectorMark size={26} />
            <span className="font-display text-xl font-bold tracking-tight text-ink group-hover:text-tungsten-300 transition-colors">
              CineGraph
            </span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-xl flex justify-center">
            <SearchBar />
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            {items.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative px-3 py-2 text-sm rounded-md transition-colors duration-150 hidden lg:block ${
                    active
                      ? "text-daylight-300"
                      : "text-ink-mute hover:text-ink hover:bg-surface-2"
                  }`}
                >
                  {item.label}
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-daylight-400"
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                </Link>
              );
            })}

            {user ? (
              <div className="flex items-center gap-2 ml-2">
                <Link
                  to={`/user/${user.id}`}
                  className={`px-3 py-2 text-sm rounded-md transition-colors duration-150 hidden sm:block ${
                    pathname.startsWith("/user/")
                      ? "text-daylight-300"
                      : "text-ink-mute hover:text-ink hover:bg-surface-2"
                  }`}
                >
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm rounded-md bg-surface-3 text-ink border border-line-strong hover:border-ink-faint transition-colors duration-150 cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link
                  to="/login"
                  className="px-3 py-2 text-sm text-ink-mute hover:text-ink transition-colors hidden sm:block"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold rounded-md bg-tungsten-400 text-void hover:bg-tungsten-500 hover:shadow-glow transition-[background-color,box-shadow] duration-150"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
