
import React, { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, BrowserRouter as Router, Outlet, Navigate, useNavigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import AdminLayout from './components/admin/AdminLayout.jsx';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/hooks/useLanguage.jsx';
import { AuthProvider } from '@/hooks/useAuth.jsx';
import { SUPPORTED_LANGS, detectBrowserLang, ROUTE_SLUGS } from '@/lib/routes.js';

// Public pages — loaded on demand
const HomePage          = lazy(() => import('./pages/HomePage.jsx'));
const RecipeListPage    = lazy(() => import('./pages/RecipeListPage.jsx'));
const RecipeDetailPage  = lazy(() => import('./pages/RecipeDetailPage.jsx'));
const BlogPage          = lazy(() => import('./pages/BlogPage.jsx'));
const BlogDetailPage    = lazy(() => import('./pages/BlogDetailPage.jsx'));
const AboutPage         = lazy(() => import('./pages/AboutPage.jsx'));
const ContactPage       = lazy(() => import('./pages/ContactPage.jsx'));
const NotFoundPage      = lazy(() => import('./pages/NotFoundPage.jsx'));

// Admin pages — separate chunk, only fetched when needed
const LoginPage              = lazy(() => import('./pages/admin/LoginPage.jsx'));
const AdminDashboard         = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const RecipeManagement       = lazy(() => import('./pages/admin/RecipeManagement.jsx'));
const RecipeEditor           = lazy(() => import('./pages/admin/RecipeEditor.jsx'));
const BlogArticleManagement  = lazy(() => import('./pages/admin/BlogArticleManagement.jsx'));
const BlogArticleEditor      = lazy(() => import('./pages/admin/BlogArticleEditor.jsx'));
const ProductManagement      = lazy(() => import('./pages/admin/ProductManagement.jsx'));
const CommentManagement      = lazy(() => import('./pages/admin/CommentManagement.jsx'));
const AISettingsPage         = lazy(() => import('./pages/admin/AISettingsPage.jsx'));
const ProfilePage            = lazy(() => import('./pages/admin/ProfilePage.jsx'));
const BlogCategoryManagement = lazy(() => import('./pages/admin/BlogCategoryManagement.jsx'));
const MediaLibraryPage       = lazy(() => import('./pages/admin/MediaLibraryPage.jsx'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
  </div>
);

// Redirects "/" to the user's preferred language
const LangRedirect = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const saved = localStorage.getItem('deliciasLanguage');
    const lang = SUPPORTED_LANGS.includes(saved) ? saved : detectBrowserLang();
    navigate(`/${lang}`, { replace: true });
  }, []);
  return null;
};

// Layout shared by all public pages
const PublicLayout = () => (
  <div className="flex flex-col min-h-screen">
    <Header />
    <div className="flex-grow">
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </div>
    <Footer />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <LanguageProvider>
          <ScrollToTop />
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Root → redirect to preferred language */}
                <Route path="/" element={<LangRedirect />} />

                {/* ── PORTUGUÊS ── */}
                <Route path="/pt" element={<PublicLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path={ROUTE_SLUGS.pt.recipes} element={<RecipeListPage />} />
                  <Route path={`${ROUTE_SLUGS.pt.recipe}/:slug`} element={<RecipeDetailPage />} />
                  <Route path="blog" element={<BlogPage />} />
                  <Route path="blog/:slug" element={<BlogDetailPage />} />
                  <Route path={ROUTE_SLUGS.pt.about} element={<AboutPage />} />
                  <Route path={ROUTE_SLUGS.pt.contact} element={<ContactPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>

                {/* ── ENGLISH ── */}
                <Route path="/en" element={<PublicLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path={ROUTE_SLUGS.en.recipes} element={<RecipeListPage />} />
                  <Route path={`${ROUTE_SLUGS.en.recipe}/:slug`} element={<RecipeDetailPage />} />
                  <Route path="blog" element={<BlogPage />} />
                  <Route path="blog/:slug" element={<BlogDetailPage />} />
                  <Route path={ROUTE_SLUGS.en.about} element={<AboutPage />} />
                  <Route path={ROUTE_SLUGS.en.contact} element={<ContactPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>

                {/* ── ESPAÑOL ── */}
                <Route path="/es" element={<PublicLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path={ROUTE_SLUGS.es.recipes} element={<RecipeListPage />} />
                  <Route path={`${ROUTE_SLUGS.es.recipe}/:slug`} element={<RecipeDetailPage />} />
                  <Route path="blog" element={<BlogPage />} />
                  <Route path="blog/:slug" element={<BlogDetailPage />} />
                  <Route path={ROUTE_SLUGS.es.about} element={<AboutPage />} />
                  <Route path={ROUTE_SLUGS.es.contact} element={<ContactPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>

                {/* Admin login — standalone, no sidebar */}
                <Route path="/admin/login" element={<LoginPage />} />

                {/* Admin routes — with sidebar layout */}
                <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/recipes" element={<RecipeManagement />} />
                  <Route path="/admin/recipes/new" element={<RecipeEditor />} />
                  <Route path="/admin/recipes/:id/edit" element={<RecipeEditor />} />
                  <Route path="/admin/blog" element={<BlogArticleManagement />} />
                  <Route path="/admin/blog/categories" element={<BlogCategoryManagement />} />
                  <Route path="/admin/blog/new" element={<BlogArticleEditor />} />
                  <Route path="/admin/blog/:id/edit" element={<BlogArticleEditor />} />
                  <Route path="/admin/products" element={<ProductManagement />} />
                  <Route path="/admin/comments" element={<CommentManagement />} />
                  <Route path="/admin/ai-settings" element={<AISettingsPage />} />
                  <Route path="/admin/media" element={<MediaLibraryPage />} />
                  <Route path="/admin/profile" element={<ProfilePage />} />
                </Route>

                {/* Catch-all → redirect to preferred language */}
                <Route path="*" element={<LangRedirect />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
          <Toaster />
        </LanguageProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
