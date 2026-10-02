import React from 'react';
import { Link } from 'react-router-dom';
import { OFFICIAL_CATEGORIES } from '../data/unicodeCategories';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Mission */}
          <div className="md:col-span-1 space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-emoji">🦁</span>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white">
                Emoji<span className="text-[#2563EB]">Lion</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              The modern, fast, and comprehensive reference guide to emojis. Copy with one click, explore variations, and discover detailed specifications.
            </p>
          </div>

          {/* Categories 1 */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Popular Categories
            </h4>
            <ul className="space-y-2 text-sm">
              {OFFICIAL_CATEGORIES.slice(0, 5).map(cat => (
                <li key={cat.slug}>
                  <Link
                    to={`/category/${cat.slug}/`}
                    className="text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-2 transition-colors"
                  >
                    <span className="font-emoji">{cat.icon}</span>
                    <span>{cat.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories 2 */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              More Categories
            </h4>
            <ul className="space-y-2 text-sm">
              {OFFICIAL_CATEGORIES.slice(5).map(cat => (
                <li key={cat.slug}>
                  <Link
                    to={`/category/${cat.slug}/`}
                    className="text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-2 transition-colors"
                  >
                    <span className="font-emoji">{cat.icon}</span>
                    <span>{cat.name}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/gender/"
                  className="text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-2 transition-colors"
                >
                  <span className="font-emoji">👥</span>
                  <span>Gender Collection</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & SEO */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/categories/" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                  All Emoji Categories
                </Link>
              </li>
              <li>
                <Link to="/gender/" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                  Gender Variations
                </Link>
              </li>
              <li>
                <a href="/sitemap.xml" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                  XML Sitemap
                </a>
              </li>
              <li>
                <a href="/robots.txt" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                  Robots Spec
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
          <p>© {new Date().getFullYear()} EmojiLion. Official Emoji Reference & Directory.</p>
          <p>Click any emoji to copy character instantly.</p>
        </div>
      </div>
    </footer>
  );
};
