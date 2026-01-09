import { lazy } from 'react';

// Lazy load pages for code splitting
export const LazyAuth = lazy(() => import('@/pages/Auth'));
export const LazyDashboard = lazy(() => import('@/pages/Dashboard'));
export const LazyAttendance = lazy(() => import('@/pages/Attendance'));
export const LazyHistory = lazy(() => import('@/pages/History'));
export const LazyLeave = lazy(() => import('@/pages/Leave'));
export const LazyOvertime = lazy(() => import('@/pages/Overtime'));
export const LazyEmployees = lazy(() => import('@/pages/Employees'));
export const LazyApprovals = lazy(() => import('@/pages/Approvals'));
export const LazyLocations = lazy(() => import('@/pages/Locations'));
export const LazyProfile = lazy(() => import('@/pages/Profile'));
export const LazyCorrections = lazy(() => import('@/pages/Corrections'));
export const LazyReports = lazy(() => import('@/pages/Reports'));
export const LazyPayroll = lazy(() => import('@/pages/Payroll'));
export const LazyPayrollDetail = lazy(() => import('@/pages/PayrollDetail'));
export const LazyEmployeeSalary = lazy(() => import('@/pages/EmployeeSalary'));
export const LazyPayrollReport = lazy(() => import('@/pages/PayrollReport'));
export const LazyNotFound = lazy(() => import('@/pages/NotFound'));

// Preload critical components
export const preloadCriticalComponents = () => {
  import('@/pages/Dashboard');
  import('@/pages/Auth');
  import('@/pages/Attendance');
};

// Preload components based on user role
export const preloadComponentsByRole = (role: string) => {
  switch (role) {
    case 'admin_hr':
      import('@/pages/Employees');
      import('@/pages/Payroll');
      import('@/pages/Approvals');
      break;
    case 'manager':
      import('@/pages/Approvals');
      import('@/pages/Reports');
      break;
    case 'employee':
      import('@/pages/Leave');
      import('@/pages/Overtime');
      break;
  }
};

// Preload components based on route
export const preloadComponentsByRoute = (path: string) => {
  const routeMap: Record<string, () => Promise<any>> = {
    '/dashboard': () => import('@/pages/Dashboard'),
    '/attendance': () => import('@/pages/Attendance'),
    '/history': () => import('@/pages/History'),
    '/leave': () => import('@/pages/Leave'),
    '/overtime': () => import('@/pages/Overtime'),
    '/employees': () => import('@/pages/Employees'),
    '/approvals': () => import('@/pages/Approvals'),
    '/payroll': () => import('@/pages/Payroll'),
    '/reports': () => import('@/pages/Reports'),
    '/profile': () => import('@/pages/Profile'),
  };

  const preloadFn = routeMap[path];
  if (preloadFn) {
    preloadFn();
  }
};
