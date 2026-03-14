import { useData } from 'vike-react/useData';
import HomePage from '@/pages/HomePage.jsx';

export default function Page() {
  const data = useData();
  return <HomePage {...data} />;
}
