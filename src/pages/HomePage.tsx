import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Flame, FolderTree, Users, ArrowRight } from 'lucide-react';
import { SearchBar } from '../components/SearchBar';
import { EmojiGrid } from '../components/EmojiGrid';
import { FEATURED_EMOJIS, searchEmojis } from '../data/emojis/index';
import { OFFICIAL_CATEGORIES } from '../data/unicodeCategories';
import { EmojiItem } from '../types/emoji';
import heroEmojiBg from '../assets/images/emoji_thumbs_bg_1790439850365.jpg';

export const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EmojiItem[]>([]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setSearchResults(searchEmojis(query, 120));
    } else {
      setSearchResults([]);
    }
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section with exact emoji background image */}
      <section className="relative overflow-hidden py-14 sm:py-20 md:py-24 border-b border-blue-900/40 bg-slate-950">
        {/* Background Image of the Emoji - Clear, Bright, and Centered */}
        <div className="absolute inset-0 select-none overflow-hidden">
          <img
            src={heroEmojiBg}
            alt="EmojiLion Emoji Background"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center transform scale-100"
          />
          {/* Subtle soft edge vignettes so the emoji stays vibrant while seamlessly blending with header and page */}
          <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_35%,rgba(15,23,42,0.55)_85%,rgba(2,6,23,0.85)_100%] pointer-events-none" />
          <div className="absolute inset-0 bg-linear-to-b from-slate-950/30 via-transparent to-slate-950/75 pointer-events-none" />
        </div>

        {/* Text and Search elements positioned directly over the background */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 relative z-10">
          {/* Brand Headline with strong contrast drop shadows */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
              Emoji<span className="text-[#38BDF8] drop-shadow-[0_0_25px_rgba(56,189,248,0.95)]">Lion</span>
            </h1>
            <p className="text-base sm:text-xl text-white max-w-2xl mx-auto leading-relaxed font-semibold drop-shadow-[0_2px_12px_rgba(0,0,0,1)]">
              The modern reference guide to thousands of emojis. Search instantly, copy with one click, and explore rich variations and code points.
            </p>
          </div>

          {/* Large Hero Search Bar with Frosted Glass Panel */}
          <div className="max-w-2xl mx-auto pt-2 drop-shadow-2xl relative z-30">
            <div className="p-1 rounded-2xl bg-slate-900/65 backdrop-blur-md border border-white/25 shadow-2xl relative z-30">
              <SearchBar 
                onSearchChange={handleSearchChange} 
                large={true}
                placeholder="Search emojis... (e.g. fire, laughing, dog, 1f600)"
              />
            </div>
          </div>

          {/* Quick Filter Jump Links with Glass Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm pt-2 relative z-10">
            <span className="font-bold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">Quick jumps:</span>
            <Link 
              to="/category/smileys-emotion/"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900/75 hover:bg-slate-900 text-white font-medium border border-white/20 backdrop-blur-md transition-all shadow-md hover:border-blue-400 hover:scale-105"
            >
              😃 Smileys
            </Link>
            <span className="text-white/80 font-bold drop-shadow-sm">•</span>
            <Link 
              to="/category/people-body/"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900/75 hover:bg-slate-900 text-white font-medium border border-white/20 backdrop-blur-md transition-all shadow-md hover:border-blue-400 hover:scale-105"
            >
              👋 People
            </Link>
            <span className="text-white/80 font-bold drop-shadow-sm">•</span>
            <Link 
              to="/category/animals-nature/"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900/75 hover:bg-slate-900 text-white font-medium border border-white/20 backdrop-blur-md transition-all shadow-md hover:border-blue-400 hover:scale-105"
            >
              🐶 Animals
            </Link>
            <span className="text-white/80 font-bold drop-shadow-sm">•</span>
            <Link 
              to="/category/food-drink/"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900/75 hover:bg-slate-900 text-white font-medium border border-white/20 backdrop-blur-md transition-all shadow-md hover:border-blue-400 hover:scale-105"
            >
              🍔 Food
            </Link>
            <span className="text-white/80 font-bold drop-shadow-sm">•</span>
            <Link 
              to="/gender/"
              className="px-3.5 py-1.5 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white font-semibold border border-blue-400/60 backdrop-blur-md transition-all shadow-md hover:scale-105"
            >
              👥 Gender Collection
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* If Active Search Query, Display Live Search Results */}
        {searchQuery.trim() ? (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Search Results for "{searchQuery}"
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Found {searchResults.length} matching emojis
                </p>
              </div>
            </div>
            <EmojiGrid emojis={searchResults} emptyMessage={`No emojis matched "${searchQuery}". Try a different keyword, name, or code point.`} />
          </section>
        ) : (
          <>
            {/* Popular / Featured Emojis */}
            <section id="popular" className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <Flame className="w-5 h-5 text-amber-500" />
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Popular Emojis
                  </h2>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Most frequently copied
                </span>
              </div>
              <EmojiGrid emojis={FEATURED_EMOJIS} pageSize={24} />
            </section>

            {/* Browse Categories Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <FolderTree className="w-5 h-5 text-blue-500" />
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Browse Categories
                  </h2>
                </div>
                <Link
                  to="/categories/"
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  View All Categories <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {OFFICIAL_CATEGORIES.map(category => (
                  <Link
                    key={category.slug}
                    to={`/category/${category.slug}/`}
                    className="group relative p-5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-400 dark:hover:border-amber-500/80 shadow-xs hover:shadow-md transition-all duration-200 flex items-start gap-4"
                  >
                    <span className="text-4xl font-emoji p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 group-hover:scale-110 transition-transform">
                      {category.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                          {category.name}
                        </h3>
                        <span className="text-xs text-slate-400 font-mono">
                          {category.subcategories.length} groups
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {category.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Gender Emojis Featured Section */}
            <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-linear-to-r from-purple-500/10 via-pink-500/10 to-amber-500/10 border border-purple-200/60 dark:border-purple-900/40">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider">
                    <Users className="w-4 h-4" />
                    <span>Special Collection</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Gender Emojis Collection
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Explore our comprehensive collection of gender-related emojis: women, men, gender-neutral representations, professions, activities, and gender symbols.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex items-center gap-2 text-3xl font-emoji p-2 bg-white/80 dark:bg-slate-900/80 rounded-2xl shadow-xs">
                    <span>👩‍⚕️</span>
                    <span>👨‍💻</span>
                    <span>🧑‍🎨</span>
                    <span>♀️</span>
                    <span>♂️</span>
                  </div>
                  <Link
                    to="/gender/"
                    className="w-full sm:w-auto px-5 py-3 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2"
                  >
                    <span>Explore Gender Emojis</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};
