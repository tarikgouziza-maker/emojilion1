import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Edit3, 
  Check, 
  X, 
  Star, 
  Eye, 
  EyeOff, 
  Save, 
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OFFICIAL_CATEGORIES } from '../data/unicodeCategories';
import { EmojiItem } from '../types/emoji';

export const AdminEmojis: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const [emojis, setEmojis] = useState<EmojiItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  // Editing state
  const [editingEmoji, setEditingEmoji] = useState<EmojiItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newEmojiData, setNewEmojiData] = useState<any>({
    character: '',
    name: '',
    slug: '',
    category: OFFICIAL_CATEGORIES[0]?.id || 'smileys-emotion',
    subcategory: OFFICIAL_CATEGORIES[0]?.subcategories[0]?.id || 'face-smiling',
    keywords: [],
    description: '',
    status: 'active',
    isFeatured: false
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchEmojis = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedSubcategory) params.set('subcategory', selectedSubcategory);
      params.set('limit', '100');

      const res = await fetchWithAuth(`/api/admin/emojis?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmojis(data.items);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Failed to fetch emojis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmojis();
  }, [searchQuery, selectedCategory, selectedSubcategory]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmoji) return;
    try {
      setSaving(true);
      const res = await fetchWithAuth(`/api/admin/emojis/${editingEmoji.id || editingEmoji.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingEmoji)
      });
      if (res.ok) {
        const updated = await res.json();
        setEmojis(prev => prev.map(em => (em.id === updated.id || em.slug === updated.slug) ? updated : em));
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setEditingEmoji(null);
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to save emoji:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateEmoji = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmojiData.character || !newEmojiData.name) return;
    try {
      setSaving(true);
      const res = await fetchWithAuth('/api/admin/emojis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmojiData)
      });
      if (res.ok) {
        const created = await res.json();
        setEmojis(prev => [created, ...prev]);
        setTotal(t => t + 1);
        setIsCreating(false);
        setNewEmojiData({
          character: '',
          name: '',
          slug: '',
          category: OFFICIAL_CATEGORIES[0]?.id || 'smileys-emotion',
          subcategory: OFFICIAL_CATEGORIES[0]?.subcategories[0]?.id || 'face-smiling',
          keywords: [],
          description: '',
          status: 'active',
          isFeatured: false
        });
      }
    } catch (err) {
      console.error('Failed to create emoji:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmoji = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/admin/emojis/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setEmojis(prev => prev.filter(em => em.id !== id && em.slug !== id));
        setTotal(t => Math.max(0, t - 1));
        setDeleteConfirmId(null);
      }
    } catch (err) {
      console.error('Failed to delete emoji:', err);
    }
  };

  const handleQuickToggleFeature = async (emoji: EmojiItem) => {
    const updated = { ...emoji, isFeatured: !emoji.isFeatured };
    try {
      const res = await fetchWithAuth(`/api/admin/emojis/${emoji.id || emoji.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        setEmojis(prev => prev.map(em => (em.id === emoji.id || em.slug === emoji.slug) ? updated : em));
      }
    } catch (err) {
      console.error('Failed to toggle feature status:', err);
    }
  };

  const handleQuickToggleStatus = async (emoji: EmojiItem) => {
    const newStatus: 'active' | 'hidden' = emoji.status === 'hidden' ? 'active' : 'hidden';
    const updated: EmojiItem = { ...emoji, status: newStatus };
    try {
      const res = await fetchWithAuth(`/api/admin/emojis/${emoji.id || emoji.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        setEmojis(prev => prev.map(em => (em.id === emoji.id || em.slug === emoji.slug) ? updated : em));
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const currentCatObj = OFFICIAL_CATEGORIES.find(c => c.id === selectedCategory);
  const subcategoryOptions = currentCatObj ? currentCatObj.subcategories : [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Emoji Catalog Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Displaying {emojis.length} of {total.toLocaleString()} total emojis in database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Emoji</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-500 absolute left-3" />
          <input
            type="text"
            placeholder="Search by name, slug, or character..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={e => {
            setSelectedCategory(e.target.value);
            setSelectedSubcategory('');
          }}
          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value="">All Categories ({OFFICIAL_CATEGORIES.length})</option>
          {OFFICIAL_CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>

        <select
          value={selectedSubcategory}
          onChange={e => setSelectedSubcategory(e.target.value)}
          disabled={!selectedCategory}
          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-amber-500 disabled:opacity-50 cursor-pointer"
        >
          <option value="">All Subcategories</option>
          {subcategoryOptions.map(sub => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>
      </div>

      {/* Emojis Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Emoji</th>
              <th className="px-4 py-3">Name & Slug</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Codepoint</th>
              <th className="px-4 py-3 text-center">Featured</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
                  Loading emojis from database...
                </td>
              </tr>
            ) : emojis.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-500">
                  No emojis match the current filter or search query.
                </td>
              </tr>
            ) : (
              emojis.map(emoji => {
                const char = emoji.emoji || (emoji as any).character;
                const isHidden = emoji.status === 'hidden';

                return (
                  <tr key={emoji.id || emoji.slug} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-2.5">
                      <span className="text-2xl font-emoji select-none">{char}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-bold text-white">{emoji.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{emoji.slug}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="text-slate-300">{emoji.category}</div>
                      <div className="text-[10px] text-slate-500">{emoji.subcategory}</div>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">
                      {emoji.codePoint}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleQuickToggleFeature(emoji)}
                        className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                          emoji.isFeatured
                            ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                            : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'
                        }`}
                        title={emoji.isFeatured ? 'Featured in Popular' : 'Mark as Featured'}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleQuickToggleStatus(emoji)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer transition-colors ${
                          isHidden
                            ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{isHidden ? 'Hidden' : 'Active'}</span>
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingEmoji(emoji)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                          title="Edit Emoji Metadata"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        
                        {deleteConfirmId === (emoji.id || emoji.slug) ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteEmoji(emoji.id || emoji.slug)}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="p-1 text-slate-400 hover:text-white cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(emoji.id || emoji.slug)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                            title="Delete Emoji"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add New Emoji Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500" />
                <span>Add New Emoji</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEmoji} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Emoji Character</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 🦁"
                    value={newEmojiData.character || ''}
                    onChange={e => setNewEmojiData({ ...newEmojiData, character: e.target.value })}
                    className="w-full text-center text-xl px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="font-semibold text-slate-300">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lion Face"
                    value={newEmojiData.name || ''}
                    onChange={e => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      setNewEmojiData({ ...newEmojiData, name, slug });
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Category</label>
                  <select
                    value={newEmojiData.category}
                    onChange={e => setNewEmojiData({ ...newEmojiData, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                  >
                    {OFFICIAL_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Subcategory</label>
                  <input
                    type="text"
                    placeholder="e.g. animal-mammal"
                    value={newEmojiData.subcategory || ''}
                    onChange={e => setNewEmojiData({ ...newEmojiData, subcategory: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Keywords (comma-separated)</label>
                <input
                  type="text"
                  placeholder="lion, king, animal, pride"
                  value={Array.isArray(newEmojiData.keywords) ? newEmojiData.keywords.join(', ') : ''}
                  onChange={e => setNewEmojiData({
                    ...newEmojiData,
                    keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  {saving ? 'Creating...' : 'Create Emoji'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Emoji Modal */}
      {editingEmoji && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-emoji">
                  {editingEmoji.emoji || (editingEmoji as any).character}
                </span>
                <div>
                  <h2 className="text-base font-bold text-white">Edit Emoji Details</h2>
                  <p className="text-[11px] text-slate-400 font-mono">{editingEmoji.codePoint}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingEmoji(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Name</label>
                  <input
                    type="text"
                    value={editingEmoji.name}
                    onChange={e => setEditingEmoji({ ...editingEmoji, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Slug</label>
                  <input
                    type="text"
                    value={editingEmoji.slug}
                    onChange={e => setEditingEmoji({ ...editingEmoji, slug: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Keywords (comma-separated)</label>
                <input
                  type="text"
                  value={(editingEmoji.keywords || []).join(', ')}
                  onChange={e => setEditingEmoji({ 
                    ...editingEmoji, 
                    keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                  })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Custom Description</label>
                <textarea
                  rows={3}
                  value={editingEmoji.customDescription || ''}
                  onChange={e => setEditingEmoji({ ...editingEmoji, customDescription: e.target.value })}
                  placeholder="Custom editorial description for this emoji page..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">SEO Meta Title</label>
                  <input
                    type="text"
                    value={editingEmoji.seoTitle || ''}
                    onChange={e => setEditingEmoji({ ...editingEmoji, seoTitle: e.target.value })}
                    placeholder="Custom page title tag..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Visibility Status</label>
                  <select
                    value={editingEmoji.status || 'active'}
                    onChange={e => setEditingEmoji({ ...editingEmoji, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="hidden">Hidden (Disabled)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingEmoji.isFeatured || false}
                    onChange={e => setEditingEmoji({ ...editingEmoji, isFeatured: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Mark as Featured in Popular Emojis</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingEmoji(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    {saving ? (
                      <span>Saving...</span>
                    ) : saveSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
