import pb from '@/lib/pocketbaseClient.js';

export default async function data(pageContext) {
  const [recipesRes, articlesRes] = await Promise.all([
    pb.collection('recipes').getList(1, 4, {
      sort: '-created',
      requestKey: null,
    }),
    pb.collection('blog_articles').getList(1, 3, {
      sort: '-created',
      requestKey: null,
    }),
  ]);

  return {
    featuredRecipes: recipesRes.items,
    featuredArticles: articlesRes.items,
  };
}
