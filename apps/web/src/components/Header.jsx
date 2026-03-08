
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChefHat, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage.jsx';
import { useAuth } from '@/hooks/useAuth.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const { isAuthenticated } = useAuth();

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/recipes', label: t('nav.recipes') },
    { path: '/blog', label: t('nav.blog') },
    { path: '/about', label: t('nav.about') },
    { path: '/contact', label: t('nav.contact') }
  ];

  if (isAuthenticated) {
    navLinks.push({ path: '/admin/dashboard', label: t('nav.dashboard') });
  }

  const isActive = (path) => location.pathname === path;

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <ChefHat className="text-primary w-8 h-8 group-hover:rotate-12 transition-transform" />
            <span className="text-2xl font-bold text-gray-900">
              Delícias <span className="text-primary">Culinárias</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-semibold transition-colors relative ${
                  isActive(link.path) 
                    ? 'text-primary' 
                    : 'text-gray-700 hover:text-primary'
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </Link>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-gray-700 hover:text-primary transition-colors focus:outline-none">
                <Globe size={20} />
                <span className="uppercase font-semibold">{language}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((lang) => (
                  <DropdownMenuItem 
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`cursor-pointer ${language === lang.code ? 'bg-gray-100 font-bold' : ''}`}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-700 hover:text-primary transition-colors"
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 pb-4"
            >
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`font-semibold py-2 px-4 rounded-lg transition-colors ${
                      isActive(link.path)
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="flex gap-2 px-4 pt-2 border-t border-gray-100">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setMobileMenuOpen(false);
                      }}
                      className={`px-3 py-1 rounded-md text-sm ${
                        language === lang.code ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {lang.flag} {lang.code.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default Header;
