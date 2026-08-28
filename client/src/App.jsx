import React from 'react';
import { CandidateListPage } from './pages/candidates/CandidateListPage';
import { CandidateDetailsPage } from './pages/candidates/CandidateDetailsPage';
import { TaskListPage } from './pages/tasks/TaskListPage';
import { TaskListPage } from './pages/tasks/TaskListPage';   
import { CreateTaskPage } from './pages/tasks/CreateTaskPage'; 
import { ReviewQueuePage } from './pages/reviews/ReviewQueuePage';

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

          <Route path="submissions" element={<SubmissionListPage />} />

          <Route
              path="reviews"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'REVIEWER']}>
                  <ReviewQueuePage />
                </ProtectedRoute>
              }
            />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;