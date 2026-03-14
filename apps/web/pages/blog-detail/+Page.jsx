import { useData } from 'vike-react/useData';
import BlogDetailPage from '@/pages/BlogDetailPage.jsx';

export default function Page() {
  const { article } = useData();
  return <BlogDetailPage article={article} />;
}
