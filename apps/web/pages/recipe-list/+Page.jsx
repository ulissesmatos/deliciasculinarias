import { useData } from 'vike-react/useData';
import RecipeListPage from '@/pages/RecipeListPage.jsx';

export default function Page() {
  const data = useData();
  return <RecipeListPage {...data} />;
}
