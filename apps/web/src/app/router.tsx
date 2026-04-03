import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
  Outlet,
} from '@tanstack/react-router';
import { getAccessToken } from '@/shared/lib/auth';
import { getMeFn } from '@/entities/session/api';
import { sessionSet } from '@/entities/session/model';

import { AdminLayout } from './layouts/admin-layout';
import { DriverLayout } from './layouts/driver-layout';

import { LoginPage } from '@/pages/auth/login';
import { RegisterPage } from '@/pages/auth/register';
import { PendingPage } from '@/pages/pending';

import { DashboardPage } from '@/pages/admin/dashboard';
import { TripsPage } from '@/pages/admin/trips';
import { WaybillsPage } from '@/pages/admin/waybills';
import { DriversPage } from '@/pages/admin/drivers';
import { VehiclesPage } from '@/pages/admin/vehicles';
import { ContractorsPage } from '@/pages/admin/contractors';
import { RoutesPage } from '@/pages/admin/routes';
import { CargosPage } from '@/pages/admin/cargos';
import { UsersPage } from '@/pages/admin/users';

import { MyTripsPage } from '@/pages/driver/my-trips';
import { ActiveTripPage } from '@/pages/driver/active-trip';

// Root route
const rootRoute = createRootRoute({
  component: Outlet,
});

// --- Public routes ---

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
});

const pendingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pending',
  component: PendingPage,
});

// --- Admin layout route (guarded) ---

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'admin',
  component: AdminLayout,
  beforeLoad: async () => {
    const token = getAccessToken();
    if (!token) {
      throw redirect({ to: '/login' });
    }

    const user = await getMeFn();
    sessionSet(user);

    if (user.status === 'PENDING') {
      throw redirect({ to: '/pending' });
    }

    if (user.role === 'DRIVER') {
      throw redirect({ to: '/driver' });
    }

    return { user };
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/',
  component: DashboardPage,
});

const tripsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/trips',
  component: TripsPage,
});

const waybillsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/waybills',
  component: WaybillsPage,
});

const driversRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/drivers',
  component: DriversPage,
});

const vehiclesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/vehicles',
  component: VehiclesPage,
});

const contractorsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/contractors',
  component: ContractorsPage,
});

const routesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/routes',
  component: RoutesPage,
});

const cargosRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/cargos',
  component: CargosPage,
});

const usersRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/users',
  component: UsersPage,
});

// --- Driver layout route (guarded) ---

const driverRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/driver',
  component: DriverLayout,
  beforeLoad: async () => {
    const token = getAccessToken();
    if (!token) {
      throw redirect({ to: '/login' });
    }

    const user = await getMeFn();
    sessionSet(user);

    if (user.status === 'PENDING') {
      throw redirect({ to: '/pending' });
    }

    if (user.role !== 'DRIVER') {
      throw redirect({ to: '/' });
    }

    return { user };
  },
});

const myTripsRoute = createRoute({
  getParentRoute: () => driverRoute,
  path: '/',
  component: MyTripsPage,
});

const activeTripRoute = createRoute({
  getParentRoute: () => driverRoute,
  path: '/trip/$tripId',
  component: ActiveTripPage,
});

// --- Route tree ---

const routeTree = rootRoute.addChildren([
  loginRoute,
  registerRoute,
  pendingRoute,
  adminRoute.addChildren([
    dashboardRoute,
    tripsRoute,
    waybillsRoute,
    driversRoute,
    vehiclesRoute,
    contractorsRoute,
    routesRoute,
    cargosRoute,
    usersRoute,
  ]),
  driverRoute.addChildren([myTripsRoute, activeTripRoute]),
]);

export const router = createRouter({ routeTree });

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
