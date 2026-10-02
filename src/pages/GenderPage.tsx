import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EmojiGrid } from '../components/EmojiGrid';
import { SearchBar } from '../components/SearchBar';
import { GENDER_EMOJIS } from '../data/emojis/index';
import { OFFICIAL_CATEGORIES } from '../data/unicodeCategories';

export const GenderPage: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'female' | 'male' | 'neutral' | 'symbols'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter emojis based on selected category and query
  const filteredEmojis = useMemo(() => {
    let list = GENDER_EMOJIS;
    if (selectedFilter === 'female') {
      list = list.filter(e => e.gender === 'female' || e.name.toLowerCase().includes('woman') || e.name.toLowerCase().includes('female') || e.name.toLowerCase().includes('girl'));
    } else if (selectedFilter === 'male') {
      list = list.filter(e => e.gender === 'male' || e.name.toLowerCase().includes('man') || e.name.toLowerCase().includes('male') || e.name.toLowerCase().includes('boy'));
    } else if (selectedFilter === 'neutral') {
      list = list.filter(e => e.gender === 'neutral' || e.name.toLowerCase().includes('person') || e.name.toLowerCase().includes('child') || e.name.toLowerCase().includes('adult'));
    } else if (selectedFilter === 'symbols') {
      list = list.filter(e => e.subcategory === 'gender' || e.name.includes('Sign') || e.name.includes('Symbol'));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(e => 
        e.name.toLowerCase().includes(q) || 
        (e.keywords && e.keywords.some(k => k.includes(q))) ||
        e.emoji === q
      );
    }
    return list;
  }, [selectedFilter, searchQuery]);

  const relatedCategories = OFFICIAL_CATEGORIES.filter(c => 
    c.id === 'people-body' || c.id === 'smileys-emotion' || c.id === 'symbols'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ name: 'Gender Emojis' }]} />

      {/* Header */}
      <div className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="text-4xl font-emoji p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-900/40">
              👥
            </span>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                Gender Emojis
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {GENDER_EMOJIS.length} gender-related emojis and variants in the official dataset
              </p>
            </div>
          </div>

          <div className="w-full sm:w-72">
            <SearchBar
              onSearchChange={setSearchQuery}
              placeholder="Search gender emojis..."
            />
          </div>
        </div>

        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-4xl">
          A dedicated collection of gender-related emojis dynamically aggregated from the official emoji specifications. Browse representations of women, men, gender-neutral persons, roles, activities, and gender identity symbols.
        </p>

        {/* Filter Segmented Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80'
            }`}
          >
            All ({GENDER_EMOJIS.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('female')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'female'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80'
            }`}
          >
            <span>👩 Women</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('male')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'male'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80'
            }`}
          >
            <span>👨 Men</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('neutral')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'neutral'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80'
            }`}
          >
            <span>🧑 Gender Neutral</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('symbols')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'symbols'
                ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80'
            }`}
          >
            <span>⚧ Symbols</span>
          </button>
        </div>
      </div>

      {/* Emoji Grid */}
      <section className="space-y-4">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Showing {filteredEmojis.length} emojis
        </div>
        <EmojiGrid
          emojis={filteredEmojis}
          emptyMessage="No gender emojis found matching your current filter."
        />
      </section>

      {/* Related Categories */}
      <section className="pt-10 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Related Categories
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {relatedCategories.map(rc => (
            <Link
              key={rc.slug}
              to={`/category/${rc.slug}/`}
              className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-400 dark:hover:border-amber-500 flex items-center gap-3 transition-all group"
            >
              <span className="text-3xl font-emoji group-hover:scale-110 transition-transform">
                {rc.icon}
              </span>
              <div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 block">
                  {rc.name}
                </span>
                <span className="text-xs text-slate-400">
                  {rc.subcategories.length} subcategories
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
