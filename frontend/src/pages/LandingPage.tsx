import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import moviesCollage from "../assets/movies-collage.jpg";
import seriesCollage from "../assets/series-collage.jpg";

const LandingPage: React.FC = () => {
  const [hoveredButton, setHoveredButton] = useState<
    "movies" | "series" | null
  >(null);
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
      {/* Animated Background - Movies Collage */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          hoveredButton === "series" ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/70 z-10" />

        {/* Scrolling movies collage */}
        <div className="absolute inset-y-0 left-0 flex animate-scroll-horizontal">
          {/* Repeat images enough times to cover any screen width */}
          {[1, 2, 3, 4].map((i) => (
            <img
              key={i}
              src={moviesCollage}
              alt="Movies"
              className="h-full w-auto max-w-none object-cover"
            />
          ))}
        </div>
      </div>

      {/* Animated Background - Series Collage */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          hoveredButton === "series" ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/70 z-10" />

        {/* Scrolling series collage */}
        <div className="absolute inset-y-0 left-0 flex animate-scroll-horizontal">
          {[1, 2, 3, 4].map((i) => (
            <img
              key={i}
              src={seriesCollage}
              alt="Series"
              className="h-full w-auto max-w-none object-cover"
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-20 text-center px-4">
        {/* Logo/Title */}
        <div className="mb-12">
          <h1 className="text-6xl md:text-8xl font-bold mb-4 text-white drop-shadow-2xl tracking-tight">
            🎬 CineGraph
          </h1>
          <p className="text-lg md:text-2xl text-gray-100 drop-shadow-lg font-light">
            Track your movies and series. Share what you love.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          {/* Movies Button */}
          <button
            onMouseEnter={() => setHoveredButton("movies")}
            onMouseLeave={() => setHoveredButton(null)}
            onClick={() => navigate("/movies")}
            className="group relative px-10 py-5 bg-primary/90 hover:bg-primary text-white text-xl font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl backdrop-blur-sm border border-white/10"
          >
            <span className="relative z-10 flex items-center gap-3">
              <span className="text-2xl">🎬</span>
              Movies
            </span>
          </button>

          {/* Series Button */}
          <button
            onMouseEnter={() => setHoveredButton("series")}
            onMouseLeave={() => setHoveredButton(null)}
            onClick={() => navigate("/series")}
            className="group relative px-10 py-5 bg-blue-600/90 hover:bg-blue-600 text-white text-xl font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl backdrop-blur-sm border border-white/10"
          >
            <span className="relative z-10 flex items-center gap-3">
              <span className="text-2xl">📺</span>
              Series
            </span>
          </button>
        </div>

        {/* Subtitle */}
        <p className="mt-12 text-gray-300 text-lg drop-shadow-md">
          Choose your entertainment
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
