
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Facebook, Instagram, Twitter, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage.jsx';
import { useAuth } from '@/hooks/useAuth.jsx';
import pb from '@/lib/pocketbaseClient.js';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: t('common.error'),
        description: t('home.emailPlaceholder'),
        variant: 'destructive'
      });
      return;
    }

    setSubscribing(true);
    try {
      await pb.collection('newsletter_subscribers').create({
        email: email
      }, { $autoCancel: false });

      toast({
        title: t('common.success'),
        description: t('home.subscribe'),
      });
      setEmail('');
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ChefHat className="text-primary w-8 h-8" />
              <span className="text-xl font-bold">
                Delícias <span className="text-primary">Culinárias</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              {t('footer.desc')}
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">{t('footer.quickLinks')}</h3>
            <div className="space-y-2">
              <Link to="/" className="block text-gray-400 hover:text-primary transition-colors">
                {t('nav.home')}
              </Link>
              <Link to="/recipes" className="block text-gray-400 hover:text-primary transition-colors">
                {t('nav.recipes')}
              </Link>
              <Link to="/about" className="block text-gray-400 hover:text-primary transition-colors">
                {t('nav.about')}
              </Link>
              <Link to="/contact" className="block text-gray-400 hover:text-primary transition-colors">
                {t('nav.contact')}
              </Link>
              {!isAuthenticated && (
                <Link to="/admin/login" className="block text-gray-500 hover:text-primary transition-colors text-sm mt-4">
                  {t('nav.admin')}
                </Link>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">{t('contact.followUs')}</h3>
            <div className="flex gap-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                <Facebook size={24} />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                <Instagram size={24} />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                <Twitter size={24} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">{t('footer.newsletter')}</h3>
            <p className="text-gray-400 text-sm mb-3">
              {t('footer.newsletterDesc')}
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('home.emailPlaceholder')}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
              <Button 
                type="submit" 
                disabled={subscribing}
                className="bg-primary hover:bg-primary/90"
              >
                <Mail size={18} />
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Delícias Culinárias. {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
