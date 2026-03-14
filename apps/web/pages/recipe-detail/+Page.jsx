import { useData } from 'vike-react/useData';
import RecipeDetailPage from '@/pages/RecipeDetailPage.jsx';

export default function Page() {
  const { recipe, affiliateProducts } = useData();
  return <RecipeDetailPage recipe={recipe} affiliateProducts={affiliateProducts} />;
}
