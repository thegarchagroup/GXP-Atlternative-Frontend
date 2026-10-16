import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DepartmentRoute from './DepartmentRoute';
import DashboardLayout from '../layouts/DashboardLayout';
import AuthLayout from '../layouts/AuthLayout';
import { useAuth } from '../hooks/useAuth';
import { DEPARTMENTS } from '../utils/constants';
import LoginPage from '../pages/LoginPage';
import NotFoundPage from '../pages/NotFoundPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import FrontDeskDashboard from '../pages/frontdesk/FrontDeskDashboard';
import RoomsPage from '../pages/frontdesk/RoomsPage';
import TurnoverTicketsPage from '../pages/frontdesk/TurnoverTicketsPage';
import TicketDetailsPage from '../pages/frontdesk/TicketDetailsPage';
import RepairsPage from '../pages/frontdesk/RepairsPage';
import UserManagementPage from '../pages/frontdesk/UserManagementPage';
import ChecklistConfigurationPage from '../pages/frontdesk/ChecklistConfigurationPage';
import ReportsPage from '../pages/frontdesk/ReportsPage';
import HousekeepingDashboard from '../pages/housekeeping/HousekeepingDashboard';
import HousekeepingTicketPage from '../pages/housekeeping/HousekeepingTicketPage';
import HousekeepingInspectionPage from '../pages/housekeeping/HousekeepingInspectionPage';
import EngineeringDashboard from '../pages/engineering/EngineeringDashboard';
import EngineeringTicketPage from '../pages/engineering/EngineeringTicketPage';
import EngineeringInspectionPage from '../pages/engineering/EngineeringInspectionPage';

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={DEPARTMENTS[user?.department]?.home || '/login'} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<HomeRedirect />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route element={<DepartmentRoute allow={['FRONT_DESK']} />}>
            <Route path="/frontdesk" element={<FrontDeskDashboard />} />
            <Route path="/frontdesk/rooms" element={<RoomsPage />} />
            <Route path="/frontdesk/tickets" element={<TurnoverTicketsPage />} />
            <Route path="/frontdesk/tickets/:ticketId" element={<TicketDetailsPage />} />
            <Route path="/frontdesk/repairs" element={<RepairsPage />} />
            <Route path="/frontdesk/users" element={<UserManagementPage />} />
            <Route path="/frontdesk/checklists" element={<ChecklistConfigurationPage />} />
            <Route path="/frontdesk/reports" element={<ReportsPage />} />
          </Route>

          <Route element={<DepartmentRoute allow={['HOUSEKEEPING']} />}>
            <Route path="/housekeeping" element={<HousekeepingDashboard />} />
            <Route path="/housekeeping/tickets/:ticketId" element={<HousekeepingTicketPage />} />
            <Route path="/housekeeping/tickets/:ticketId/inspection" element={<HousekeepingInspectionPage />} />
          </Route>

          <Route element={<DepartmentRoute allow={['ENGINEERING']} />}>
            <Route path="/engineering" element={<EngineeringDashboard />} />
            <Route path="/engineering/repairs/:repairId" element={<EngineeringTicketPage />} />
            <Route path="/engineering/repairs/:repairId/inspection" element={<EngineeringInspectionPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
