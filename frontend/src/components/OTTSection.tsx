import React, { useEffect, useState } from "react";
import { moviesAPI } from "../services/api";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/original";

interface Provider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

interface WatchProviders {
  flatrate?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
  link?: string;
}

interface OTTSectionProps {
  movieId: number;
  className?: string;
}

const OTTSection: React.FC<OTTSectionProps> = ({ movieId, className = "" }) => {
  const [providers, setProviders] = useState<WatchProviders | null>(null);
  const [region, setRegion] = useState<string>("US"); // Default region
  const [, setAvailableRegions] = useState<string[]>([]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await moviesAPI.getWatchProviders(movieId);
        const results = response.data.results;

        if (results) {
          setAvailableRegions(Object.keys(results));

          // Try to set user's region or fallback to US, or first available
          if (results[region]) {
            setProviders(results[region]);
          } else if (results["US"]) {
            setRegion("US");
            setProviders(results["US"]);
          } else {
            const firstRegion = Object.keys(results)[0];
            if (firstRegion) {
              setRegion(firstRegion);
              setProviders(results[firstRegion]);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching watch providers:", err);
      }
    };

    fetchProviders();
  }, [movieId]);

  // Handle region change if we implement a region selector later
  // For now just auto-detect logic above

  if (!providers) return null;

  const hasProviders =
    (providers.flatrate && providers.flatrate.length > 0) ||
    (providers.rent && providers.rent.length > 0) ||
    (providers.buy && providers.buy.length > 0);

  if (!hasProviders) return null;

  return (
    <div className={className}>
      <p className="text-sm text-gray-400 mb-2">Where to Watch ({region})</p>

      <div className="flex flex-col gap-4">
        {/* Streaming / Flatrate */}
        {providers.flatrate && providers.flatrate.length > 0 && (
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-xs font-semibold text-primary w-16">
              STREAM
            </span>
            <div className="flex flex-wrap gap-3">
              {providers.flatrate.map((provider) => (
                <div
                  key={provider.provider_id}
                  className="relative group"
                  title={provider.provider_name}
                >
                  <img
                    src={`${TMDB_IMAGE_BASE}${provider.logo_path}`}
                    alt={provider.provider_name}
                    className="w-10 h-10 rounded-lg shadow-md hover:scale-110 transition-transform cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rent */}
        {providers.rent && providers.rent.length > 0 && (
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-xs font-semibold text-blue-400 w-16">
              RENT
            </span>
            <div className="flex flex-wrap gap-3">
              {providers.rent.map((provider) => (
                <div
                  key={provider.provider_id}
                  className="relative group"
                  title={provider.provider_name}
                >
                  <img
                    src={`${TMDB_IMAGE_BASE}${provider.logo_path}`}
                    alt={provider.provider_name}
                    className="w-10 h-10 rounded-lg shadow-md hover:scale-110 transition-transform cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buy */}
        {providers.buy && providers.buy.length > 0 && (
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-xs font-semibold text-green-400 w-16">
              BUY
            </span>
            <div className="flex flex-wrap gap-3">
              {providers.buy.map((provider) => (
                <div
                  key={provider.provider_id}
                  className="relative group"
                  title={provider.provider_name}
                >
                  <img
                    src={`${TMDB_IMAGE_BASE}${provider.logo_path}`}
                    alt={provider.provider_name}
                    className="w-10 h-10 rounded-lg shadow-md hover:scale-110 transition-transform cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 mt-1">
          <a
            href={providers.link}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white underline"
          >
            Provided by JustWatch
          </a>
        </div>
      </div>
    </div>
  );
};

export default OTTSection;
