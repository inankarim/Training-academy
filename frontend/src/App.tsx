import { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { refreshApi } from './services/auth.service';
import { lazyImport } from './utils/lazyImport';

import { StaffLayout } from './layouts/StaffLayout';
import { LearnerLayout } from './layouts/LearnerLayout';

import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './components/auth/PublicRoute';

// Every route-level page is code-split via lazyImport() (see its own file
// for why: React.lazy needs a default export, these are all named exports).
// Layouts/guards above stay eager since they render on virtually every route
// anyway — splitting them would just add Suspense boundaries for no payoff.
const LearnerLoginPage = lazyImport(() => import('./pages/auth/LearnerLoginPage'), 'LearnerLoginPage');
const StaffLoginPage = lazyImport(() => import('./pages/auth/StaffLoginPage'), 'StaffLoginPage');
const ChangePasswordPage = lazyImport(() => import('./pages/auth/ChangePasswordPage'), 'ChangePasswordPage');
const SystemStatusPage = lazyImport(() => import('./pages/SystemStatusPage'), 'SystemStatusPage');

const LearnerDashboard = lazyImport(() => import('./pages/learner/LearnerDashboard'), 'LearnerDashboard');
const StaffDashboard = lazyImport(() => import('./pages/staff/StaffDashboard'), 'StaffDashboard');
const UserListPage = lazyImport(() => import('./pages/staff/UserListPage'), 'UserListPage');
const CreateUserPage = lazyImport(() => import('./pages/staff/CreateUserPage'), 'CreateUserPage');
const CourseListPage = lazyImport(() => import('./pages/staff/CourseListPage'), 'CourseListPage');
const CourseBuilderPage = lazyImport(() => import('./pages/staff/CourseBuilderPage'), 'CourseBuilderPage');
const FinalQuizBuilderPage = lazyImport(() => import('./pages/staff/FinalQuizBuilderPage'), 'FinalQuizBuilderPage');
const LessonBuilderPage = lazyImport(() => import('./pages/staff/LessonBuilderPage'), 'LessonBuilderPage');
const AssignmentsPage = lazyImport(() => import('./pages/staff/AssignmentsPage'), 'AssignmentsPage');

const CoursesPage = lazyImport(() => import('./pages/learner/CoursesPage'), 'CoursesPage');
const CourseOverviewPage = lazyImport(() => import('./pages/learner/CourseOverviewPage'), 'CourseOverviewPage');
const FinalQuizPage = lazyImport(() => import('./pages/learner/FinalQuizPage'), 'FinalQuizPage');
const LearnerProfilePage = lazyImport(() => import('./pages/learner/LearnerProfilePage'), 'LearnerProfilePage');
const LessonPlayerPage = lazyImport(() => import('./pages/learner/LessonPlayerPage'), 'LessonPlayerPage');
const NotificationsPage = lazyImport(() => import('./pages/shared/NotificationsPage'), 'NotificationsPage');

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RootIndexRedirect() {
  const { isAuthenticated, user, isInitializing } = useAuthStore();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-xs font-medium text-ink-muted">Loading Holcim Academy...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (user.role === 'learner') {
    return <Navigate to="/learner/dashboard" replace />;
  }

  return <Navigate to="/staff/dashboard" replace />;
}

export function App() {
  const { setAuth, setInitializing } = useAuthStore();

  useEffect(() => {
    // Attempt silent token refresh using httpOnly cookie on initial app load
    async function restoreSession() {
      try {
        const data = await refreshApi();
        setAuth(data);
      } catch {
        // No existing session or expired cookie
        setInitializing(false);
      }
    }

    restoreSession();
  }, [setAuth, setInitializing]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Default Root Redirect */}
            <Route path="/" element={<RootIndexRedirect />} />
  
            {/* Public Auth Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LearnerLoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/staff/login"
              element={
                <PublicRoute>
                  <StaffLoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/admin/login"
              element={<Navigate to="/staff/login" replace />}
            />
  
            {/* Password Change Route */}
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePasswordPage />
                </ProtectedRoute>
              }
            />
  
            {/* System Diagnostic Status */}
            <Route path="/system-status" element={<SystemStatusPage />} />
  
            {/* Learner Platform Routes */}
            <Route
              path="/learner"
              element={
                <ProtectedRoute allowedRoles={['learner', 'super_admin', 'admin', 'hr', 'content_creator']}>
                  <LearnerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/learner/dashboard" replace />} />
              <Route path="dashboard" element={<LearnerDashboard />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="courses/:courseId" element={<CourseOverviewPage />} />
              <Route path="courses/:courseId/final-quiz" element={<FinalQuizPage />} />
              <Route path="lessons/:lessonId" element={<LessonPlayerPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<LearnerProfilePage />} />
            </Route>
  
            {/* Staff & HR Management Routes */}
            <Route
              path="/staff"
              element={
                <ProtectedRoute
                  allowedRoles={['super_admin', 'admin', 'hr', 'content_creator']}
                  redirectToLoginPath="/staff/login"
                >
                  <StaffLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/staff/dashboard" replace />} />
              <Route path="dashboard" element={<StaffDashboard />} />
              <Route
                path="users"
                element={
                  <ProtectedRoute requiredPermission="users.view" redirectToLoginPath="/staff/login">
                    <UserListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users/create"
                element={
                  <ProtectedRoute requiredPermission="users.create" redirectToLoginPath="/staff/login">
                    <CreateUserPage />
                  </ProtectedRoute>
                }
              />
  
              {/* Course Builder — content_creator only, mirrors the backend's requireContentCreatorRole */}
              <Route
                path="courses"
                element={
                  <ProtectedRoute allowedRoles={['content_creator']} redirectToLoginPath="/staff/login">
                    <CourseListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="courses/create"
                element={
                  <ProtectedRoute allowedRoles={['content_creator']} redirectToLoginPath="/staff/login">
                    <CourseBuilderPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="courses/:courseId/edit"
                element={
                  <ProtectedRoute allowedRoles={['content_creator']} redirectToLoginPath="/staff/login">
                    <CourseBuilderPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="courses/:courseId/final-quiz/build"
                element={
                  <ProtectedRoute allowedRoles={['content_creator']} redirectToLoginPath="/staff/login">
                    <FinalQuizBuilderPage />
                  </ProtectedRoute>
                }
              />
  
              {/* Assignments — hr only, mirrors the backend's requireHrRole */}
              <Route
                path="assignments"
                element={
                  <ProtectedRoute allowedRoles={['hr']} redirectToLoginPath="/staff/login">
                    <AssignmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="notifications"
                element={
                  <ProtectedRoute allowedRoles={['hr', 'admin', 'super_admin']} redirectToLoginPath="/staff/login">
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />
            </Route>
  
            {/* Lesson Builder — standalone full-screen layout (no staff sidebar), matching the Figma */}
            <Route
              path="/staff/courses/:courseId/lessons/:lessonId/build"
              element={
                <ProtectedRoute allowedRoles={['content_creator']} redirectToLoginPath="/staff/login">
                  <LessonBuilderPage />
                </ProtectedRoute>
              }
            />
  
            {/* Fallback Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
export default App;
