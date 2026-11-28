"use client";
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Filter from "./Filter";
import { TMDBMovie, TMDBTVShow, TMDBGenre } from "@/lib/types";
import { api } from "@/lib/api";

interface FilterState {
  genre: string;
  mediaType: string;
  year: string;
  minRating: string;
}

interface FilterWrapperProps {
  onResultsChange: (results: (TMDBMovie | TMDBTVShow)[]) => void;
  onLoadingChange: (isLoading: boolean) => void;
  onErrorChange: (error: string | null) => void;
}

/**
 * FilterWrapper - Independent filter system that uses TMDB discover API
 * This component is completely separate from search functionality
 */
const FilterWrapper= ({
  onResultsChange,
  onLoadingChange,
  onErrorChange,
}: FilterWrapperProps) => {
  const [filters, setFilters] = useState<FilterState>({
    genre: "",
    mediaType: "",
    year: "",
    minRating: "",
  });
  
  const [genres, setGenres] = useState<TMDBGenre[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Fetch genres on component mount
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const genresResponse = await api.getGenres();
        setGenres(genresResponse.genres);
      } catch (error) {
        console.error('Failed to fetch genres:', error);
        onErrorChange('Шүүлтүүрийн сонголтыг ачаалж чадсангүй');
      }
    };

    fetchGenres();
  }, [onErrorChange]);

  // Check if any filters are active
  useEffect(() => {
    const active = Object.values(filters).some(value => value !== "");
    setHasActiveFilters(active);
  }, [filters]);

  /**
   * Apply filters using TMDB discover API
   * This is independent of any search functionality
   */
  const applyFilters = async () => {
    if (!hasActiveFilters) {
      onErrorChange('Дор хаяж нэг шүүлтүүр сонгоно уу');
      return;
    }

    setIsApplying(true);
    onLoadingChange(true);
    onErrorChange(null);

    try {
      const results: (TMDBMovie | TMDBTVShow)[] = [];
      const errors: string[] = [];

      // Fetch movies if no media type filter or if media type is movie
      if (!filters.mediaType || filters.mediaType === 'movie') {
        try {
          const movieParams: Record<string, string | number> = { page: 1 };
          if (filters.genre) movieParams.genre = filters.genre;
          if (filters.year) movieParams.year = parseInt(filters.year);
          if (filters.minRating) movieParams.minRating = parseFloat(filters.minRating);

          const movieResults = await api.discover('movie', movieParams);
          results.push(...movieResults.results);
        } catch (error) {
          console.error('Movie discovery failed:', error);
          errors.push('Кино ачаалж чадсангүй');
        }
      }

      // Fetch TV shows if no media type filter or if media type is tv
      if (!filters.mediaType || filters.mediaType === 'tv') {
        try {
          const tvParams: Record<string, string | number> = { page: 1 };
          if (filters.genre) tvParams.genre = filters.genre;
          if (filters.year) tvParams.year = parseInt(filters.year);
          if (filters.minRating) tvParams.minRating = parseFloat(filters.minRating);

          const tvResults = await api.discover('tv', tvParams);
          results.push(...tvResults.results);
        } catch (error) {
          console.error('TV discovery failed:', error);
          errors.push('Цуврал ачаалж чадсангүй');
        }
      }

      // Handle results
      if (results.length === 0 && errors.length > 0) {
        onErrorChange(errors.join(', '));
      } else if (results.length === 0) {
        onErrorChange('Таны шүүлтүүрт тохирох контент олдсонгүй');
      } else {
        onResultsChange(results);
        if (errors.length > 0) {
          onErrorChange(`Partial results: ${errors.join(', ')}`);
        }
      }
    } catch (error) {
      console.error('Filter application failed:', error);
      onErrorChange('Шүүлтүүр хэрэгжүүлж чадсангүй. Дахин оролдоно уу.');
    } finally {
      setIsApplying(false);
      onLoadingChange(false);
    }
  };

  /**
   * Clear all filters and reset results
   */
  const clearFilters = () => {
    setFilters({
      genre: "",
      mediaType: "",
      year: "",
      minRating: "",
    });
    onResultsChange([]);
    onErrorChange(null);
  };

  /**
   * Handle individual filter changes
   */
  const handleFilterChange = (filterKey: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [filterKey]: value }));
  };

  // Prepare filter options
  const genreOptions = genres.map(genre => ({ 
    value: genre.id.toString(), 
    label: genre.name 
  }));

  const mediaTypeOptions = [
    { value: "movie", label: "Кино" },
    { value: "tv", label: "Цуврал" },
  ];

  const yearOptions = Array.from({ length: 30 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  const ratingOptions = [
    { value: "7", label: "7.0+" },
    { value: "8", label: "8.0+" },
    { value: "9", label: "9.0+" },
  ];

  return (
    <div className="glass-container mx-4 my-6 border-gray-700">
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-white">Контент хайх</h2>
        <p className="text-gray-400 text-xs sm:text-sm hidden sm:block">Шүүлтүүрээр кино, цуврал олоорой</p>
      </div>

      {/* Mobile Layout: 2 columns + centered button */}
      <div className="block md:hidden">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Genre Filter */}
          <>
            <Label className="filter-label-xs">
              Төрөл
            </Label>
            <Filter
              label="Төрөл"
              options={genreOptions}
              value={filters.genre}
              onChange={(value) => handleFilterChange('genre', value)}
              includeReset={true}
              resetLabel="Бүгд"
            />
          </>

          {/* Media Type Filter */}
          <>
            <Label className="filter-label-xs">
              Ангилал
            </Label>
            <Filter
              label="Ангилал"
              options={mediaTypeOptions}
              value={filters.mediaType}
              onChange={(value) => handleFilterChange('mediaType', value)}
              includeReset={true}
              resetLabel="Бүгд"
            />
          </>

          {/* Year Filter */}
          <>
            <Label className="filter-label-xs">
              Он
            </Label>
            <Filter
              label="Он"
              options={yearOptions}
              value={filters.year}
              onChange={(value) => handleFilterChange('year', value)}
              includeReset={true}
              resetLabel="Бүгд"
            />
          </>

          {/* Rating Filter */}
          <>
            <Label className="filter-label-xs">
              Үнэлгээ
            </Label>
            <Filter
              label="Үнэлгээ"
              options={ratingOptions}
              value={filters.minRating}
              onChange={(value) => handleFilterChange('minRating', value)}
              includeReset={true}
              resetLabel="Бүгд"
            />
          </>
        </div>

        {/* Mobile Action Buttons - Centered */}
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={applyFilters}
            disabled={isApplying || !hasActiveFilters}
            size="sm"
            className="bg-primary hover:bg-light-primary disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold smooth-transition transform hover:scale-105 disabled:hover:scale-100 disabled:opacity-50"
          >
            {isApplying ? (
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                Хайж байна...
              </span>
            ) : (
              'Хайх'
            )}
          </Button>

          <Button
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            size="sm"
            variant="outline"
            className="group relative p-2 bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-sm border border-gray-600/50 text-gray-300 hover:from-red-900/20 hover:to-red-800/20 hover:border-red-500/60 hover:text-red-400 hover:shadow-lg hover:shadow-red-500/20 disabled:from-gray-800/40 disabled:to-gray-700/40 disabled:border-gray-700/30 disabled:text-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-110 disabled:hover:scale-100 rounded-lg overflow-hidden"
            aria-label="Бүх шүүлтүүрийг арилгах"
            title="Бүх шүүлтүүрийг арилгах"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-red-400/0 group-hover:from-red-500/10 group-hover:to-red-400/10 transition-all duration-300" />
            <X className="w-4 h-4 relative z-10 transition-transform duration-200 group-hover:rotate-90" />
          </Button>
        </div>

        {/* Mobile Active Filter Indicator */}
        {hasActiveFilters && (
          <div className="text-center mt-2">
            <div className="text-xs text-primary font-medium">
              {Object.values(filters).filter(v => v !== "").length} идэвхтэй
            </div>
          </div>
        )}
      </div>

      {/* Desktop Layout: Single row from md breakpoint */}
      <div className="hidden md:block">
        <div className="flex items-end gap-3 mb-4">
          {/* Genre Filter */}
          <div className="flex-1">
            <Label className="block filter-label-sm mb-2">
              Төрөл
            </Label>
            <Filter
              label="Төрөл сонгох"
              options={genreOptions}
              value={filters.genre}
              onChange={(value) => handleFilterChange('genre', value)}
              includeReset={true}
              resetLabel="Бүх төрөл"
            />
          </div>

          {/* Media Type Filter */}
          <div className="flex-1">
            <Label className="block filter-label-sm mb-2">
              Контентын ангилал
            </Label>
            <Filter
              label="Ангилал сонгох"
              options={mediaTypeOptions}
              value={filters.mediaType}
              onChange={(value) => handleFilterChange('mediaType', value)}
              includeReset={true}
              resetLabel="Кино ба цуврал"
            />
          </div>

          {/* Year Filter */}
          <div className="flex-1">
            <Label className="block filter-label-sm mb-2">
              Гарсан он
            </Label>
            <Filter
              label="Он сонгох"
              options={yearOptions}
              value={filters.year}
              onChange={(value) => handleFilterChange('year', value)}
              includeReset={true}
              resetLabel="Бүх он"
            />
          </div>

          {/* Rating Filter */}
          <div className="flex-1">
            <Label className="block filter-label-sm mb-2">
              Доод үнэлгээ
            </Label>
            <Filter
              label="Үнэлгээ сонгох"
              options={ratingOptions}
              value={filters.minRating}
              onChange={(value) => handleFilterChange('minRating', value)}
              includeReset={true}
              resetLabel="Бүх үнэлгээ"
            />
          </div>

          {/* Desktop Action Buttons */}
          <div className="flex gap-2 ml-2">
            <Button
              onClick={applyFilters}
              disabled={isApplying || !hasActiveFilters}
              className="px-6 py-2.5 bg-primary hover:bg-light-primary disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold smooth-transition transform hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 whitespace-nowrap"
            >
              {isApplying ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Хайж байна...
                </span>
              ) : (
                'Хайх'
              )}
            </Button>

            <Button
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              variant="outline"
              className="group relative p-2.5 bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-sm border border-gray-600/50 text-gray-300 hover:from-red-900/20 hover:to-red-800/20 hover:border-red-500/60 hover:text-red-400 hover:shadow-lg hover:shadow-red-500/20 disabled:from-gray-800/40 disabled:to-gray-700/40 disabled:border-gray-700/30 disabled:text-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-110 disabled:hover:scale-100 rounded-lg overflow-hidden"
              aria-label="Бүх шүүлтүүрийг арилгах"
              title="Бүх шүүлтүүрийг арилгах"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-red-400/0 group-hover:from-red-500/10 group-hover:to-red-400/10 transition-all duration-300" />
              <X className="w-5 h-5 relative z-10 transition-transform duration-200 group-hover:rotate-90" />
            </Button>
          </div>
        </div>

        {/* Desktop Active Filter Indicator */}
        {hasActiveFilters && (
          <div className="text-right">
            <div className="text-sm text-primary font-medium">
              {Object.values(filters).filter(v => v !== "").length} шүүлтүүр идэвхтэй
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterWrapper;