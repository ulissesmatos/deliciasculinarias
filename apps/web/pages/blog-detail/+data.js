import pb from '@/lib/pocketbaseClient.js';

export default async function data(pageContext) {
  const { lang, slug } = pageContext.routeParams;

  let record = null;

  // Try the current language slug first
  try {
    record = await pb.collection('blog_articles').getFirstListItem(
      pb.filter(`slug_${lang} = {:slug}`, { slug }),
      { requestKey: null }
    );
  } catch {
    // Fallback: try other languages
    for (const fallbackLang of ['pt', 'en', 'es'].filter(l => l !== lang)) {
      try {
        record = await pb.collection('blog_articles').getFirstListItem(
          pb.filter(`slug_${fallbackLang} = {:slug}`, { slug }),
          { requestKey: null }
        );
        break;
      } catch { /* continue */ }
    }

    // Fallback: try as PocketBase record ID
    if (!record && /^[a-z0-9]{15}$/i.test(slug)) {
      try {
        record = await pb.collection('blog_articles').getOne(slug, { requestKey: null });
      } catch { /* not found */ }
    }
  }

  return { article: record };
}
