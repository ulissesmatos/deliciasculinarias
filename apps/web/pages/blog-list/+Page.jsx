import { useData } from 'vike-react/useData';
import BlogPage from '@/pages/BlogPage.jsx';

export default function Page() {
  const data = useData();
  return <BlogPage {...data} />;
}
