import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Copy, Check, Tag, Layers } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EmojiCard } from '../components/EmojiCard';
import { EMOJI_BY_SLUG, getRelatedEmojis } from '../data/emojis/index';
import { CATEGORY_MAP } from '../data/unicodeCategories';
import { useToast } from '../context/ToastContext';
import { EmojiItem } from '../types/emoji';

export const EmojiDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { copyEmoji } = useToast();
  const [copied, setCopied] = useState(false);

  // Look up emoji in local dataset or fallback
  const baseEmoji = slug ? EMOJI_BY_SLUG.get(slug) : undefined;
  const [activeEmoji, setActiveEmoji] = useState<EmojiItem | null>(() => (baseEmoji ?? null));

  useEffect(() => {
    if (slug) {
      const found = EMOJI_BY_SLUG.get(slug) ?? null;
      setActiveEmoji(found);
      if (found) {
        // Track view
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'view', slug: found.slug })
        }).catch(() => {});
      }
    }
  }, [slug]);

  const currentEmoji = activeEmoji || baseEmoji;

  if (!baseEmoji || !currentEmoji) {
    return <Navigate to="/404" replace />;
  }

  const emojiChar = currentEmoji.emoji || (currentEmoji as any).character || '😀';
  const category = CATEGORY_MAP.get(currentEmoji.category);
  const subcategory = category?.subcategories.find(s => s.slug === currentEmoji.subcategory);
  const relatedEmojis = getRelatedEmojis(currentEmoji, 12);

  const handleCopy = async (char: string, name: string, e: React.MouseEvent) => {
    const success = await copyEmoji(char, name, e);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    'name': currentEmoji.name,
    'description': currentEmoji.customDescription || currentEmoji.description || `Emoji character ${emojiChar} named ${currentEmoji.name}.`,
    'termCode': currentEmoji.codePoint,
    'inDefinedTermSet': {
      '@type': 'DefinedTermSet',
      'name': 'EmojiLion Standard Reference',
      'url': typeof window !== 'undefined' ? window.location.origin : ''
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Schema.org Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { name: 'Categories', url: '/categories/' },
          ...(category ? [{ name: category.name, url: `/category/${category.slug}/` }] : []),
          ...(category && subcategory ? [{ name: subcategory.name, url: `/category/${category.slug}/${subcategory.slug}/` }] : []),
          { name: currentEmoji.name }
        ]}
      />

      {/* Hero Showcase Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left: Huge Display and Copy Action */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-8 sm:p-12 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm text-center">
          <span 
            className="text-8xl sm:text-9xl font-emoji my-4 drop-shadow-xs select-all animate-in zoom-in-95 duration-200"
            role="img"
            aria-label={currentEmoji.name}
          >
            {emojiChar}
          </span>

          <button
            type="button"
            onClick={e => handleCopy(emojiChar, currentEmoji.name, e)}
            className={`w-full max-w-xs mt-6 py-3.5 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-white hover:scale-102'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                <span>Copied {emojiChar} to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>Copy {emojiChar} Emoji</span>
              </>
            )}
          </button>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
            Click anywhere above or the button to copy
          </p>
        </div>

        {/* Right: Technical Reference & Metadata */}
        <div className="md:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">
              {category?.name} • {subcategory?.name}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              {currentEmoji.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
              CLDR Short Name: <span className="text-slate-700 dark:text-slate-300">{currentEmoji.cldrName}</span>
            </p>
          </div>

          {/* Description */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {currentEmoji.customDescription || (
              <>
                The <strong>{currentEmoji.name}</strong> emoji ({emojiChar}) was officially approved as part of the Emoji Standard version {currentEmoji.version}. It belongs to the <strong>{category?.name}</strong> category and the <strong>{subcategory?.name}</strong> group.
              </>
            )}
          </div>

          {/* Specification Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 w-1/3">
                    Code Point
                  </td>
                  <td className="px-4 py-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                    {currentEmoji.codePoint}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                    Hex Value
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-200">
                    {currentEmoji.codePointHex}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                    Category
                  </td>
                  <td className="px-4 py-3">
                    {category && (
                      <Link to={`/category/${category.slug}/`} className="text-amber-600 dark:text-amber-400 hover:underline">
                        {category.name}
                      </Link>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                    Subcategory
                  </td>
                  <td className="px-4 py-3">
                    {category && subcategory && (
                      <Link to={`/category/${category.slug}/${subcategory.slug}/`} className="text-amber-600 dark:text-amber-400 hover:underline">
                        {subcategory.name}
                      </Link>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                    Version
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                    Emoji {currentEmoji.version}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Keywords / Tags */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5" />
              <span>Keywords</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(currentEmoji.keywords || []).map(kw => (
                <span
                  key={kw}
                  className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Variations: Skin Tones & Gender */}
      {currentEmoji.variations && currentEmoji.variations.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Emoji Variations
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click any variation below to copy its sequence directly to your clipboard.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {currentEmoji.variations.map((v, idx) => (
              <div
                key={idx}
                onClick={e => handleCopy(v.emoji, v.label, e)}
                className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-400 text-center cursor-pointer transition-all hover:scale-102 group shadow-2xs"
              >
                <span className="text-4xl font-emoji block my-1 group-hover:scale-110 transition-transform">
                  {v.emoji}
                </span>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block line-clamp-1 mt-2">
                  {v.label}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block mt-1">
                  {v.codePoint}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related Emojis Section */}
      <section className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Related Emojis
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Other emojis in the {subcategory?.name || category?.name} group
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {relatedEmojis.map(re => (
            <EmojiCard key={re.id} emoji={re} />
          ))}
        </div>
      </section>
    </div>
  );
};
