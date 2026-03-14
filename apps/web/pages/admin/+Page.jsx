import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import AdminLayout from '@/components/admin/AdminLayout.jsx';

const LoginPage              = lazy(() => import('@/pages/admin/LoginPage.jsx'));
const AdminDashboard         = lazy(() => import('@/pages/admin/AdminDashboard.jsx'));
const RecipeManagement       = lazy(() => import('@/pages/admin/RecipeManagement.jsx'));
const RecipeEditor           = lazy(() => import('@/pages/admin/RecipeEditor.jsx'));
const BlogArticleManagement  = lazy(() => import('@/pages/admin/BlogArticleManagement.jsx'));
const BlogArticleEditor      = lazy(() => import('@/pages/admin/BlogArticleEditor.jsx'));
const ProductManagement      = lazy(() => import('@/pages/admin/ProductManagement.jsx'));
const CommentManagement      = lazy(() => import('@/pages/admin/CommentManagement.jsx'));
const AISettingsPage         = lazy(() => import('@/pages/admin/AISettingsPage.jsx'));
const ProfilePage            = lazy(() => import('@/pages/admin/ProfilePage.jsx'));
const BlogCategoryManagement = lazy(() => import('@/pages/admin/BlogCategoryManagement.jsx'));
const MediaLibraryPage       = lazy(() => import('@/pages/admin/MediaLibraryPage.jsx'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
  </div>
);

export default function Page() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/admin/login" element={<LoginPage />} />
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
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
