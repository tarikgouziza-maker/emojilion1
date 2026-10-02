import React from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { getCategoriesWithCounts } from '../data/emojis/index';
import { ArrowRight, FolderTree } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const categories = getCategoriesWithCounts();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ name: 'Categories' }]} />

      {/* Header */}
      <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <FolderTree className="w-8 h-8 text-amber-500" />
          <span>Emoji Categories</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-3xl leading-relaxed">
          Browse through all 9 official emoji categories and their corresponding subcategories. Click any category to explore all emojis in that group.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(category => (
          <div
            key={category.slug}
            className="flex flex-col justify-between p-6 bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-4xl font-emoji p-2 rounded-2xl bg-slate-50 dark:bg-slate-700/50">
                  {category.icon}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-full font-mono">
                  {category.emojiCount || category.subcategories.reduce((acc, s) => acc + (s.emojiCount || 0), 0)} Emojis
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1.5">
                <Link
                  to={`/category/${category.slug}/`}
                  className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  {category.name}
                </Link>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                {category.description}
              </p>

              {/* Subcategories preview tags */}
              <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Subcategories ({category.subcategories.length}):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {category.subcategories.slice(0, 5).map(sub => (
                    <Link
                      key={sub.slug}
                      to={`/category/${category.slug}/${sub.slug}/`}
                      className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                    >
                      {sub.name}
                    </Link>
                  ))}
                  {category.subcategories.length > 5 && (
                    <Link
                      to={`/category/${category.slug}/`}
                      className="text-xs px-2 py-0.5 rounded-md text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      +{category.subcategories.length - 5} more
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <Link
              to={`/category/${category.slug}/`}
              className="pt-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 flex items-center justify-between group"
            >
              <span>Explore {category.name}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
