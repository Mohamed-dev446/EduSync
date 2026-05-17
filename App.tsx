import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// App pages
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import ClassesPage from './pages/ClassesPage';
import AssignmentsPage from './pages/AssignmentsPage';
import AttendancePage from './pages/AttendancePage';
import StudentsPage from './pages/StudentsPage';
import UsersPage from './pages/UsersPage';
import StatisticsPage from './pages/StatisticsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';

// Layout & Guards
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/guards/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            borderRadius: '10px',
            padding: '10px 14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#f8fafc' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#f8fafc' },
          },
        }}
      />

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected app routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route
            path="assignments"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                <AssignmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="attendance"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <AttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="students"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <StudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="statistics"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <StatisticsPage />
              </ProtectedRoute>
            }
          />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
