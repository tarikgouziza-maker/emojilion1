import React, { useState, useEffect } from 'react';
import { 
  Edit3, 
  Save, 
  X, 
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CategoryInfo, SubcategoryInfo } from '../types/emoji';

export const AdminCategories: React.FC<{ isSubcategoryView?: boolean }> = ({ isSubcategoryView = false }) => {
  const { fetchWithAuth } = useAuth();
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<CategoryInfo | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState<Partial<CategoryInfo>>({
    name: '',
    slug: '',
    icon: '📁',
    description: '',
    order: 10
  });

  const [saving, setSaving] = useState(false);
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      setSaving(true);
      const res = await fetchWithAuth(`/api/admin/categories/${editingCategory.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCategory)
      });
      if (res.ok) {
        const updated = await res.json();
        setCategories(prev => prev.map(c => c.slug === updated.slug ? updated : c));
        setEditingCategory(null);
      }
    } catch (err) {
      console.error('Failed to save category:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryData.name || !newCategoryData.slug) return;
    try {
      setSaving(true);
      const res = await fetchWithAuth('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategoryData)
      });
      if (res.ok) {
        const created = await res.json();
        setCategories(prev => [...prev, created]);
        setIsCreating(false);
        setNewCategoryData({
          name: '',
          slug: '',
          icon: '📁',
          description: '',
          order: categories.length + 1
        });
      }
    } catch (err) {
      console.error('Failed to create category:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (slug: string) => {
    try {
      const res = await fetchWithAuth(`/api/admin/categories/${slug}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setCategories(prev => prev.filter(c => c.slug !== slug));
        setDeleteConfirmSlug(null);
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

  const allSubcategories = categories.flatMap(c => 
    (c.subcategories || []).map(s => ({ ...s, categoryName: c.name }))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            {isSubcategoryView ? 'Subcategory Group Management' : 'Category Structure Management'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isSubcategoryView 
              ? `Configuring ${allSubcategories.length} official subcategories and groupings.`
              : `Managing ${categories.length} main emoji categories, metadata, descriptions, and ordering.`}
          </p>
        </div>

        {!isSubcategoryView && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        )}
      </div>

      {!isSubcategoryView ? (
        /* Categories Table */
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Icon & Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Subcategories</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
                    Loading categories...
                  </td>
                </tr>
              ) : (
                categories.map(cat => (
                  <tr key={cat.id || cat.slug} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-500">{cat.order}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-emoji select-none">{cat.icon}</span>
                        <span className="font-bold text-white">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">{cat.slug}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-semibold text-slate-300">
                        {cat.subcategories?.length || 0} groups
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 max-w-xs truncate">
                      {cat.description}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingCategory(cat)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {deleteConfirmSlug === cat.slug ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat.slug)}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmSlug(null)}
                              className="p-1 text-slate-400 hover:text-white cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmSlug(cat.slug)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Subcategories Table */
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Subcategory Name</th>
                <th className="px-4 py-3">Parent Category</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {allSubcategories.map((sub: any, idx) => (
                <tr key={`${sub.slug}-${idx}`} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-slate-500">{sub.order || idx + 1}</td>
                  <td className="px-4 py-2.5 font-bold text-white">{sub.name}</td>
                  <td className="px-4 py-2.5 text-amber-400">{sub.categoryName}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-400">{sub.slug}</td>
                  <td className="px-4 py-2.5 text-slate-400 max-w-sm truncate">{sub.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Category Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500" />
                <span>Create New Category</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Icon</label>
                  <input
                    type="text"
                    required
                    placeholder="😃"
                    value={newCategoryData.icon || ''}
                    onChange={e => setNewCategoryData({ ...newCategoryData, icon: e.target.value })}
                    className="w-full text-center text-xl px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <label className="font-semibold text-slate-300">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Travel & Places"
                    value={newCategoryData.name || ''}
                    onChange={e => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      setNewCategoryData({ ...newCategoryData, name, slug });
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="font-semibold text-slate-300">Slug</label>
                  <input
                    type="text"
                    required
                    placeholder="travel-places"
                    value={newCategoryData.slug || ''}
                    onChange={e => setNewCategoryData({ ...newCategoryData, slug: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Order</label>
                  <input
                    type="number"
                    value={newCategoryData.order || 1}
                    onChange={e => setNewCategoryData({ ...newCategoryData, order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  placeholder="Summary of emojis in this category..."
                  value={newCategoryData.description || ''}
                  onChange={e => setNewCategoryData({ ...newCategoryData, description: e.target.value })}
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
                  {saving ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-emoji">{editingCategory.icon}</span>
                <h2 className="text-base font-bold text-white">Edit Category: {editingCategory.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Icon</label>
                  <input
                    type="text"
                    value={editingCategory.icon || ''}
                    onChange={e => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                    className="w-full text-center text-xl px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <label className="font-semibold text-slate-300">Category Name</label>
                  <input
                    type="text"
                    value={editingCategory.name}
                    onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Slug (URL Identifier)</label>
                <input
                  type="text"
                  value={editingCategory.slug}
                  disabled
                  className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 outline-none font-mono cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Description</label>
                <textarea
                  rows={3}
                  value={editingCategory.description || ''}
                  onChange={e => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Display Order</label>
                <input
                  type="number"
                  value={editingCategory.order || 0}
                  onChange={e => setEditingCategory({ ...editingCategory, order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
