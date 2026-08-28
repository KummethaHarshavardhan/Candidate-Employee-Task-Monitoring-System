import React from 'react';
import { CandidateListPage } from './pages/candidates/CandidateListPage';
import { CandidateDetailsPage } from './pages/candidates/CandidateDetailsPage';
import { TaskListPage } from './pages/tasks/TaskListPage';

export const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
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
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;