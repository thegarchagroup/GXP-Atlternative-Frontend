import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import EmptyState from '../components/common/EmptyState';

export default function UnauthorizedPage() {
  return (
    <div className="panel">
      <EmptyState icon={ShieldAlert} title="This page belongs to another department"
        message="Your account can only open its own department's pages. Ask the front desk administrator if you need different access."
        action={<Link to="/" className="text-sm font-medium text-harbor-700 underline">Go to your dashboard</Link>} />
    </div>
  );
}
