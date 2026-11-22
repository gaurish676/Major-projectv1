import React, { useState, useEffect, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import { SplashScreen } from './components/tasknest/SplashScreen';
import { MainDashboard } from './components/tasknest/MainDashboard';
import { Login } from './pages/auth/Login';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { TopLoadingBar } from './components/common/TopLoadingBar';
import { DashboardSkeleton } from './components/common/SkeletonLoaders';
import { SubmitActivityModal } from './components/common/SubmitActivityModal';
import { SchemaRequestModal } from './components/common/SchemaRequestModal';
import { LMSFooter } from './components/common/LMSFooter';

// Code-Split Dynamic Route Pages for Legacy Creditz System
const StudentDashboard = React.lazy(() => import('./pages/student/StudentDashboard').then((m) => ({ default: m.StudentDashboard })));
const SubmissionHistory = React.lazy(() => import('./pages/student/SubmissionHistory').then((m) => ({ default: m.SubmissionHistory })));
const ExploreSchema = React.lazy(() => import('./pages/student/ExploreSchema').then((m) => ({ default: m.ExploreSchema })));
const StudentEvents = React.lazy(() => import('./pages/student/StudentEvents').then((m) => ({ default: m.StudentEvents })));
const UpdateMarks = React.lazy(() => import('./pages/student/UpdateMarks').then((m) => ({ default: m.UpdateMarks })));
const StudentVisualAnalytics = React.lazy(() => import('./components/common/StudentVisualAnalytics').then((m) => ({ default: m.StudentVisualAnalytics })));

const MentorDashboard = React.lazy(() => import('./pages/mentor/MentorDashboard').then((m) => ({ default: m.MentorDashboard })));
const MenteeList = React.lazy(() => import('./pages/mentor/MenteeList').then((m) => ({ default: m.MenteeList })));
const ReviewSubmissions = React.lazy(() => import('./pages/mentor/ReviewSubmissions').then((m) => ({ default: m.ReviewSubmissions })));
const MentorRequests = React.lazy(() => import('./pages/mentor/MentorRequests').then((m) => ({ default: m.MentorRequests })));
const MentorStudentMarks = React.lazy(() => import('./pages/mentor/MentorStudentMarks').then((m) => ({ default: m.MentorStudentMarks })));
const MentorPlacementEligibility = React.lazy(() => import('./pages/mentor/MentorPlacementEligibility').then((m) => ({ default: m.MentorPlacementEligibility })));

const HODDashboard = React.lazy(() => import('./pages/hod/HODDashboard').then((m) => ({ default: m.HODDashboard })));
const SchemaManager = React.lazy(() => import('./pages/hod/SchemaManager').then((m) => ({ default: m.SchemaManager })));
const MentorRequestsQueue = React.lazy(() => import('./pages/hod/MentorRequestsQueue').then((m) => ({ default: m.MentorRequestsQueue })));
const StudentMentorAllocation = React.lazy(() => import('./pages/hod/StudentMentorAllocation').then((m) => ({ default: m.StudentMentorAllocation })));
const CoordinatorMasterSheet = React.lazy(() => import('./pages/hod/CoordinatorMasterSheet').then((m) => ({ default: m.CoordinatorMasterSheet })));

const DeanDashboard = React.lazy(() => import('./pages/dean/DeanDashboard').then((m) => ({ default: m.DeanDashboard })));
const ProfilePage = React.lazy(() => import('./pages/common/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const PublicVerificationPage = React.lazy(() => import('./pages/public/PublicVerificationPage').then((m) => ({ default: m.PublicVerificationPage })));

const PageLoadingFallback: React.FC = () => <DashboardSkeleton />;

const CreditzPortal: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSchemaRequestModalOpen, setIsSchemaRequestModalOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileSidebarOpen((prev) => !prev);
    } else {
      setIsDesktopSidebarOpen((prev) => !prev);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (user.role === 'dean') setActiveTab('dean-dashboard');
    else if (user.role === 'hod') setActiveTab('hod-dashboard');
    else if (user.role === 'mentor') setActiveTab('mentor-dashboard');
    else setActiveTab('student-dashboard');
  }, [user?.role, user?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-300">Initializing Academic Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased overflow-x-hidden">
      <TopLoadingBar />
      <Navbar
        onToggleSidebar={handleToggleSidebar}
        onNavigateProfile={() => setActiveTab('profile')}
        onNavigateHome={() => {
          if (user.role === 'dean') setActiveTab('dean-dashboard');
          else if (user.role === 'student') setActiveTab('student-dashboard');
          else if (user.role === 'mentor') setActiveTab('mentor-dashboard');
          else setActiveTab('hod-dashboard');
        }}
        onNavigateTab={setActiveTab}
      />

      <div className="flex-1 flex max-w-[1536px] w-full mx-auto">
        {isDesktopSidebarOpen && (
          <div className="hidden lg:block transition-all shrink-0 sticky top-24 self-start max-h-[calc(100vh-6rem)] overflow-y-auto z-20">
            <Sidebar
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
              onOpenSchemaRequestModal={() => setIsSchemaRequestModalOpen(true)}
              onClose={() => setIsDesktopSidebarOpen(false)}
            />
          </div>
        )}

        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative w-72 max-w-[85vw] bg-white z-10 shadow-2xl h-full overflow-y-auto">
              <Sidebar
                activeTab={activeTab}
                onSelectTab={(tab) => {
                  setActiveTab(tab);
                  setIsMobileSidebarOpen(false);
                }}
                onOpenSubmitModal={() => {
                  setIsSubmitModalOpen(true);
                  setIsMobileSidebarOpen(false);
                }}
                onOpenSchemaRequestModal={() => {
                  setIsSchemaRequestModalOpen(true);
                  setIsMobileSidebarOpen(false);
                }}
                onClose={() => setIsMobileSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        <main className="flex-1 p-3 sm:p-4 lg:p-5 min-w-0 overflow-x-hidden">
          <Suspense fallback={<PageLoadingFallback />}>
            <div key={activeTab} className="animate-view-fade">
              {activeTab === 'profile' && (
                <ProfilePage
                  onBack={() => {
                    if (user.role === 'dean') setActiveTab('dean-dashboard');
                    else if (user.role === 'hod') setActiveTab('hod-dashboard');
                    else if (user.role === 'mentor') setActiveTab('mentor-dashboard');
                    else setActiveTab('student-dashboard');
                  }}
                />
              )}
              {activeTab === 'student-dashboard' && (
                <StudentDashboard
                  onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
                  onNavigateTab={setActiveTab}
                />
              )}
              {activeTab === 'submission-history' && <SubmissionHistory />}
              {activeTab === 'explore-schema' && (
                <ExploreSchema onOpenSubmitModal={() => setIsSubmitModalOpen(true)} />
              )}
              {activeTab === 'student-events' && <StudentEvents />}
              {activeTab === 'update-marks' && <UpdateMarks />}
              {activeTab === 'student-analytics' && <StudentVisualAnalytics />}
              {activeTab === 'mentor-dashboard' && (
                <MentorDashboard onNavigateTab={setActiveTab} />
              )}
              {activeTab === 'mentee-list' && (
                <MenteeList onSelectMentee={() => setActiveTab('mentor-dashboard')} />
              )}
              {activeTab === 'review-submissions' && <ReviewSubmissions />}
              {activeTab === 'mentor-requests' && <MentorRequests />}
              {activeTab === 'mentor-student-marks' && <MentorStudentMarks />}
              {activeTab === 'mentor-placement' && <MentorPlacementEligibility />}
              {activeTab === 'hod-dashboard' && <HODDashboard onNavigateTab={setActiveTab} />}
              {activeTab === 'schema-manager' && <SchemaManager />}
              {activeTab === 'mentor-requests-queue' && <MentorRequestsQueue />}
              {activeTab === 'student-mentor-allocation' && <StudentMentorAllocation />}
              {activeTab === 'coordinator-master-sheet' && <CoordinatorMasterSheet />}
              {activeTab === 'dean-dashboard' && <DeanDashboard />}
            </div>
          </Suspense>
        </main>
      </div>

      <LMSFooter />

      {isSubmitModalOpen && (
        <SubmitActivityModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          onSuccess={() => {}}
        />
      )}

      {isSchemaRequestModalOpen && (
        <SchemaRequestModal
          isOpen={isSchemaRequestModalOpen}
          onClose={() => setIsSchemaRequestModalOpen(false)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  // Check URL pathname for direct verification or optional sub-route
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isVerifyRoute = pathname.startsWith('/verify/');
  const verifyCredentialId = isVerifyRoute ? pathname.replace(/^\/verify\//, '').trim() : '';
  const isTaskNestRoute = pathname.startsWith('/tasknest');

  if (isVerifyRoute && verifyCredentialId) {
    return (
      <AuthProvider>
        <LoadingProvider>
          <Suspense fallback={<PageLoadingFallback />}>
            <PublicVerificationPage
              credentialId={verifyCredentialId}
              onNavigateHome={() => {
                window.location.href = '/';
              }}
            />
          </Suspense>
        </LoadingProvider>
      </AuthProvider>
    );
  }

  if (isTaskNestRoute) {
    return (
      <>
        {showSplash ? (
          <SplashScreen onLoaded={() => setShowSplash(false)} />
        ) : (
          <MainDashboard />
        )}
      </>
    );
  }

  // Primary Default App: Creditz Student Activity Points & Mentorship Portal
  return (
    <AuthProvider>
      <LoadingProvider>
        <CreditzPortal />
      </LoadingProvider>
    </AuthProvider>
  );
};

export default App;
