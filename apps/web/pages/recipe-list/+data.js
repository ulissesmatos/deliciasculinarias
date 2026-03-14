import pb from '@/lib/pocketbaseClient.js';

const PAGE_SIZE = 12;

export default async function data(pageContext) {
  const result = await pb.collection('recipes').getList(1, PAGE_SIZE, {
    sort: '-created',
    requestKey: null,
  });

  return {
    initialRecipes: result.items,
    totalPages: result.totalPages,
    totalItems: result.totalItems,
  };
}
