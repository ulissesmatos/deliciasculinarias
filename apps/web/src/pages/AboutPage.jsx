
import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Globe } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage.jsx';

const AboutPage = () => {
  const { t } = useLanguage();

  return (
    <>
      <main className="min-h-screen bg-cream">
        <section className="bg-primary text-white py-16">
          <div className="container mx-auto px-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-center mb-4"
            >
              {t('about.title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-center text-white/90 max-w-2xl mx-auto"
            >
              {t('about.desc')}
            </motion.p>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl shadow-lg p-8 mb-12"
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('about.storyTitle')}</h2>
                <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
                  <p>{t('about.story1')}</p>
                  <p>{t('about.story2')}</p>
                  <p>{t('about.story3')}</p>
                </div>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl shadow-lg p-6 text-center"
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="text-primary" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{t('about.authTitle')}</h3>
                  <p className="text-gray-600">{t('about.authDesc')}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl shadow-lg p-6 text-center"
                >
                  <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="text-secondary" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{t('about.commTitle')}</h3>
                  <p className="text-gray-600">{t('about.commDesc')}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl shadow-lg p-6 text-center"
                >
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="text-accent" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{t('about.cultTitle')}</h3>
                  <p className="text-gray-600">{t('about.cultDesc')}</p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl shadow-lg p-8"
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('about.missionTitle')}</h2>
                <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
                  <p>{t('about.mission1')}</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{t('about.missionList1')}</li>
                    <li>{t('about.missionList2')}</li>
                    <li>{t('about.missionList3')}</li>
                    <li>{t('about.missionList4')}</li>
                    <li>{t('about.missionList5')}</li>
                  </ul>
                  <p>{t('about.mission2')}</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default AboutPage;
