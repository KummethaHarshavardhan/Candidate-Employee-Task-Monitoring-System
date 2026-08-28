import React from 'react';
import { CandidateListPage } from './pages/candidates/CandidateListPage';
import { CandidateDetailsPage } from './pages/candidates/CandidateDetailsPage';
import { TaskListPage } from './pages/tasks/TaskListPage';
import { TaskListPage } from './pages/tasks/TaskListPage';   
import { CreateTaskPage } from './pages/tasks/CreateTaskPage'; 
import { ReviewQueuePage } from './pages/reviews/ReviewQueuePage';
import { CandidateProgressPage } from './pages/progress/CandidateProgressPage';
import { TeamProgressPage } from './pages/progress/TeamProgressPage';
import { SubmissionListPage } from './pages/submissions/SubmissionListPage';
import { ProgressDashboardPage } from './pages/progress/ProgressDashboardPage';
import { TeamReportsPage } from './pages/reports/TeamReportsPage';
import { TaskReportsPage } from './pages/reports/TaskReportsPage';

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
            
          <Route path="progress" element={<ProgressDashboardPage />} />  
          <Route path="reports/candidates" element={<CandidateReportsPage />} />
           <Route path="reports/teams" element={<TeamReportsPage />} />
            <Route path="reports/tasks" element={<TaskReportsPage />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;