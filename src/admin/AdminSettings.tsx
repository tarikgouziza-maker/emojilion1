import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Settings, Save, Check, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SiteSettings } from '../types/emoji';
import { AdminAccount } from './AdminAccount';

export const AdminSettings: React.FC<{ isFeaturedView?: boolean }> = ({ isFeaturedView = false }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'account' ? 'account' : 'general';
  const [activeTab, setActiveTab] = useState<'general' | 'account'>(initialTab);

  const { fetchWithAuth } = useAuth();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'account') {
      setActiveTab('account');
    }
  }, [searchParams]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetchWithAuth('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    loadSettings();
  }, [fetchWithAuth]);

  const handleTabChange = (tab: 'general' | 'account') => {
    setActiveTab(tab);
    setSearchParams(tab === 'account' ? { tab: 'account' } : {});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      setSaving(true);
      const res = await fetchWithAuth('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (isFeaturedView) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="border-b border-slate-800 pb-5">
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-amber-500" />
            <span>Featured Content Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage highlighted categories and pinned sections on the EmojiLion homepage.
          </p>
        </div>

        {settings && (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Featured Categories (Slugs)</label>
                <input
                  type="text"
                  value={(settings.featuredCategorySlugs || []).join(', ')}
                  onChange={e => setSettings({
                    ...settings,
                    featuredCategorySlugs: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              {saving ? <span>Saving...</span> : saved ? <><Check className="w-4 h-4" /><span>Saved!</span></> : <><Save className="w-4 h-4" /><span>Save Featured Content</span></>}
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
        <button
          type="button"
          onClick={() => handleTabChange('general')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'general'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Site Configuration</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('account')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'account'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Admin Account & Security</span>
        </button>
      </div>

      {activeTab === 'account' ? (
        <AdminAccount />
      ) : !settings ? (
        <div className="text-slate-400 p-8 text-xs">Loading settings...</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Platform Brand Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={e => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Public Site Description</label>
              <textarea
                rows={3}
                value={settings.siteDescription}
                onChange={e => setSettings({ ...settings, siteDescription: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Support / Contact Email</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={e => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="font-semibold text-slate-300">System Feature Flags</div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableAnalytics}
                  onChange={e => setSettings({ ...settings, enableAnalytics: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-slate-300">Enable First-Party Analytics (Views, Copies, Searches)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableLiveUnicodeSync}
                  onChange={e => setSettings({ ...settings, enableLiveUnicodeSync: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-slate-300">Enable Official Live Data Syncing</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            {saving ? (
              <span>Saving Settings...</span>
            ) : saved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved Successfully!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save System Settings</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
