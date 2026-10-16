import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/** Blocks access to another department's pages even if the URL is typed directly.
 *  (The API enforces the same rule on every endpoint.) */
export default function DepartmentRoute({ allow }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.department)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}
