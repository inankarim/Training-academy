import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { refreshApi } from './services/auth.service';

import { LearnerLoginPage } from './pages/auth/LearnerLoginPage';
import { StaffLoginPage } from './pages/auth/StaffLoginPage';
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage';
import { SystemStatusPage } from './pages/SystemStatusPage';

import { StaffLayout } from './layouts/StaffLayout';
import { LearnerLayout } from './layouts/LearnerLayout';

import { LearnerDashboard } from './pages/learner/LearnerDashboard';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { UserListPage } from './pages/staff/UserListPage';
import { CreateUserPage } from './pages/staff/CreateUserPage';
import { CourseListPage } from './pages/staff/CourseListPage';
import { CourseBuilderPage } from './pages/staff/CourseBuilderPage';
import { FinalQuizBuilderPage } from './pages/staff/FinalQuizBuilderPage';
import { LessonBuilderPage } from './pages/staff/LessonBuilderPage';
import { AssignmentsPage } from './pages/staff/AssignmentsPage';

import { LearningPathsPage } from './pages/learner/LearningPathsPage';
import { LearningPathCoursesPage } from './pages/learner/LearningPathCoursesPage';
import { CourseOverviewPage } from './pages/learner/CourseOverviewPage';
import { LessonPlayerPage } from './pages/learner/LessonPlayerPage';

import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './components/auth/PublicRoute';

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
            <Route path="paths" element={<LearningPathsPage />} />
            <Route path="paths/:learningPath" element={<LearningPathCoursesPage />} />
            <Route path="courses/:courseId" element={<CourseOverviewPage />} />
            <Route path="lessons/:lessonId" element={<LessonPlayerPage />} />
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
      </BrowserRouter>
    </QueryClientProvider>
  );
}
export default App;
