import React, { useState } from 'react';
import { Search, Globe, FileCode, Check, Save } from 'lucide-react';

export const AdminSeo: React.FC = () => {
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
          <Search className="w-6 h-6 text-amber-500" />
          <span>SEO & Metadata Management</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure search engine indexing, Open Graph social share cards, dynamic sitemaps, and robots directives.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Global SEO Settings */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <span>Global Site SEO Configuration</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Default Title Pattern</label>
              <input
                type="text"
                defaultValue="EmojiLion — The Complete Modern Emoji Reference"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Default Meta Description</label>
              <textarea
                rows={3}
                defaultValue="Explore, search, and copy thousands of emojis with categories, variations, gender collections, and detailed reference specifications."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Open Graph Default Share Image</label>
              <input
                type="text"
                defaultValue="/og-image.png"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setSaved(true);
                setTimeout(() => setSaved(false), 1500);
              }}
              className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{saved ? 'Saved!' : 'Save SEO Configuration'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Sitemap & Robots Status */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span>Search Engine Endpoints</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Dynamic XML Sitemap</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">Active</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Automatically generates canonical URLs for all categories, subcategories, gender pages, and individual emoji pages.
              </p>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-amber-400 hover:underline font-mono text-[11px]"
              >
                Inspect /sitemap.xml ↗
              </a>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Robots.txt Directives</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">Configured</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Disallows private <code>/admin/</code> and <code>/api/</code> routes from crawler indexing.
              </p>
              <a
                href="/robots.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-amber-400 hover:underline font-mono text-[11px]"
              >
                Inspect /robots.txt ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
