
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage.jsx';
import pb from '@/lib/pocketbaseClient.js';

const CommentManagement = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const records = await pb.collection('comments').getFullList({
        sort: '-created',
        $autoCancel: false
      });
      setComments(records);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({ 
        title: t('common.error'), 
        description: 'Failed to load comments. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('common.confirmDelete'))) {
      try {
        await pb.collection('comments').delete(id, { $autoCancel: false });
        setComments(comments.filter(c => c.id !== id));
        toast({ title: t('common.success') });
      } catch (error) {
        console.error('Error deleting comment:', error);
        toast({ 
          title: t('common.error'), 
          description: 'Failed to delete comment.', 
          variant: 'destructive' 
        });
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('admin.comments.title')} - Admin</title>
      </Helmet>
      <div className="min-h-full bg-cream py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.comments.title')}</h1>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 font-semibold text-gray-600">{t('admin.comments.user')}</th>
                    <th className="p-4 font-semibold text-gray-600">{t('admin.comments.text')}</th>
                    <th className="p-4 font-semibold text-gray-600">{t('admin.comments.date')}</th>
                    <th className="p-4 font-semibold text-gray-600">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="4" className="p-4 text-center">{t('common.loading')}</td></tr>
                  ) : comments.length === 0 ? (
                    <tr><td colSpan="4" className="p-4 text-center text-gray-500">No comments found.</td></tr>
                  ) : comments.map(comment => (
                    <tr key={comment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4">
                        <p className="font-medium text-gray-900">{comment.user_name}</p>
                        <p className="text-sm text-gray-500">{comment.email}</p>
                      </td>
                      <td className="p-4 text-gray-700 max-w-xs truncate">{comment.comment_text}</td>
                      <td className="p-4 text-gray-600">
                        {new Date(comment.created).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(comment.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommentManagement;
