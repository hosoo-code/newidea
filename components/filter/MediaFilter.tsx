"use client";
import React, { useState, useEffect } from "react";
import Filter from "./Filter";
import { TMDBGenre } from "@/lib/types";

interface MediaFiltersData {
  category: string;
  genre: string;
  year: string;
  sortBy: string;
}

interface CategoryOption {
  value: string;
  label: string;
}

interface SortOption {
  value: string;
  label: string;
}

interface MediaFilterProps {
  initialFilters: MediaFiltersData;
  onFiltersChange: (filters: MediaFiltersData) => void;
  type?: "movie" | "tv";
}

const MediaFilter = ({
  initialFilters,
  onFiltersChange,
  type = "movie",
}: MediaFilterProps) => {
  const [filters, setFilters] = useState<MediaFiltersData>(initialFilters);
  const [genres, setGenres] = useState<TMDBGenre[]>([]);
  const sortOptions: SortOption[] = [
    { value: "popularity.desc", label: "Most Popular" },
    { value: "vote_average.desc", label: "Highest Rated" },
    { value: "release_date.desc", label: "Newest First" },
    { value: "release_date.asc", label: "Oldest First" },
    { value: "title.asc", label: "A-Z" },
    { value: "title.desc", label: "Z-A" },
  ];
  let categoryOptions: CategoryOption[];

  if (type === "movie") {
    categoryOptions = [
      { value: "popular", label: "Popular" },
      { value: "top_rated", label: "Top Rated" },
      { value: "now_playing", label: "Now Playing" },
      { value: "upcoming", label: "Upcoming" },
    ];
  } else {
    categoryOptions = [
      { value: "popular", label: "Popular" },
      { value: "top_rated", label: "Top Rated" },
      { value: "on_the_air", label: "On The Air" },
      { value: "trending", label: "Trending" },
    ];
  }
  // Fetch genres on mount
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch("/api/genres");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const genresData = await response.json();
        setGenres(genresData.genres || []);
      } catch (error) {
        console.error("Failed to fetch genres:", error);
        setGenres([]); // Ensure genres is always an array
      }
    };
    fetchGenres();
  }, []);

  // Update local state when initial filters change
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const handleFilterChange = (
    filterKey: keyof MediaFiltersData,
    value: string
  ) => {
    const newFilters = { ...filters, [filterKey]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const genreOptions = genres.map((genre) => ({
    value: genre.id.toString(),
    label: genre.name,
  }));

  const yearOptions = Array.from({ length: 30 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  const hasActive = filters.genre !== "" || filters.year !== "";
  const resetAll = () => {
    const next = { ...filters, genre: "", year: "" };
    setFilters(next);
    onFiltersChange(next);
  };

  const fieldLabel = "mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400";

  return (
    <div className="container mx-auto px-4 mb-8">
      <div className="space-y-5 rounded-2xl border border-gray-800 bg-gray-900/50 p-4 shadow-xl shadow-black/20 backdrop-blur-sm sm:p-5">
        {/* Category: товчлуурууд (гар утсан дээр хажуу тийш гүйлгэнэ) */}
        <div
          role="tablist"
          aria-label="Category"
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {categoryOptions.map((c) => {
            const active = filters.category === c.value;
            return (
              <button
                key={c.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleFilterChange("category", c.value)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-95 ${
                  active
                    ? "bg-theme-primary text-black font-semibold shadow-[0_0_14px_rgba(253,228,2,0.25)]"
                    : "border border-gray-700 bg-gray-800/60 text-gray-300 hover:border-gray-500 hover:text-white"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Genre / Year / Sort */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
          <div>
            <span className={fieldLabel}>Genre</span>
            <Filter
              label="Genre"
              options={genreOptions}
              value={filters.genre}
              onChange={(value) => handleFilterChange("genre", value)}
              resetLabel="All genres"
            />
          </div>
          <div>
            <span className={fieldLabel}>Year</span>
            <Filter
              label="Year"
              options={yearOptions}
              value={filters.year}
              onChange={(value) => handleFilterChange("year", value)}
              resetLabel="Any year"
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <span className={fieldLabel}>Sort by</span>
            <Filter
              label="Sort"
              options={sortOptions}
              value={filters.sortBy}
              onChange={(value) => handleFilterChange("sortBy", value)}
              includeReset={false}
            />
          </div>
          {hasActive && (
            <button
              type="button"
              onClick={resetAll}
              className="col-span-2 h-11 rounded-xl border border-gray-700 px-4 text-sm font-medium text-gray-300 transition-colors hover:border-red-400/60 hover:text-red-300 active:scale-95 md:col-span-1"
            >
              ✕ Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaFilter;
