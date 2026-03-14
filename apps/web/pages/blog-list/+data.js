import pb from '@/lib/pocketbaseClient.js';

export default async function data(pageContext) {
  const articles = await pb.collection('blog_articles').getFullList({
    sort: '-created',
    requestKey: null,
  });

  return { initialArticles: articles };
}
