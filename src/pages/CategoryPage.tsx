import React, { useState, useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EmojiGrid } from '../components/EmojiGrid';
import { SearchBar } from '../components/SearchBar';
import { OFFICIAL_CATEGORIES } from '../data/unicodeCategories';
import { ALL_EMOJIS } from '../data/emojis/index';

export const CategoryPage: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [activeSubcategory, setActiveSubcategory] = useState<string>('all');
  const [filterQuery, setFilterQuery] = useState<string>('');

  const category = OFFICIAL_CATEGORIES.find(c => c.slug === categorySlug);

  if (!category) {
    return <Navigate to="/404" replace />;
  }

  // All emojis belonging to this category
  const categoryEmojis = useMemo(() => {
    return ALL_EMOJIS.filter(e => e.category === category.id);
  }, [category.id]);

  // Filtered emojis
  const displayEmojis = useMemo(() => {
    let list = categoryEmojis;
    if (activeSubcategory !== 'all') {
      list = list.filter(e => e.subcategory === activeSubcategory);
    }
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase().trim();
      list = list.filter(e => 
        e.name.toLowerCase().includes(q) || 
        (e.keywords && e.keywords.some(k => k.includes(q))) ||
        e.emoji === q
      );
    }
    return list;
  }, [categoryEmojis, activeSubcategory, filterQuery]);

  // Related categories
  const relatedCategories = OFFICIAL_CATEGORIES.filter(c => c.slug !== category.slug).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { name: 'Categories', url: '/categories/' },
          { name: category.name }
        ]}
      />

      {/* Category Header */}
      <div className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-5xl font-emoji p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40">
              {category.icon}
            </span>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                {category.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {categoryEmojis.length} total emojis in this category
              </p>
            </div>
          </div>

          {/* Quick Search within this category */}
          <div className="w-full sm:w-72">
            <SearchBar
              onSearchChange={setFilterQuery}
              placeholder={`Filter ${category.name}...`}
            />
          </div>
        </div>

        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-4xl">
          {category.description}
        </p>

        {/* Subcategories Filter Tabs */}
        <div className="space-y-2 pt-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Filter by Subcategory:
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setActiveSubcategory('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                activeSubcategory === 'all'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80'
              }`}
            >
              All ({categoryEmojis.length})
            </button>
            {category.subcategories.map(sub => {
              const count = categoryEmojis.filter(e => e.subcategory === sub.slug).length;
              return (
                <button
                  key={sub.slug}
                  type="button"
                  onClick={() => setActiveSubcategory(sub.slug)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeSubcategory === sub.slug
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80'
                  }`}
                >
                  <span>{sub.name}</span>
                  <span className="opacity-60 text-[10px] font-mono">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Emoji Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Displaying {displayEmojis.length} emojis</span>
          {activeSubcategory !== 'all' && (
            <Link
              to={`/category/${category.slug}/${activeSubcategory}/`}
              className="text-amber-600 dark:text-amber-400 hover:underline"
            >
              Go to dedicated subcategory page →
            </Link>
          )}
        </div>
        <EmojiGrid
          emojis={displayEmojis}
          emptyMessage={`No emojis found matching your current filter in ${category.name}.`}
        />
      </section>

      {/* Related Categories */}
      <section className="pt-10 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Related Categories
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {relatedCategories.map(rc => (
            <Link
              key={rc.slug}
              to={`/category/${rc.slug}/`}
              className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-400 dark:hover:border-amber-500 text-center space-y-2 group transition-all"
            >
              <span className="text-3xl font-emoji block group-hover:scale-110 transition-transform">
                {rc.icon}
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 block truncate">
                {rc.name}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
