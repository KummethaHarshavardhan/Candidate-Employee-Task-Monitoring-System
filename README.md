# Candidate & Employee Task Monitoring System (CETMS)

<div align="center">
  <img src="client/src/assets/spaxios-logo.svg" alt="SPAXIOS INNOVATION Logo" width="260" />
  <p><strong>Enterprise Platform for Candidate & Employee Task Monitoring, Submissions, Review Workflows, and Performance Analytics</strong></p>
  <p>Built for <strong>IT SPAXIOS INNOVATION</strong></p>
</div>



## 📌 Overview

**CETMS (Candidate & Employee Task Monitoring System)** is a full-stack enterprise web application designed to streamline candidate training, employee task allocation, multi-version submissions, rigorous peer reviews, and automated progress monitoring.

With robust **Role-Based Access Control (RBAC)** across `ADMIN`, `REVIEWER`, and `CANDIDATE` roles, real-time status transitions, dynamic deadline calculations, and secure **OTP-based Password Recovery**, CETMS provides a complete operational hub for training teams, technical leads, and candidates.



## ✨ Key Features

### 🔐 1. Authentication & Security
- **JWT-Based Authentication**: Secure token authorization and session management.
- **Strict Role-Based Access Control (RBAC)**:
  - **ADMIN**: Full system governance, user provisioning, candidate directory management, task allocation, and organizational reporting.
  - **REVIEWER**: Review queue management, approving submissions, requesting reworks, and team performance tracking.
  - **CANDIDATE**: Task dashboard, progress updates (0–100%), versioned assignment submissions, and review feedback audit logs.
- **OTP Password Recovery**:
  - Secure 6-digit email OTP generated via `crypto.randomInt`.
  - SHA-256 OTP hashing (plaintext OTPs are never stored in the database or logged).
  - Anti-enumeration protection (generic responses for non-existent accounts).
  - 5-minute OTP expiration and 60-second resend cooldown.
  - 5-attempt brute-force lockout.
  - Single-use 32-byte cryptographic authorization token (`resetAuthToken`, 10-minute expiry) required for password resetting.
  - Pre-save bcrypt hashing hooks ensuring single-hash password updates.

### 📋 2. Candidate & Employee Management
- Directory management with department, designation, team, email, and phone tracking.
- Automatic linkage between User accounts and Candidate entities.
- Role-enforced self-registration strictly locked to the `CANDIDATE` role.

### 🚀 3. Task Allocation & Lifecycle Management
- Task creation with priorities (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), deadlines, and team allocations.
- Assignment state machine:
  $$\text{PENDING} \longrightarrow \text{IN\_PROGRESS} \longrightarrow \text{SUBMITTED} \underset{\text{Approval}}{\overset{\text{Rework}}{\rightleftharpoons}} \text{REWORK\_REQUIRED} \longrightarrow \text{COMPLETED}$$
- Dynamic **Overdue** calculation based on assignment deadlines and active statuses.

### 🔍 4. Multi-Version Submission & Review Workflow
- Candidates submit versioned deliverables with GitHub repository URLs, hosted live demo links, notes, and task completion metrics.
- Reviewers evaluate submissions in a dedicated Review Queue:
  - **Approve**: Transitions assignment to `COMPLETED`.
  - **Request Rework**: Flags assignment as `REWORK_REQUIRED` and provides actionable reviewer feedback.
- Immutable audit log preserving full history of all past submission versions and review comments.

### 📊 5. Dynamic Evaluation & Analytics Dashboard
- Interactive charts powered by **Recharts**:
  - Candidate completion rates and on-time performance metrics.
  - Department and team velocity distributions.
  - Overdue task alerts and pending review queue statistics.
- Zero-division safe analytics engine ensuring stability across all database states.

### 📧 6. Automated Email Notifications
- Assignment notification emails sent to candidates upon task allocation.
- Submission alerts dispatched to reviewers.
- Branded, responsive OTP emails for secure password recovery.



## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 6, React Router DOM v6, Lucide React, Recharts |
| **Styling** | Scoped Vanilla CSS with Enterprise Dark Theme Design Tokens |
| **Backend** | Node.js, Express.js (v4.21) |
| **Database** | MongoDB with Mongoose ODM (v8.9) |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, Node.js `crypto` |
| **Email Delivery** | Nodemailer (Gmail or Custom SMTP Server) |
| **Security & Utilities** | In-Memory Sliding-Window Rate Limiter, Morgan logger, CORS |



## 📂 Project Architecture


Candidate-Employee-Task-Monitoring-System/
├── client/                               # React 18 + Vite Frontend
│   ├── src/
│   │   ├── api/                          # Axios API client with auth interceptors
│   │   ├── assets/                       # SVG logos, brand illustrations
│   │   ├── components/
│   │   │   ├── common/                   # Reusable UI: Button, Input, Modal, Badge, Table, etc.
│   │   │   └── layout/                   # ProtectedRoute, AppLayout, Sidebar, Topbar
│   │   ├── context/                      # AuthContext, ToastContext
│   │   ├── pages/
│   │   │   ├── auth/                     # LoginPage, RegisterPage, ForgotPasswordPage, VerifyOTPPage, ResetPasswordPage
│   │   │   ├── candidates/               # CandidateListPage, CandidateDetailsPage
│   │   │   ├── dashboard/                # DashboardPage (Role-adaptive view)
│   │   │   ├── progress/                 # ProgressDashboardPage, CandidateProgressPage, TeamProgressPage
│   │   │   ├── reports/                  # ReportsOverviewPage, CandidateReportsPage, TeamReportsPage, TaskReportsPage
│   │   │   ├── reviews/                  # ReviewQueuePage
│   │   │   ├── submissions/              # SubmissionListPage
│   │   │   └── tasks/                    # TaskListPage, CreateTaskPage, TaskDetailsPage
│   │   ├── services/                     # API service functions (authService, taskService, candidateService, etc.)
│   │   ├── App.jsx                       # Client router configuration
│   │   ├── index.css                     # Design system CSS variables & global tokens
│   │   └── main.jsx                      # Vite entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                               # Node.js + Express Backend
│   ├── src/
│   │   ├── config/                       # Database connection (connectDB)
│   │   ├── controllers/                  # Route controllers (auth, user, candidate, task, assignment, submission, review, report)
│   │   ├── middleware/                   # JWT auth, RBAC permissions, error handling, sliding-window rate limiter
│   │   ├── models/                       # Mongoose Models (User, Candidate, Task, Assignment, Submission, Review, Notification)
│   │   ├── routes/                       # Express route definitions
│   │   ├── scripts/                      # Admin bootstrap & demo data cleanup scripts
│   │   ├── seed/                         # Database seeder scripts
│   │   ├── utils/                        # Mailer templates, deadline calculators, response formatters
│   │   └── server.js                     # Express application entry point
│   ├── .env.example                      # Backend environment template
│   ├── test_otp_workflow.js              # Integration test suite for OTP password reset
│   ├── test_workflow.js                  # End-to-end regression test suite
│   └── package.json
│
└── README.md                             # Project documentation




## ⚙️ Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance (port 27017) or MongoDB Atlas connection URI



### 2. Backend Setup

1. Open a terminal and navigate to the `server/` directory:
   
   cd server
   

2. Install dependencies:
  
   npm install
  

3. Configure environment variables:
   Create a `.env` file in the `server/` directory by copying `.env.example`:
   
   cp .env.example .env
   

   Configure the required variables:
   env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173

   # Database Connection
   MONGODB_URI=mongodb://127.0.0.1:27017/candidate_task_monitoring_db

   # JWT & Auth Security
   JWT_SECRET=your_strong_jwt_secret_minimum_32_characters_here
   JWT_EXPIRES_IN=7d

   # OTP & Password Recovery Configuration
   OTP_EXPIRES_MINUTES=5
   OTP_MAX_ATTEMPTS=5
   OTP_RESEND_COOLDOWN_SECONDS=60
   PASSWORD_RESET_AUTH_EXPIRES_MINUTES=10

   # Initial Production Administrator Bootstrap
   ADMIN_NAME=System Administrator
   ADMIN_EMAIL=admin@company.local
   ADMIN_PASSWORD=AdminPassword123!

   # Email Delivery (Gmail or Custom SMTP)
   EMAIL=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   

