import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout/AppLayout';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { VerifyOTPPage } from './pages/auth/VerifyOTPPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { CandidateListPage } from './pages/candidates/CandidateListPage';
import { CandidateDetailsPage } from './pages/candidates/CandidateDetailsPage';
import { TaskListPage } from './pages/tasks/TaskListPage';
import { CreateTaskPage } from './pages/tasks/CreateTaskPage';
import { TaskDetailsPage } from './pages/tasks/TaskDetailsPage';
import { ProgressDashboardPage } from './pages/progress/ProgressDashboardPage';
import { CandidateProgressPage } from './pages/progress/CandidateProgressPage';
import { TeamProgressPage } from './pages/progress/TeamProgressPage';
import { SubmissionListPage } from './pages/submissions/SubmissionListPage';
import { ReviewQueuePage } from './pages/reviews/ReviewQueuePage';
import { ReportsOverviewPage } from './pages/reports/ReportsOverviewPage';
import { CandidateReportsPage } from './pages/reports/CandidateReportsPage';
import { TeamReportsPage } from './pages/reports/TeamReportsPage';
import { TaskReportsPage } from './pages/reports/TaskReportsPage';
import { ProfilePage } from './pages/profile/ProfilePage/ProfilePage';

export const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-otp" element={<VerifyOTPPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Application Layout */}
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

            {/* Candidates Module (Admin & Reviewer) */}
            <Route
              path="candidates"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'REVIEWER']}>
                  <CandidateListPage />
                </ProtectedRoute>
              }
            />
            <Route path="candidates/:id" element={<CandidateDetailsPage />} />

            {/* Task Allocation Module */}
            <Route path="tasks" element={<TaskListPage />} />
            <Route
              path="tasks/create"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'REVIEWER']}>
                  <CreateTaskPage />
                </ProtectedRoute>
              }
            />
            <Route path="tasks/:id" element={<TaskDetailsPage />} />

            {/* Progress Monitoring Module */}
            <Route path="progress" element={<ProgressDashboardPage />} />
            <Route path="progress/candidates" element={<CandidateProgressPage />} />
            <Route path="progress/teams" element={<TeamProgressPage />} />

            {/* Submissions & Reviews Module */}
            <Route path="submissions" element={<SubmissionListPage />} />
            <Route
              path="reviews"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'REVIEWER']}>
                  <ReviewQueuePage />
                </ProtectedRoute>
              }
            />

            {/* Evaluation & Reports Module */}
            <Route path="reports" element={<ReportsOverviewPage />} />
            <Route path="reports/candidates" element={<CandidateReportsPage />} />
            <Route path="reports/teams" element={<TeamReportsPage />} />
            <Route path="reports/tasks" element={<TaskReportsPage />} />

            {/* Account Profile */}
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;

