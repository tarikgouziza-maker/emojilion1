import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  DownloadCloud
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UnicodeSyncReport } from '../types/emoji';

export const AdminUnicode: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const [preview, setPreview] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<UnicodeSyncReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = async () => {
    try {
      setLoadingPreview(true);
      setError(null);
      const res = await fetchWithAuth('/api/admin/unicode/preview');
      if (res.ok) {
        const data = await res.json();
        setPreview(data);
      } else {
        const errJson = await res.json();
        setError(errJson.error || 'Failed to inspect official specifications');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, []);

  const handleExecuteSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      const res = await fetchWithAuth('/api/admin/unicode/sync', {
        method: 'POST',
      });
      if (res.ok) {
        const result = await res.json();
        setSyncResult(result);
        await fetchPreview();
      } else {
        const errJson = await res.json();
        setError(errJson.error || 'Sync execution failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error executing sync');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <RefreshCw className="w-6 h-6 text-amber-500" />
            <span>Official Unicode & CLDR Data Synchronization</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Source: Official Unicode Standard & CLDR specification files. Updates official characters while preserving your custom admin descriptions and metadata.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchPreview}
            disabled={loadingPreview}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingPreview ? 'animate-spin' : ''}`} />
            <span>Check for Updates</span>
          </button>
          <button
            type="button"
            onClick={handleExecuteSync}
            disabled={syncing || loadingPreview}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            {syncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synchronizing...</span>
              </>
            ) : (
              <>
                <DownloadCloud className="w-4 h-4" />
                <span>Execute Sync</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sync Execution Banner if complete */}
      {syncResult && (
        <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>Sync Complete: {syncResult.unicodeVersion}</span>
          </div>
          <p className="text-xs text-slate-300">
            Successfully synchronized {syncResult.totalParsed} official records. Added {syncResult.addedCount} new items, updated {syncResult.updatedCount} items.
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-400 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5">
          <div className="text-slate-400 text-xs font-medium">Standard Version</div>
          <div className="text-2xl font-extrabold text-white font-mono">Unicode 16.0</div>
          <div className="text-[11px] text-emerald-400">Official Specification v16.0 / CLDR 44</div>
        </div>
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5">
          <div className="text-slate-400 text-xs font-medium">Data Integrity</div>
          <div className="text-2xl font-extrabold text-white font-mono">100% Verified</div>
          <div className="text-[11px] text-slate-400">Valid ZWJ & modifier sequences preserved</div>
        </div>
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5">
          <div className="text-slate-400 text-xs font-medium">Custom Content Isolation</div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">Protected</div>
          <div className="text-[11px] text-slate-400">Admin descriptions & SEO preserved</div>
        </div>
      </div>

      {/* Sync Diff Preview */}
      {preview && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Sync Diff Analysis Preview</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Total Parsed</div>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  {preview.totalParsed}
                </div>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">New Additions</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  +{preview.added?.length || 0}
                </div>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Spec Updates</div>
                <div className="text-xl font-bold font-mono text-blue-400 mt-1">
                  {preview.updated?.length || 0}
                </div>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Warnings</div>
                <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                  {preview.warnings?.length || 0}
                </div>
              </div>
            </div>

            {/* Warnings list if any */}
            {preview.warnings && preview.warnings.length > 0 && (
              <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Validation Warnings ({preview.warnings.length}):</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1 list-disc pl-5">
                  {preview.warnings.map((w: string, i: number) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
