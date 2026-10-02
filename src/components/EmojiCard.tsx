import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check } from 'lucide-react';
import { EmojiItem } from '../types/emoji';
import { useToast } from '../context/ToastContext';

interface EmojiCardProps {
  emoji: EmojiItem;
  size?: 'normal' | 'large' | 'sm';
  showDetailsLink?: boolean;
}

export const EmojiCard: React.FC<EmojiCardProps> = ({ 
  emoji, 
  size = 'normal',
  showDetailsLink = true 
}) => {
  const { copyEmoji } = useToast();
  const [justCopied, setJustCopied] = useState(false);

  const emojiChar = emoji.emoji || (emoji as any).character || '😀';

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const success = await copyEmoji(emojiChar, emoji.slug, e);
    if (success) {
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1500);
    }
  };

  const isLarge = size === 'large';
  const isSm = size === 'sm';

  return (
    <div
      className="group relative flex flex-col items-center justify-between p-3 sm:p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-400 dark:hover:border-amber-500/80 shadow-xs hover:shadow-md transition-all duration-200 text-center select-none"
    >
      {/* Clickable Card Body for Quick Copy */}
      <button
        type="button"
        onClick={handleCopy}
        className="w-full flex flex-col items-center focus-visible:outline-2 focus-visible:outline-amber-500 rounded-xl cursor-pointer"
        aria-label={`Copy emoji: ${emoji.name} ${emojiChar}`}
        title={`Click to copy ${emoji.name}`}
      >
        {/* Large Emoji Character */}
        <span 
          className={`font-emoji leading-none my-2 transition-transform duration-200 group-hover:scale-115 ${
            isLarge ? 'text-5xl sm:text-6xl' : isSm ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl'
          }`}
          role="img"
          aria-label={emoji.name}
        >
          {emojiChar}
        </span>

        {/* Emoji Name */}
        <span className="w-full text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors mt-2">
          {emoji.name}
        </span>
      </button>

      {/* Action Bar (Copy Button & Detail Link) */}
      <div className="w-full mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-1 text-[11px]">
        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg font-medium transition-all ${
            justCopied
              ? 'bg-emerald-500 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500'
          }`}
          title="Copy emoji character"
        >
          {justCopied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 opacity-70" />
              <span>Copy</span>
            </>
          )}
        </button>

        {/* View Details Link */}
        {showDetailsLink && (
          <Link
            to={`/emoji/${emoji.slug}/`}
            className="px-2 py-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
            title={`View info and variations for ${emoji.name}`}
          >
            Info
          </Link>
        )}
      </div>
    </div>
  );
};
