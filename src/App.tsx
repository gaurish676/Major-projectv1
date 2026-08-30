import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/auth/Login';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { SubmitActivityModal } from './components/common/SubmitActivityModal';
import { SchemaRequestModal } from './components/common/SchemaRequestModal';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { SubmissionHistory } from './pages/student/SubmissionHistory';
import { ExploreSchema } from './pages/student/ExploreSchema';
import { StudentEvents } from './pages/student/StudentEvents';
import { UpdateMarks } from './pages/student/UpdateMarks';
import { CollegeClubs } from './pages/student/CollegeClubs';

// Mentor Pages
import { MentorDashboard } from './pages/mentor/MentorDashboard';
import { MenteeList } from './pages/mentor/MenteeList';
import { ReviewSubmissions } from './pages/mentor/ReviewSubmissions';
import { MentorRequests } from './pages/mentor/MentorRequests';
import { MentorStudentMarks } from './pages/mentor/MentorStudentMarks';

// HOD Pages
import { HODDashboard } from './pages/hod/HODDashboard';
import { SchemaManager } from './pages/hod/SchemaManager';
import { MentorRequestsQueue } from './pages/hod/MentorRequestsQueue';
import { StudentMentorAllocation } from './pages/hod/StudentMentorAllocation';

// Common Pages
import { ProfilePage } from './pages/common/ProfilePage';
import { DevConsole } from './pages/dev/DevConsole';

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSchemaRequestModalOpen, setIsSchemaRequestModalOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setIsDesktopSidebarOpen((prev) => !prev);
    setIsMobileSidebarOpen((prev) => !prev);
  };

  // Set default tab on login / persona switch based on role
  useEffect(() => {
    if (!user) return;
    if (user.role === 'developer') {
      setActiveTab('dev-console');
    } else if (user.role === 'hod') {
      setActiveTab('hod-dashboard');
    } else if (user.role === 'mentor') {
      setActiveTab('mentor-dashboard');
    } else {
      setActiveTab('student-dashboard');
    }
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
    <div className="h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased overflow-hidden">
      {/* Top Navbar with 1-Click Persona Switcher */}
      <Navbar
        onToggleSidebar={handleToggleSidebar}
        onNavigateProfile={() => setActiveTab('profile')}
        onNavigateDevConsole={() => setActiveTab('dev-console')}
        onNavigateHome={() => {
          if (user.role === 'developer') setActiveTab('dev-console');
          else if (user.role === 'student') setActiveTab('student-dashboard');
          else if (user.role === 'mentor') setActiveTab('mentor-dashboard');
          else setActiveTab('hod-dashboard');
        }}
      />

      <div className="flex-1 flex min-h-0 max-w-[1536px] w-full mx-auto overflow-hidden">
        {/* Desktop Sidebar */}
        {isDesktopSidebarOpen && (
          <div className="hidden lg:flex lg:flex-col h-full overflow-y-auto shrink-0 transition-all">
            <Sidebar
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
              onOpenSchemaRequestModal={() => setIsSchemaRequestModalOpen(true)}
              onClose={() => setIsDesktopSidebarOpen(false)}
            />
          </div>
        )}

        {/* Mobile Drawer Sidebar */}
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

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto p-3 sm:p-4 lg:p-5">
          {/* Universal Profile & Developer Console Views */}
          {activeTab === 'profile' && (
            <ProfilePage
              onBack={() => {
                if (user.role === 'developer') setActiveTab('dev-console');
                else if (user.role === 'hod') setActiveTab('hod-dashboard');
                else if (user.role === 'mentor') setActiveTab('mentor-dashboard');
                else setActiveTab('student-dashboard');
              }}
            />
          )}

          {(activeTab === 'dev-console' || user.role === 'developer') && activeTab !== 'profile' && <DevConsole />}

          {/* Student Views */}
          {user.role === 'student' && activeTab !== 'profile' && activeTab !== 'dev-console' && (
            <>
              {(activeTab === 'student-dashboard' || activeTab === 'home') && (
                <StudentDashboard
                  onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
                  onNavigateTab={setActiveTab}
                />
              )}
              {activeTab === 'student-marks' && <UpdateMarks />}
              {activeTab === 'student-clubs' && <CollegeClubs onNavigateTab={setActiveTab} />}
              {activeTab === 'student-submissions' && (
                <SubmissionHistory
                  onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
                />
              )}
              {activeTab === 'student-schema' && <ExploreSchema />}
              {activeTab === 'student-events' && <StudentEvents />}
            </>
          )}

          {/* Mentor Views */}
          {user.role === 'mentor' && activeTab !== 'profile' && activeTab !== 'dev-console' && (
            <>
              {(activeTab === 'mentor-dashboard' || activeTab === 'home') && (
                <MentorDashboard
                  onOpenSchemaRequestModal={() => setIsSchemaRequestModalOpen(true)}
                  onNavigateTab={setActiveTab}
                />
              )}
              {activeTab === 'mentor-mentees' && <MenteeList />}
              {(activeTab === 'mentor-reviews' || activeTab === 'mentor-evaluations') && <ReviewSubmissions />}
              {activeTab === 'mentor-marks' && <MentorStudentMarks />}
              {activeTab === 'mentor-requests' && (
                <MentorRequests
                  onOpenModal={() => setIsSchemaRequestModalOpen(true)}
                  isModalOpen={isSchemaRequestModalOpen}
                  onCloseModal={() => setIsSchemaRequestModalOpen(false)}
                />
              )}
              {(activeTab === 'mentor-schema' || activeTab === 'student-schema') && <ExploreSchema />}
              {activeTab === 'student-events' && <StudentEvents />}
              {activeTab === 'student-clubs' && <CollegeClubs onNavigateTab={setActiveTab} />}
            </>
          )}

          {/* HOD Views */}
          {user.role === 'hod' && activeTab !== 'profile' && activeTab !== 'dev-console' && (
            <>
              {(activeTab === 'hod-dashboard' || activeTab === 'home') && (
                <HODDashboard onNavigateTab={setActiveTab} />
              )}
              {(activeTab === 'hod-schemas' || activeTab === 'hod-schema') && <SchemaManager />}
              {activeTab === 'hod-requests' && <MentorRequestsQueue />}
              {activeTab === 'student-events' && <StudentEvents />}
              {activeTab === 'student-clubs' && <CollegeClubs onNavigateTab={setActiveTab} />}
              {(activeTab === 'hod-allocation' || activeTab === 'hod-allocations' || activeTab === 'hod-reports') && (
                <StudentMentorAllocation />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <SubmitActivityModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSuccess={() => {
          // If in submissions history, re-fetch happens via state or navigate
          setActiveTab('student-submissions');
        }}
      />

      <SchemaRequestModal
        isOpen={isSchemaRequestModalOpen}
        onClose={() => setIsSchemaRequestModalOpen(false)}
        onSuccess={() => {
          if (user.role === 'mentor') {
            setActiveTab('mentor-requests');
          }
        }}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};

export default App;
