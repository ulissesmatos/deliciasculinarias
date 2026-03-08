
import React, { Suspense, lazy } from 'react';
import { Route, Routes, BrowserRouter as Router, Outlet } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import AdminLayout from './components/admin/AdminLayout.jsx';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/hooks/useLanguage.jsx';
import { AuthProvider } from '@/hooks/useAuth.jsx';

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

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <ScrollToTop />
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes — with Header + Footer */}
                <Route element={
                  <div className="flex flex-col min-h-screen">
                    <Header />
                    <div className="flex-grow"><Suspense fallback={<PageLoader />}><Outlet /></Suspense></div>
                    <Footer />
                  </div>
                }>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/recipes" element={<RecipeListPage />} />
                  <Route path="/recipe/:id" element={<RecipeDetailPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog/:id" element={<BlogDetailPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
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
                  <Route path="/admin/blog/new" element={<BlogArticleEditor />} />
                  <Route path="/admin/blog/:id/edit" element={<BlogArticleEditor />} />
                  <Route path="/admin/products" element={<ProductManagement />} />
                  <Route path="/admin/comments" element={<CommentManagement />} />
                  <Route path="/admin/ai-settings" element={<AISettingsPage />} />
                </Route>
              </Routes>
            </Suspense>
          </ErrorBoundary>
          <Toaster />
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
