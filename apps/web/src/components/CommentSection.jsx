
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage.jsx';
import pb from '@/lib/pocketbaseClient.js';

const CommentSection = ({ recipeId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    user_name: '',
    email: '',
    comment_text: ''
  });
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    fetchComments();
  }, [recipeId]);

  const fetchComments = async () => {
    try {
      const records = await pb.collection('comments').getFullList({
        filter: pb.filter('recipe_id = {:recipeId}', { recipeId }),
        sort: '-created',
        $autoCancel: false
      });
      setComments(records);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.user_name || !formData.email || !formData.comment_text) {
      toast({
        title: t('common.error'),
        description: t('comments.fillAll'),
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      const newComment = await pb.collection('comments').create({
        recipe_id: recipeId,
        user_name: formData.user_name,
        email: formData.email,
        comment_text: formData.comment_text
      }, { $autoCancel: false });

      setComments([newComment, ...comments]);
      setFormData({ user_name: '', email: '', comment_text: '' });
      
      toast({
        title: t('common.success'),
        description: t('comments.successMsg'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('comments.errorMsg'),
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <MessageCircle className="text-primary" />
        {t('comments.title')} ({comments.length})
      </h3>

      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="user_name">{t('comments.name')}</Label>
            <Input
              id="user_name"
              value={formData.user_name}
              onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
              placeholder={t('comments.name')}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">{t('comments.email')}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="comment_text">{t('comments.comment')}</Label>
          <textarea
            id="comment_text"
            value={formData.comment_text}
            onChange={(e) => setFormData({ ...formData, comment_text: e.target.value })}
            placeholder={t('comments.placeholder')}
            rows={4}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-900"
          />
        </div>
        <Button 
          type="submit" 
          disabled={submitting}
          className="w-full md:w-auto"
        >
          {submitting ? t('comments.posting') : t('comments.post')}
          <Send size={16} className="ml-2" />
        </Button>
      </form>

      {loading ? (
        <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {t('comments.noComments')}
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border-b border-gray-200 pb-6 last:border-0"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{comment.user_name}</p>
                  <p className="text-sm text-gray-500">{formatDate(comment.created)}</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">{comment.comment_text}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
