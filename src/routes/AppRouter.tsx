import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AdminLayout } from '../layouts/AdminLayout';
import { BranchOverviewPage } from '../pages/admin/BranchOverviewPage';
import { ClinicOverviewPage } from '../pages/admin/ClinicOverviewPage';
import { DashboardPage } from '../pages/admin/DashboardPage';
import { AdminUserDetailsPage } from '../pages/admin-users/AdminUserDetailsPage';
import { AdminUsersPage } from '../pages/admin-users/AdminUsersPage';
import { CreateAdminUserPage } from '../pages/admin-users/CreateAdminUserPage';
import { EditAdminUserPage } from '../pages/admin-users/EditAdminUserPage';
import { BranchDetailsPage } from '../pages/branches/BranchDetailsPage';
import { ClinicBranchesPage } from '../pages/branches/ClinicBranchesPage';
import { CreateBranchPage } from '../pages/branches/CreateBranchPage';
import { EditBranchPage } from '../pages/branches/EditBranchPage';
import { CreateDoctorPage } from '../pages/doctors/CreateDoctorPage';
import { DoctorDetailsPage } from '../pages/doctors/DoctorDetailsPage';
import { DoctorsListPage } from '../pages/doctors/DoctorsListPage';
import { EditDoctorPage } from '../pages/doctors/EditDoctorPage';
import { RequestDetailsPage } from '../pages/requests/RequestDetailsPage';
import { RequestsListPage } from '../pages/requests/RequestsListPage';
import { BranchSettingsPage } from '../pages/settings/BranchSettingsPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { PublicLayout } from '../layouts/PublicLayout';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { RegisterUserPage } from '../pages/RegisterUserPage';
import { SuperAdminClinicDetailsPage } from '../pages/super-admin/SuperAdminClinicDetailsPage';
import { SuperAdminClinicsPage } from '../pages/super-admin/SuperAdminClinicsPage';
import { NotFoundPage } from './NotFoundPage';
import { AuthGuard } from './guards/AuthGuard';
import { BranchAdminGuard } from './guards/BranchAdminGuard';
import { ClinicAdminGuard } from './guards/ClinicAdminGuard';
import { PublicOnlyGuard } from './guards/PublicOnlyGuard';
import { SuperAdminGuard } from './guards/SuperAdminGuard';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/landing" replace />,
  },
  {
    element: <PublicOnlyGuard />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: '/landing', element: <LandingPage /> },
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/register/user', element: <RegisterUserPage /> },
        ],
      },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/home', element: <DashboardPage /> },
          {
            element: <SuperAdminGuard />,
            children: [
              { path: '/super-admin', element: <SuperAdminClinicsPage /> },
              { path: '/super-admin/clinic/:clinicId', element: <SuperAdminClinicDetailsPage /> },
            ],
          },
          {
            element: <ClinicAdminGuard />,
            children: [
              { path: '/clinic-overview', element: <ClinicOverviewPage /> },
              { path: '/clinic-branches', element: <ClinicBranchesPage /> },
              { path: '/clinic-branches/create', element: <CreateBranchPage /> },
              { path: '/clinic-branches/:branchId/edit', element: <EditBranchPage /> },
              { path: '/clinic-branches/:branchId', element: <BranchDetailsPage /> },
              { path: '/clinic-doctors', element: <DoctorsListPage /> },
              { path: '/clinic-doctors/create', element: <CreateDoctorPage /> },
              { path: '/clinic-doctors/:doctorId', element: <DoctorDetailsPage /> },
              { path: '/clinic-doctors/:doctorId/edit', element: <EditDoctorPage /> },
              { path: '/clinic-requests', element: <RequestsListPage /> },
              { path: '/clinic-requests/:requestId', element: <RequestDetailsPage /> },
              { path: '/clinic-visit-requests', element: <RequestsListPage /> },
              { path: '/clinic-visit-requests/:requestId', element: <RequestDetailsPage /> },
              { path: '/home-visit-requests-plan', element: <RequestsListPage /> },
              { path: '/home-visit-requests-plan/:requestId', element: <RequestDetailsPage /> },
              { path: '/admin-users', element: <AdminUsersPage /> },
              { path: '/admin-users/create', element: <CreateAdminUserPage /> },
              { path: '/admin-users/:userId', element: <AdminUserDetailsPage /> },
              { path: '/admin-users/:userId/edit', element: <EditAdminUserPage /> },
              { path: '/settings', element: <SettingsPage /> },
            ],
          },
          {
            element: <BranchAdminGuard />,
            children: [
              { path: '/branch-overview', element: <BranchOverviewPage /> },
              { path: '/branch-doctors', element: <DoctorsListPage /> },
              { path: '/branch-doctors/create', element: <CreateDoctorPage /> },
              { path: '/branch-doctors/:doctorId', element: <DoctorDetailsPage /> },
              { path: '/branch-doctors/:doctorId/edit', element: <EditDoctorPage /> },
              { path: '/branch-requests', element: <RequestsListPage /> },
              { path: '/branch-requests/:requestId', element: <RequestDetailsPage /> },
              { path: '/branch-home-requests', element: <RequestsListPage /> },
              { path: '/branch-home-requests/:requestId', element: <RequestDetailsPage /> },
              { path: '/branch-clinic-visit-requests', element: <RequestsListPage /> },
              { path: '/branch-clinic-visit-requests/:requestId', element: <RequestDetailsPage /> },
              { path: '/branch-home-visit-requests-plan', element: <RequestsListPage /> },
              { path: '/branch-home-visit-requests-plan/:requestId', element: <RequestDetailsPage /> },
              { path: '/branch-settings', element: <BranchSettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
