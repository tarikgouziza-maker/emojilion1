import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6">
      <span className="text-8xl font-emoji block mb-2" role="img" aria-label="Confused Face">
        😕
      </span>
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">
        404 — Page Not Found
      </h1>
      <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
        The emoji, category, or page you were looking for doesn't exist or may have been moved.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
        <Link
          to="/"
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Go to Homepage</span>
        </Link>
        <Link
          to="/categories/"
          className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-xl transition-colors"
        >
          Browse Categories
        </Link>
      </div>
    </div>
  );
};
