import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import ErrorBoundary from './components/ErrorBoundary';
// Lazy load pages for code splitting
import LayoutNew from './components/LayoutNew';
const DashboardOverview = React.lazy(() => import('./pages/DashboardOverview'));
const Login = React.lazy(() => import('./pages/Login'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
// Signup removed
const TeacherDashboard = React.lazy(() => import('./pages/teacher/TeacherDashboard'));
const HODDashboard = React.lazy(() => import('./pages/hod/HODDashboard'));
const MentorshipManagement = React.lazy(() => import('./pages/hod/MentorshipManagement'));
const MentorDashboard = React.lazy(() => import('./pages/mentor/MentorDashboard'));
const Mentees = React.lazy(() => import('./pages/mentor/Mentees'));
const StudentLeaves = React.lazy(() => import('./pages/student/StudentLeaves'));
const MentorLeaves = React.lazy(() => import('./pages/mentor/MentorLeaves'));
const StudentAcademic = React.lazy(() => import('./pages/student/StudentAcademic'));
const ParentResponse = React.lazy(() => import('./pages/ParentResponse'));
const MentorMeetings = React.lazy(() => import('./pages/mentor/MentorMeetings'));
const StudentAttendance = React.lazy(() => import('./pages/student/StudentAttendance'));
const MentorAttendance = React.lazy(() => import('./pages/mentor/MentorAttendance'));
const HODScheduleUpload = React.lazy(() => import('./pages/hod/HODScheduleUpload'));
const AcademicCalendar = React.lazy(() => import('./pages/AcademicCalendar'));
const ScheduleView = React.lazy(() => import('./components/ScheduleView'));
const StudentCourses = React.lazy(() => import('./pages/student/StudentCourses'));
const StudentCourseDetails = React.lazy(() => import('./pages/student/StudentCourseDetails'));
const StudentAssignments = React.lazy(() => import('./pages/student/StudentAssignments'));
const StudentExamSeating = React.lazy(() => import('./pages/student/StudentExamSeating'));
const TeacherCourseCatalog = React.lazy(() => import('./pages/teacher/TeacherCourseCatalog'));
const TeacherCourseManage = React.lazy(() => import('./pages/teacher/TeacherCourseManage'));
const TeacherStudentList = React.lazy(() => import('./pages/teacher/TeacherStudentList'));
const TeacherGrading = React.lazy(() => import('./pages/teacher/TeacherGrading'));
const HODCurriculum = React.lazy(() => import('./pages/hod/HODCurriculum'));
const HODFaculty = React.lazy(() => import('./pages/hod/HODFaculty'));
const HODStudents = React.lazy(() => import('./pages/hod/HODStudents'));
const HODAnalytics = React.lazy(() => import('./pages/hod/HODAnalytics'));
const StudentCourseRegistration = React.lazy(() => import('./pages/student/StudentCourseRegistration'));
const TeacherQuestionManager = React.lazy(() => import('./pages/teacher/TeacherQuestionManager'));
const TeacherAttendanceLog = React.lazy(() => import('./pages/teacher/TeacherAttendanceLog'));
const COEDashboard = React.lazy(() => import('./pages/coe/COEDashboard'));
const COEExamSchedule = React.lazy(() => import('./pages/coe/COEExamSchedule'));
const COEResultPublish = React.lazy(() => import('./pages/coe/COEResultPublish'));
const COEVenues = React.lazy(() => import('./pages/coe/COEVenues'));
const COESeatingAllocation = React.lazy(() => import('./pages/coe/COESeatingAllocation'));
const StudentResults = React.lazy(() => import('./pages/student/StudentResults'));
const HODMeetings = React.lazy(() => import('./pages/hod/HODMeetings'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUserList = React.lazy(() => import('./pages/admin/AdminUserList'));
const AdminCourseManagement = React.lazy(() => import('./pages/admin/AdminCourseManagement'));
const AdminStudentList = React.lazy(() => import('./pages/admin/AdminStudentList'));
const AdminTeacherList = React.lazy(() => import('./pages/admin/AdminTeacherList'));
const AdminDataReports = React.lazy(() => import('./pages/admin/AdminDataReports'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));
const AdminFinance = React.lazy(() => import('./pages/admin/AdminFinance'));
const Calendar = React.lazy(() => import('./pages/Calendar'));
const GateStudentEntry = React.lazy(() => import('./pages/gate/GateStudentEntry'));
const GateDashboard = React.lazy(() => import('./pages/gate/GateDashboard'));
const VisitorLog = React.lazy(() => import('./pages/gate/VisitorLog'));
const MyProfile = React.lazy(() => import('./pages/MyProfile'));
import './App.css';

// ... existing code ...

const PrivateRoute = ({ children, allowedRoles }) => {
  const { currentUser, userData, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading...</div>;

  if (!currentUser) return <Navigate to="/login" />;

  // If role-based protection is needed
  if (allowedRoles && userData && !allowedRoles.includes(userData.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// Helper to determine the dashboard internal route based on role
const RoleBasedRedirect = () => {
  const { currentUser, userData, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading...</div>;

  // If user is logged in but userData hasn't loaded yet, wait.
  // This prevents defaulting to Student Dashboard prematurely.
  if (currentUser && !userData) {
    return <div className="loading-screen">Fetching Profile...</div>;
  }

  // Redirect logic
  switch (userData?.role) {
    case 'STUDENT': return <Navigate to="/student/dashboard" replace />;
    case 'TEACHER': return <Navigate to="/teacher/dashboard" replace />;
    case 'MENTOR': return <Navigate to="/mentor/dashboard" replace />;
    case 'HOD': return <Navigate to="/hod/dashboard" replace />;
    case 'PRINCIPAL': return <Navigate to="/principal/dashboard" replace />;
    case 'ADMIN': return <Navigate to="/admin/dashboard" replace />;
    case 'COE': return <Navigate to="/coe/dashboard" replace />;
    case 'GATE_SECURITY': return <Navigate to="/gate/dashboard" replace />;
    default: return <DashboardOverview />;
  }
};

// Reusable loading fallback — avoids blank flash between lazy-loaded pages
const PageLoader = () => (
  <div className="loading-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px' }}>
    <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.9rem' }}>Loading...</span>
  </div>
);

function App() {
  return (
    <ErrorBoundary message="A critical error occurred. Please refresh the page.">
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <SettingsProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  {/* Signup route removed */}
                  <Route path="/parent-response/:token" element={<ParentResponse />} />
                  <Route
                    path="/teacher/courses/:sectionId"
                    element={
                      <PrivateRoute allowedRoles={['TEACHER', 'MENTOR', 'ADMIN']}>
                        <LayoutNew>
                          <TeacherCourseManage />
                        </LayoutNew>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/teacher/courses/:sectionId/questions"
                    element={
                      <PrivateRoute allowedRoles={['TEACHER', 'MENTOR', 'ADMIN']}>
                        <LayoutNew>
                          <TeacherQuestionManager />
                        </LayoutNew>
                      </PrivateRoute>
                    }
                  />



                  <Route path="/" element={
                    <PrivateRoute>
                      <LayoutNew />
                    </PrivateRoute>
                  }>
                    <Route index element={<RoleBasedRedirect />} />
                    <Route path="dashboard" element={<RoleBasedRedirect />} />

                    {/* Student Routes */}
                    <Route path="student/dashboard" element={<DashboardOverview />} />
                    <Route path="student/courses" element={<StudentCourses />} />
                    <Route path="student/courses/:sectionId" element={<StudentCourseDetails />} />
                    <Route path="student/course-registration" element={<StudentCourseRegistration />} />
                    <Route path="student/assignments" element={<StudentAssignments />} />
                    <Route path="student/exam-seating" element={<StudentExamSeating />} />
                    <Route path="student/leaves" element={<StudentLeaves />} />
                    <Route path="student/academic" element={<StudentAcademic />} />
                    <Route path="attendance" element={<StudentAttendance />} />

                    {/* Teacher Routes */}
                    <Route path="teacher/dashboard" element={<MentorDashboard />} />
                    <Route path="teacher/marking-attendance" element={<TeacherAttendanceLog />} />
                    <Route path="teacher/courses" element={<TeacherCourseCatalog />} />
                    <Route path="teacher/courses/:sectionId/manage" element={<TeacherCourseManage />} />
                    <Route path="teacher/courses/:sectionId/students" element={<TeacherStudentList />} />
                    <Route path="grading" element={<TeacherGrading />} />
                    <Route path="study-materials" element={<div>Study Materials Repository</div>} />

                    {/* Mentor Routes */}
                    <Route path="mentor/dashboard" element={<MentorDashboard />} />
                    <Route path="mentees" element={<Mentees />} />
                    <Route path="mentor/leaves" element={<MentorLeaves />} />
                    <Route path="mentor/attendance" element={<MentorAttendance />} />
                    <Route path="performance-reports" element={<div>Mentee Performance Analytics (Coming Soon)</div>} />
                    <Route path="meetings" element={<MentorMeetings />} />

                    <Route path="hod/dashboard" element={<HODDashboard />} />
                    <Route path="mentorship-management" element={<MentorshipManagement />} />
                    <Route path="faculty-management" element={<HODFaculty />} />
                    <Route path="students-directory" element={<HODStudents />} />
                    <Route path="hod/schedule-upload" element={<HODScheduleUpload />} />
                    <Route path="hod/meetings" element={<HODMeetings />} />
                    <Route path="curriculum" element={<HODCurriculum />} />
                    <Route path="department-analytics" element={<HODAnalytics />} />

                    {/* Shared Routes */}
                    <Route path="my-profile" element={<MyProfile />} />
                    <Route path="schedule" element={<ScheduleView />} />
                    <Route path="academic-calendar" element={<AcademicCalendar />} />
                    <Route path="calendar" element={<Calendar />} />
                    <Route path="announcements" element={<div>Announcements Page</div>} />

                    {/* Principal Routes */}
                    <Route path="principal/dashboard" element={<div>Institutional Insights</div>} />

                    {/* Admin Routes */}
                    <Route path="admin/dashboard" element={<AdminDashboard />} />
                    <Route path="admin/users" element={<AdminUserList />} />
                    <Route path="admin/teachers" element={<AdminTeacherList />} />
                    <Route path="admin/students" element={<AdminStudentList />} />
                    <Route path="admin/courses" element={<AdminCourseManagement />} />
                    <Route path="admin/reports" element={<AdminDataReports />} />
                    <Route path="admin/settings" element={<AdminSettings />} />
                    <Route path="admin/finance" element={<AdminFinance />} />




                    {/* COE Routes */}
                    <Route path="coe/dashboard" element={<COEDashboard />} />
                    <Route path="coe/schedule-exams" element={<COEExamSchedule />} />
                    <Route path="coe/publish-results" element={<COEResultPublish />} />
                    <Route path="coe/venues" element={<COEVenues />} />
                    <Route path="coe/seating-allocation" element={<COESeatingAllocation />} />
                    <Route path="student/results" element={<StudentResults />} />

                    {/* Gate Security Routes */}
                    <Route path="gate/dashboard" element={<GateDashboard />} />
                    <Route path="gate/visitor-log" element={<VisitorLog />} />
                    <Route path="gate/student-entry" element={<GateStudentEntry />} />
                  </Route>
                </Routes>
              </SettingsProvider>
            </Suspense>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary >
  );
}

export default App;