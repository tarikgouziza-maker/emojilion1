import React, { useState } from 'react';
import { EmojiItem } from '../types/emoji';
import { EmojiCard } from './EmojiCard';

interface EmojiGridProps {
  emojis: EmojiItem[];
  emptyMessage?: string;
  pageSize?: number;
}

export const EmojiGrid: React.FC<EmojiGridProps> = ({
  emojis,
  emptyMessage = 'No emojis found matching your criteria.',
  pageSize = 48
}) => {
  const [visibleCount, setVisibleCount] = useState<number>(pageSize);

  if (emojis.length === 0) {
    return (
      <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8">
        <span className="text-5xl font-emoji block mb-3">🔍</span>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
          No Emojis Found
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          {emptyMessage}
        </p>
      </div>
    );
  }

  const visibleList = emojis.slice(0, visibleCount);
  const hasMore = visibleCount < emojis.length;

  return (
    <div className="space-y-6">
      {/* Responsive Grid adhering to domain layout math */}
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
        {visibleList.map(emoji => (
          <EmojiCard key={emoji.id || emoji.slug} emoji={emoji} />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex flex-col items-center justify-center pt-6 gap-2">
          <button
            type="button"
            onClick={() => setVisibleCount(prev => prev + pageSize)}
            className="px-6 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs transition-all hover:scale-102 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-500"
          >
            Load More Emojis ({emojis.length - visibleCount} remaining)
          </button>
          <span className="text-xs text-slate-400">
            Showing {visibleList.length} of {emojis.length} emojis
          </span>
        </div>
      )}
    </div>
  );
};