4. Seed initial demo data (Optional):
   
   npm run seed
   

5. Start the backend server:

   npm run dev
   
   *The server will start on `http://localhost:5000`.*



### 3. Frontend Setup

1. In a new terminal window, navigate to the `client/` directory:
   
   cd client
 

2. Install dependencies:
   
   npm install
  

3. Start the Vite development server:
  
   npm run dev
   
   *The frontend application will be live at `http://localhost:5173`.*

4. Build for production:
  
   npm run build
   



## 📡 API Reference Summary

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new Candidate account | Public |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT | Public |
| `POST` | `/api/auth/forgot-password` | Request 6-digit verification OTP | Public (Rate Limited) |
| `POST` | `/api/auth/verify-otp` | Verify 6-digit OTP & receive `resetAuthToken` | Public |
| `POST` | `/api/auth/reset-password` | Reset password using `resetAuthToken` | Public |
| `GET` | `/api/auth/me` | Get profile of logged-in user | Private |
| `PUT` | `/api/auth/me` | Update name and phone number | Private |
| `POST` | `/api/auth/logout` | Clear authentication state | Private |

### Candidates (`/api/candidates`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/candidates` | List all candidates with task metrics | Admin / Reviewer |
| `POST` | `/api/candidates` | Create a new candidate profile | Admin / Reviewer |
| `GET` | `/api/candidates/:id` | Get candidate profile & assignments | Authenticated |
| `PUT` | `/api/candidates/:id` | Update candidate details | Admin / Reviewer |
| `DELETE` | `/api/candidates/:id` | Delete candidate profile | Admin |

### Tasks & Assignments (`/api/tasks`, `/api/assignments`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/tasks` | List all tasks | Authenticated |
| `POST` | `/api/tasks` | Create task & allocate to candidates | Admin / Reviewer |
| `GET` | `/api/tasks/:id` | Get detailed task information | Authenticated |
| `GET` | `/api/assignments` | List assignments (filtered by role) | Authenticated |
| `GET` | `/api/assignments/:id` | Get assignment details & audit history | Authenticated |

### Progress, Submissions & Reviews (`/api/progress`, `/api/submissions`, `/api/reviews`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `PUT` | `/api/progress/:assignmentId` | Update progress percentage (0–100%) | Candidate |
| `POST` | `/api/submissions` | Submit work deliverables (v1, v2, ...) | Candidate |
| `GET` | `/api/reviews/pending` | List pending submissions queue | Admin / Reviewer |
| `POST` | `/api/reviews/:submissionId/approve` | Approve submission & complete task | Admin / Reviewer |
| `POST` | `/api/reviews/:submissionId/rework` | Request rework with feedback | Admin / Reviewer |

### Evaluation & Reports (`/api/reports`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/reports/overview` | Overall system KPIs & completion metrics | Authenticated |
| `GET` | `/api/reports/candidates` | Individual candidate performance breakdown | Authenticated |
| `GET` | `/api/reports/teams` | Team-level metrics & velocity | Authenticated |
| `GET` | `/api/reports/tasks` | Task-wise performance & overdue stats | Authenticated |


## 🔒 Security Best Practices Implemented

- **Password Hashing**: Salted bcrypt hashing managed via Mongoose pre-save middleware.
- **Sensitive Field Exclusion**: Passwords, OTP hashes, attempt counters, and authorization tokens use `select: false`.
- **Anti-Brute Force**: Sliding-window rate limiter on OTP requests and automatic lockout after 5 incorrect OTP attempts.
- **Single-Use Authorization**: Password reset authorization tokens are cryptographically generated, hashed with SHA-256, and immediately destroyed upon successful password reset.
- **Strict Role Boundaries**: Cross-user resource access is strictly forbidden; candidates can only access their own assignments and submissions.


## 📄 License

This project is proprietary and confidential to **IT SPAXIOS INNOVATION**. All rights reserved.
