import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SearchBar from "./SearchBar";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-surface/70 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-bold text-white hover:text-primary transition-colors shrink-0"
          >
            🎬 CineGraph
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl flex justify-center">
            <SearchBar />
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              to="/movies"
              className="text-white hover:text-primary transition-colors hidden sm:block"
            >
              Movies
            </Link>
            <Link
              to="/series"
              className="text-white hover:text-primary transition-colors hidden sm:block"
            >
              Series
            </Link>
            {user && (
              <Link
                to="/diary"
                className="text-white hover:text-primary transition-colors hidden sm:block"
              >
                Diary
              </Link>
            )}
            {user && (
              <Link
                to="/lists"
                className="text-white hover:text-primary transition-colors hidden sm:block"
              >
                Lists
              </Link>
            )}
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="text-white hover:text-primary transition-colors hidden sm:block"
                >
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-red-700 transition-colors text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white hover:text-primary transition-colors hidden sm:block"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-red-700 transition-colors text-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
