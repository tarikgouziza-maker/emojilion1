import React, { useState, useEffect } from 'react';
import { BarChart3, Search, Copy, Eye, RefreshCw, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminAnalytics: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/api/admin/analytics');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
        <span>Loading analytics records...</span>
      </div>
    );
  }

  const { topSearches, topCopies, totalSearches, totalCopies, totalViews } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-amber-500" />
            <span>First-Party Emoji Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Privacy-friendly first-party tracking for emoji views, clipboard copies, and search terms without third-party trackers.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Aggregate Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Copy className="w-3.5 h-3.5 text-emerald-400" />
            <span>Total Emoji Copies</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{totalCopies.toLocaleString()}</div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span>Total Emoji Page Views</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{totalViews.toLocaleString()}</div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-purple-400" />
            <span>Total Search Queries</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{totalSearches.toLocaleString()}</div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Copied */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Top Copied Characters</span>
          </h3>

          <div className="space-y-2 text-xs">
            {topCopies.map((item: any, i: number) => {
              const max = topCopies[0]?.count || 1;
              const pct = Math.round((item.count / max) * 100);
              return (
                <div key={i} className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-emoji">{item.emoji}</span>
                      <span className="font-semibold text-slate-200">{item.name}</span>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold">{item.count} copies</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Most Searched Queries */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-purple-400" />
            <span>Top Searched Terms</span>
          </h3>

          <div className="space-y-2 text-xs">
            {topSearches.map((item: any, i: number) => {
              const max = topSearches[0]?.count || 1;
              const pct = Math.round((item.count / max) * 100);
              return (
                <div key={i} className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-slate-200 font-semibold">"{item.query}"</span>
                    <span className="font-mono text-purple-400 font-bold">{item.count} searches</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
