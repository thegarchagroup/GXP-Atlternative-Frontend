import { Link } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState';
import { SearchX } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="panel">
      <EmptyState icon={SearchX} title="Page not found" message="The address may be mistyped, or the page was moved."
        action={<Link to="/" className="text-sm font-medium text-harbor-700 underline">Go to your dashboard</Link>} />
    </div>
  );
}
