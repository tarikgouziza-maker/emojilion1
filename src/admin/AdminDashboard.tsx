import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Smile, 
  FolderTree, 
  Copy, 
  Eye, 
  Search, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminDashboard: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/api/admin/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
        <span>Loading system metrics...</span>
      </div>
    );
  }

  const { stats, topCopies, topViews, topSearches, recentActivity, syncStatus } = data;

  return (
    <div className="space-y-8">
      {/* Top Banner / System Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              System Overview & Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Official Dataset: <span className="text-amber-400 font-mono">{syncStatus?.version || 'Unicode 16.0'}</span> • Last Synced: {syncStatus?.lastSyncDate ? new Date(syncStatus.lastSyncDate).toLocaleDateString() : 'Active'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/unicode"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Official Data</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Emojis</span>
            <Smile className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {stats.totalEmojis.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{stats.activeEmojis} Active Public Pages</span>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Categories</span>
            <FolderTree className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {stats.totalCategories}
          </div>
          <div className="text-[11px] text-slate-400">
            {stats.totalSubcategories} Official Subgroups
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Copies</span>
            <Copy className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {stats.totalCopies.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            Real-time clipboard tracking
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Search Queries</span>
            <Search className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {stats.totalSearches.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            Keyword searches logged
          </div>
        </div>
      </div>

      {/* Analytics Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Copied Emojis */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span>Most Copied Emojis</span>
            </h3>
            <Link to="/admin/analytics" className="text-xs text-amber-500 hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-2.5">
            {topCopies.map((item: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl font-emoji">{item.emoji}</span>
                  <span className="font-medium text-slate-200 truncate">{item.name}</span>
                </div>
                <div className="font-mono text-amber-400 font-bold ml-2 shrink-0">
                  {item.count} copies
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Viewed Emojis */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-500" />
              <span>Most Viewed Pages</span>
            </h3>
            <Link to="/admin/analytics" className="text-xs text-blue-400 hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-2.5">
            {topViews.map((item: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl font-emoji">{item.emoji}</span>
                  <span className="font-medium text-slate-200 truncate">{item.name}</span>
                </div>
                <div className="font-mono text-blue-400 font-bold ml-2 shrink-0">
                  {item.count} views
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Search Queries */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-purple-500" />
              <span>Top User Searches</span>
            </h3>
            <Link to="/admin/analytics" className="text-xs text-purple-400 hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-2.5">
            {topSearches.map((item: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs"
              >
                <span className="font-mono text-slate-300">"{item.query}"</span>
                <span className="font-mono text-purple-400 font-bold">{item.count} searches</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity & Audit Logs */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>Recent System Activity</span>
          </h3>
          <Link to="/admin/audit-logs" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
            <span>View Full Audit Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-slate-800 text-xs">
          {recentActivity.map((log: any) => (
            <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="font-semibold text-white mr-2">
                  [{log.action}]
                </span>
                <span className="text-slate-400">{log.details}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono shrink-0">
                {new Date(log.timestamp).toLocaleString()} • {log.adminEmail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
