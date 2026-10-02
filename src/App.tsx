import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SearchBar } from './components/SearchBar';

// Public Pages
import { HomePage } from './pages/HomePage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CategoryPage } from './pages/CategoryPage';
import { SubcategoryPage } from './pages/SubcategoryPage';
import { EmojiDetailPage } from './pages/EmojiDetailPage';
import { GenderPage } from './pages/GenderPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Admin Pages
import { AdminLayout } from './admin/AdminLayout';
import { AdminLogin } from './admin/AdminLogin';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminEmojis } from './admin/AdminEmojis';
import { AdminCategories } from './admin/AdminCategories';
import { AdminUnicode } from './admin/AdminUnicode';
import { AdminSeo } from './admin/AdminSeo';
import { AdminAnalytics } from './admin/AdminAnalytics';
import { AdminSettings } from './admin/AdminSettings';
import { AdminAccount } from './admin/AdminAccount';
import { AdminAuditLogs } from './admin/AdminAuditLogs';

// Scroll to top helper
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Public Layout Component with Navbar and Footer
function PublicLayout({ onOpenSearch }: { onOpenSearch: () => void }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar onOpenSearch={onOpenSearch} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Global keyboard shortcut '/' to open search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setSearchModalOpen(true);
      } else if (e.key === 'Escape') {
        setSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <ScrollToTop />
            
            <Routes>
              {/* Public Routes with public header & footer */}
              <Route element={<PublicLayout onOpenSearch={() => setSearchModalOpen(true)} />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/categories/" element={<CategoriesPage />} />
                <Route path="/category/:categorySlug/" element={<CategoryPage />} />
                <Route path="/category/:categorySlug/:subcategorySlug/" element={<SubcategoryPage />} />
                <Route path="/emoji/:slug/" element={<EmojiDetailPage />} />
                <Route path="/gender/" element={<GenderPage />} />
                <Route path="/404" element={<NotFoundPage />} />
              </Route>

              {/* Admin Auth Route (Hidden from public navigation) */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Protected Admin Routes (Hidden from public navigation) */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="emojis" element={<AdminEmojis />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="subcategories" element={<AdminCategories isSubcategoryView />} />
                <Route path="unicode" element={<AdminUnicode />} />
                <Route path="seo" element={<AdminSeo />} />
                <Route path="featured" element={<AdminSettings isFeaturedView />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="account" element={<AdminAccount />} />
                <Route path="audit-logs" element={<AdminAuditLogs />} />
              </Route>

              {/* Catch-all 404 */}
              <Route element={<PublicLayout onOpenSearch={() => setSearchModalOpen(true)} />}>
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>

            {/* Global Search Modal */}
            {searchModalOpen && (
              <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                <div 
                  className="fixed inset-0" 
                  onClick={() => setSearchModalOpen(false)} 
                />
                <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-4 border border-slate-200 dark:border-slate-800 z-10 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                    <span>Quick Emoji Search</span>
                    <span>Press <kbd className="px-1.5 py-0.5 font-mono bg-slate-100 dark:bg-slate-800 rounded">ESC</kbd> to close</span>
                  </div>
                  <SearchBar 
                    large 
                    placeholder="Search all emojis, names, code points..." 
                  />
                </div>
              </div>
            )}
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
