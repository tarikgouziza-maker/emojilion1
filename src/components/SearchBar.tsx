import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, Copy, Loader2 } from 'lucide-react';
import { EmojiItem } from '../types/emoji';
import { searchEmojis } from '../data/emojis/index';
import { CATEGORY_MAP } from '../data/unicodeCategories';
import { useToast } from '../context/ToastContext';

interface SearchBarProps {
  onSearchChange?: (query: string) => void;
  initialValue?: string;
  placeholder?: string;
  large?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearchChange,
  initialValue = '',
  placeholder = 'Search emojis... (e.g. heart, fire, smile, 1f600)',
  large = false,
}) => {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<EmojiItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeQueryRef = useRef<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const navigate = useNavigate();
  const { copyEmoji } = useToast();

  // Sync initialValue if it changes externally
  useEffect(() => {
    if (initialValue !== undefined && initialValue !== query) {
      setQuery(initialValue);
    }
  }, [initialValue]);

  // Execute search with race condition prevention and instant client fallback
  const performSearch = useCallback((rawQuery: string) => {
    const trimmed = rawQuery.trim();
    activeQueryRef.current = trimmed;

    // 1. Abort any previous in-flight HTTP request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 2. If empty, reset and close immediately
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      setIsOpen(false);
      if (onSearchChange) onSearchChange('');
      return;
    }

    setIsOpen(true);

    // 3. Instant client-side search for 0ms lag
    const instantResults = searchEmojis(trimmed, 10);
    setResults(instantResults);

    // Notify parent listener (e.g. for homepage grid)
    if (onSearchChange) {
      onSearchChange(trimmed);
    }

    // 4. Fetch from /api/emojis to ensure consistency with backend database
    setIsLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    fetch(`/api/emojis?q=${encodeURIComponent(trimmed)}&limit=10`, {
      signal: controller.signal
    })
      .then(res => {
        if (!res.ok) throw new Error('Search failed');
        return res.json();
      })
      .then(data => {
        // CRITICAL: Only update if this request matches the CURRENT query
        if (activeQueryRef.current === trimmed && Array.isArray(data.items)) {
          setResults(data.items);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          if (activeQueryRef.current === trimmed) {
            setIsLoading(false);
          }
        }
      });
  }, [onSearchChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    performSearch(val);
  };

  const handleClear = () => {
    setQuery('');
    activeQueryRef.current = '';
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setResults([]);
    setIsLoading(false);
    setIsOpen(false);
    if (onSearchChange) onSearchChange('');
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    if (query.trim().length > 0) {
      setIsOpen(true);
      if (results.length === 0) {
        performSearch(query);
      }
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation & escape key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' && results.length > 0 && isOpen) {
      e.preventDefault();
      handleSelect(results[0]);
    }
  };

  const handleSelect = (emoji: EmojiItem) => {
    setIsOpen(false);
    navigate(`/emoji/${emoji.slug}/`);
  };

  const handleQuickCopy = (e: React.MouseEvent, emoji: EmojiItem) => {
    e.stopPropagation();
    const char = emoji.emoji || (emoji as any).character || '';
    copyEmoji(char, emoji.name, e);
  };

  return (
    <div ref={containerRef} className="relative w-full z-40">
      {/* Input Box */}
      <div
        className={`relative flex items-center w-full bg-white dark:bg-slate-900 border transition-all duration-200 shadow-md rounded-2xl ${
          isOpen && query.trim()
            ? 'border-amber-500 ring-2 ring-amber-500/20'
            : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20'
        } ${large ? 'h-14 sm:h-16 px-4 sm:px-5' : 'h-11 sm:h-12 px-3 sm:px-4'}`}
      >
        <Search className={`text-slate-400 dark:text-slate-500 shrink-0 ${large ? 'w-6 h-6 mr-3' : 'w-4 h-4 mr-2.5'}`} />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none font-medium ${
            large ? 'text-base sm:text-lg' : 'text-sm'
          }`}
          aria-label="Search emojis"
          autoComplete="off"
          spellCheck="false"
        />

        {/* Loading Spinner or Clear Button */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {isLoading && query.trim() && (
            <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
          )}

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Suggestions Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-[calc(100%+0.5rem)] left-0 right-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-medium">
              {isLoading ? (
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Searching for &ldquo;{query}&rdquo;...
                </span>
              ) : results.length > 0 ? (
                <span>Matching Emojis ({results.length})</span>
              ) : (
                <span>Search Results</span>
              )}
            </span>
            <span className="text-slate-400 text-[10px]">
              Click result to inspect • Press Enter
            </span>
          </div>

          {/* Results List */}
          {results.length > 0 ? (
            <div className="max-h-80 sm:max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
              {results.map((emoji) => {
                const char = emoji.emoji || (emoji as any).character || '';
                const categoryObj = CATEGORY_MAP.get(emoji.category);
                const categoryName = categoryObj ? categoryObj.name : emoji.category;

                return (
                  <div
                    key={emoji.id || emoji.slug}
                    onClick={() => handleSelect(emoji)}
                    className="flex items-center justify-between p-3 sm:p-3.5 hover:bg-amber-50/70 dark:hover:bg-slate-800/80 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center min-w-0 pr-3">
                      {/* Emoji Icon / Character - Big, Clear, Unclipped */}
                      <span
                        className="text-3xl sm:text-4xl font-emoji shrink-0 select-none mr-3 sm:mr-4 w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-center leading-normal transition-transform duration-150 group-hover:scale-115"
                        role="img"
                        aria-label={emoji.name}
                      >
                        {char}
                      </span>

                      {/* Emoji Details */}
                      <div className="min-w-0 text-left">
                        <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                          {emoji.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                          <span className="font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                            {categoryName}
                          </span>
                          {emoji.subcategory && (
                            <>
                              <span className="text-slate-300 dark:text-slate-600 shrink-0">•</span>
                              <span className="capitalize text-slate-400 dark:text-slate-500 truncate">
                                {emoji.subcategory.replace(/-/g, ' ')}
                              </span>
                            </>
                          )}
                          <span className="hidden sm:inline-block font-mono text-[10px] text-slate-400/80 ml-1">
                            {emoji.codePoint}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Copy & Arrow Navigation */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleQuickCopy(e, emoji)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-500 hover:text-white transition-colors cursor-pointer"
                        title={`Copy ${char} to clipboard`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Copy</span>
                      </button>
                      <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="p-8 text-center space-y-2">
              <span className="text-4xl font-emoji block mb-1">🔍</span>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No emojis found
              </div>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                No emojis matched &ldquo;<span className="font-medium text-slate-600 dark:text-slate-300">{query}</span>&rdquo;. Try searching by name, keyword, or character.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
