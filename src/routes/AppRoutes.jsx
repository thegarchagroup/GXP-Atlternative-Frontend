import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DepartmentRoute from './DepartmentRoute';
import RoleRoute from './RoleRoute';
import DashboardLayout from '../layouts/DashboardLayout';
import AuthLayout from '../layouts/AuthLayout';
import { useAuth } from '../hooks/useAuth';
import { homeFor } from '../utils/constants';
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
  return <Navigate to={homeFor(user)} replace />;
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

          <Route element={<RoleRoute allow={['ADMIN']} />}>
            <Route path="/frontdesk" element={<FrontDeskDashboard />} />
            <Route path="/frontdesk/rooms" element={<RoomsPage />} />
            <Route path="/frontdesk/tickets" element={<TurnoverTicketsPage />} />
            <Route path="/frontdesk/tickets/:ticketId" element={<TicketDetailsPage />} />
            <Route path="/frontdesk/repairs" element={<RepairsPage />} />
            <Route path="/frontdesk/users" element={<UserManagementPage />} />
            <Route path="/frontdesk/reports" element={<ReportsPage />} />
          </Route>

          <Route element={<RoleRoute allow={['HK_SUPERVISOR']} />}>
            <Route path="/housekeeping/team" element={<UserManagementPage />} />
            <Route path="/housekeeping/form" element={<ChecklistConfigurationPage />} />
          </Route>

          <Route element={<RoleRoute allow={['ROOM_ATTENDANT']} />}>
            <Route path="/housekeeping" element={<HousekeepingDashboard />} />
            <Route path="/housekeeping/tickets/:ticketId" element={<HousekeepingTicketPage />} />
            <Route path="/housekeeping/tickets/:ticketId/inspection" element={<HousekeepingInspectionPage />} />
          </Route>

          <Route element={<RoleRoute allow={['ENG_SUPERVISOR']} />}>
            <Route path="/engineering/all" element={<RepairsPage />} />
            <Route path="/engineering/team" element={<UserManagementPage />} />
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
