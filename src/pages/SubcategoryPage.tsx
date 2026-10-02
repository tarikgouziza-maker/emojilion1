import React, { useState, useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EmojiGrid } from '../components/EmojiGrid';
import { SearchBar } from '../components/SearchBar';
import { OFFICIAL_CATEGORIES } from '../data/unicodeCategories';
import { ALL_EMOJIS } from '../data/emojis/index';

export const SubcategoryPage: React.FC = () => {
  const { categorySlug, subcategorySlug } = useParams<{ categorySlug: string; subcategorySlug: string }>();
  const [filterQuery, setFilterQuery] = useState<string>('');

  const category = OFFICIAL_CATEGORIES.find(c => c.slug === categorySlug);
  const subcategory = category?.subcategories.find(s => s.slug === subcategorySlug);

  if (!category || !subcategory) {
    return <Navigate to="/404" replace />;
  }

  // All emojis belonging to this subcategory
  const subcategoryEmojis = useMemo(() => {
    return ALL_EMOJIS.filter(e => e.subcategory === subcategory.slug);
  }, [subcategory.slug]);

  // Filtered
  const displayEmojis = useMemo(() => {
    if (!filterQuery.trim()) return subcategoryEmojis;
    const q = filterQuery.toLowerCase().trim();
    return subcategoryEmojis.filter(e => 
      e.name.toLowerCase().includes(q) || 
      (e.keywords && e.keywords.some(k => k.includes(q))) ||
      e.emoji === q
    );
  }, [subcategoryEmojis, filterQuery]);

  // Other subcategories in the same category
  const relatedSubcategories = category.subcategories.filter(s => s.slug !== subcategory.slug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { name: 'Categories', url: '/categories/' },
          { name: category.name, url: `/category/${category.slug}/` },
          { name: subcategory.name }
        ]}
      />

      {/* Header */}
      <div className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
              {category.name} Subcategory
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              {subcategory.name} Emojis
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {subcategoryEmojis.length} emojis in this group
            </p>
          </div>

          <div className="w-full sm:w-72">
            <SearchBar
              onSearchChange={setFilterQuery}
              placeholder={`Filter in ${subcategory.name}...`}
            />
          </div>
        </div>

        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-4xl">
          {subcategory.description}
        </p>
      </div>

      {/* Emoji Grid */}
      <section className="space-y-4">
        <EmojiGrid
          emojis={displayEmojis}
          emptyMessage={`No emojis match "${filterQuery}" in ${subcategory.name}.`}
        />
      </section>

      {/* Related Groups */}
      {relatedSubcategories.length > 0 && (
        <section className="pt-10 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Related Groups in {category.name}
          </h3>
          <div className="flex flex-wrap gap-2">
            {relatedSubcategories.map(rs => (
              <Link
                key={rs.slug}
                to={`/category/${category.slug}/${rs.slug}/`}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs font-medium transition-all"
              >
                {rs.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
