import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from './Badge';
import { NotificationPopover } from './NotificationPopover';
import { SyncStatusBadge } from './SyncStatusBadge';
import { NitteLogo } from './NitteLogo';
import { PersonaSwitcherModal } from './PersonaSwitcherModal';
import { AcademicMessagesDrawer } from './AcademicMessagesDrawer';
import {
  Menu,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Bell,
  MessageSquare,
  Sparkles,
  ExternalLink,
  GraduationCap,
  Calendar,
  FileText,
  Sliders,
  CheckCircle2,
  FolderOpen,
  Award,
  Layers,
  ChevronRight,
  X,
  BookOpen,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onToggleRightDrawer?: () => void;
  isRightDrawerOpen?: boolean;
  onNavigateProfile?: () => void;
  onNavigateHome?: () => void;
  onNavigateTab?: (tab: string) => void;
  activeTab?: string;
  onOpenSubmitModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onToggleRightDrawer,
  isRightDrawerOpen = false,
  onNavigateProfile,
  onNavigateHome,
  onNavigateTab,
  activeTab = 'student-dashboard',
  onOpenSubmitModal,
}) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [linksDropdownOpen, setLinksDropdownOpen] = useState(false);
  const [isMessagesDrawerOpen, setIsMessagesDrawerOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isPersonaSwitcherOpen, setIsPersonaSwitcherOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const linksDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false);
      }
      if (linksDropdownRef.current && !linksDropdownRef.current.contains(target)) {
        setLinksDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
        setLinksDropdownOpen(false);
        setIsMessagesDrawerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full select-none shadow-xs print:hidden">
      {/* Tier 1: LMS Top Header Strip (#8eb86e) matching LMS screenshots */}
      <div className="bg-[#8eb86e] text-white text-xs px-3 sm:px-6 h-10 flex items-center justify-between border-b border-[#7cb05e]">
        {/* Left: Clean space matching LMS screenshot */}
        <div className="flex items-center gap-2">
          {/* Subtle indicator for faculty/admins only */}
          {user?.role !== 'student' && (
            <span className="font-semibold tracking-wide text-white/95 text-xs">
              NMAMIT Portal &bull; {user?.role?.toUpperCase()}
            </span>
          )}
        </div>

        {/* Right: LMS Header Controls (Bell, Messages, Initials Badge, Edit Mode) */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {user && (
            <>
              {/* Notification Popover (Bell) */}
              <div title="Notifications">
                <NotificationPopover />
              </div>

              {/* Message Drawer Toggle */}
              <button
                onClick={() => setIsMessagesDrawerOpen((prev) => !prev)}
                title="Academic Messaging & Notices"
                className="p-1.5 rounded-lg hover:bg-white/20 text-white transition cursor-pointer relative"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-amber-300 rounded-full ring-1 ring-[#8eb86e]" />
              </button>

              {/* User Avatar Badge with Initials (matching LMS screenshot NG) */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 py-1 px-1.5 rounded-lg hover:bg-white/20 transition cursor-pointer"
                  title="User Profile & Account"
                >
                  <div className="w-7 h-7 rounded-full bg-white text-[#5c873f] font-extrabold flex items-center justify-center text-xs shadow-xs">
                    {getInitials(user.name)}
                  </div>
                  <span className="hidden sm:inline font-bold text-xs max-w-[120px] truncate text-white">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-white/90" />
                </button>

                {/* Dropdown Menu (Styled exactly like LMS profile dropdown in Screenshot 09-07-31.png) */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 z-50 py-1 text-xs">
                    <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                      <div className="font-bold text-slate-900 truncate">{user.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                      <div className="mt-1 flex items-center justify-between">
                        <RoleBadge role={user.role} />
                        {user.roll_no && (
                          <span className="font-mono text-[10px] text-slate-500 font-semibold">
                            {user.roll_no}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onNavigateProfile?.();
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-medium transition cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        if (user.role === 'student') onNavigateTab?.('update-marks');
                        else if (user.role === 'mentor') onNavigateTab?.('mentor-student-marks');
                        else onNavigateTab?.('coordinator-master-sheet');
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-medium transition cursor-pointer"
                    >
                      <Award className="w-4 h-4 text-slate-400" />
                      <span>
                        {user.role === 'student'
                          ? 'Grades & Academic Marks'
                          : user.role === 'mentor'
                          ? 'Mentee MSE Counseling Marks'
                          : 'Institutional Grades & Ledger'}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigateTab?.('student-events');
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-medium transition cursor-pointer"
                    >
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Events Calendar</span>
                    </button>

                    <button
                      onClick={() => {
                        if (user.role === 'student') onNavigateTab?.('submission-history');
                        else if (user.role === 'mentor') onNavigateTab?.('review-submissions');
                        else onNavigateTab?.('coordinator-master-sheet');
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-medium transition cursor-pointer"
                    >
                      <FolderOpen className="w-4 h-4 text-slate-400" />
                      <span>
                        {user.role === 'student'
                          ? 'Submissions Ledger'
                          : user.role === 'mentor'
                          ? 'Review Queue'
                          : 'Master Accreditation Sheet'}
                      </span>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      onClick={() => {
                        setIsPersonaSwitcherOpen(true);
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-purple-50 flex items-center gap-2.5 text-purple-700 font-semibold transition cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>Switch Demo Persona</span>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-red-50 flex items-center gap-2.5 text-red-600 font-semibold transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log out</span>
                    </button>
                  </div>
                )}
              </div>

              {/* LMS Edit Mode Toggle (Matching LMS screenshot exactly!) */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/95 font-medium ml-1">
                <span>Edit mode</span>
                <button
                  type="button"
                  onClick={() => setEditMode((prev) => !prev)}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition cursor-pointer ${
                    editMode ? 'bg-white justify-end' : 'bg-white/40 justify-start'
                  }`}
                  title="Toggle Moodle Edit Mode"
                >
                  <div
                    className={`w-4 h-4 rounded-full shadow-xs transition ${
                      editMode ? 'bg-[#5c873f]' : 'bg-white'
                    }`}
                  />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tier 2: LMS Main Navbar (White background with NITTE Logo and Navigation links) */}
      <div className="bg-white border-b border-slate-200">
        <div className="w-full max-w-[1536px] mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Left: NITTE Logo (Hamburger shown only for faculty/admin) */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {user?.role !== 'student' && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer shrink-0"
                title="Toggle Sidebar Navigation"
                aria-label="Toggle Sidebar Navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Official NITTE NMAMIT Logo */}
            <NitteLogo onClick={onNavigateHome} />
          </div>

          {/* Right: LMS Navigation Menu ("Home", "Activities", "Creditz", "Links") */}
          <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
            {/* Primary Home Navigation for all entities */}
            <button
              onClick={onNavigateHome}
              className={`px-2.5 py-1.5 rounded-md transition cursor-pointer hidden sm:inline-block ${
                activeTab === 'home' ||
                activeTab === 'student-dashboard' ||
                activeTab === 'mentor-dashboard' ||
                activeTab === 'hod-dashboard' ||
                activeTab === 'dean-dashboard' ||
                activeTab === 'dean-overview' ||
                activeTab === ''
                  ? 'text-[#5c873f] font-bold border-b-2 border-[#8eb86e]'
                  : 'hover:text-[#8eb86e] hover:bg-slate-50'
              }`}
            >
              Home
            </button>

            {/* Activity Center / Courses link */}
            <button
              onClick={() => {
                onNavigateHome?.();
                setTimeout(() => {
                  const el = document.getElementById('activity-center-section') || document.getElementById('my-courses-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="px-2.5 py-1.5 rounded-md hover:text-[#8eb86e] hover:bg-slate-50 transition cursor-pointer hidden sm:inline-block"
            >
              Activities
            </button>

            {/* Activity Credits (Creditz) - Integrated Feature Indicator */}
            <button
              onClick={() => {
                if (user?.role === 'mentor') onNavigateTab?.('review-submissions');
                else if (user?.role === 'hod') onNavigateTab?.('coordinator-master-sheet');
                else if (user?.role === 'dean') onNavigateTab?.('dean-export');
                else onNavigateTab?.('submission-history');
              }}
              className={`px-2.5 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'submission-history' ||
                activeTab === 'student-submissions' ||
                activeTab === 'review-submissions' ||
                activeTab === 'mentor-reviews' ||
                activeTab === 'coordinator-master-sheet' ||
                activeTab === 'dean-export'
                  ? 'text-[#5c873f] font-bold bg-[#8eb86e]/15 border-b-2 border-[#8eb86e]'
                  : 'hover:text-[#8eb86e] hover:bg-slate-50 text-slate-700'
              }`}
              title="AICTE Mandatory Activity Credits & Submissions"
            >
              <GraduationCap className="w-4 h-4 text-[#8eb86e]" />
              <span>Activity Credits</span>
              <span className="hidden xl:inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#8eb86e]/20 text-[#426b27]">
                AICTE
              </span>
            </button>

            {/* "Guidelines" Dropdown (AICTE & Autonomous Norms) */}
            <div className="relative" ref={linksDropdownRef}>
              <button
                onClick={() => setLinksDropdownOpen((prev) => !prev)}
                className="px-2.5 py-1.5 rounded-md hover:text-[#8eb86e] hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5 text-slate-700"
                title="AICTE & Autonomous Activity Point Guidelines"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#5c873f]" />
                <span className="font-semibold text-xs sm:text-sm">Guidelines</span>
                <span className="hidden xl:inline-block px-1 py-0.2 rounded text-[9px] font-bold bg-[#8eb86e]/20 text-[#436b28]">
                  AICTE
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {linksDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 text-slate-800 z-50 p-4 max-h-[85vh] overflow-y-auto space-y-3.5">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#8eb86e]/20 text-[#5c873f] flex items-center justify-center">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 leading-tight">Activity Point Guidelines</h4>
                        <p className="text-[10px] text-slate-500">AICTE & Autonomous Degree Regulations</p>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#8eb86e] text-white">
                      100 Pts Min
                    </span>
                  </div>

                  {/* Degree Threshold Cards */}
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Regular B.Tech</span>
                      <span className="text-base font-black text-[#5c873f]">100 Pts</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Across 8 Semesters</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Lateral Entry</span>
                      <span className="text-base font-black text-[#ea580c]">75 Pts</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Sem 3 to Sem 8</span>
                    </div>
                  </div>

                  {/* Category Point Caps */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Accredited Categories & Maximum Caps
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="font-medium text-slate-700 flex items-center gap-1.5">
                          <span>💻</span> Technical & Hackathons
                        </span>
                        <span className="font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded text-[10.5px]">
                          Max 60 Pts
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="font-medium text-slate-700 flex items-center gap-1.5">
                          <span>🏅</span> Sports & Physical Activities
                        </span>
                        <span className="font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.2 rounded text-[10.5px]">
                          Max 40 Pts
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="font-medium text-slate-700 flex items-center gap-1.5">
                          <span>🤝</span> NSS / NCC & Community Service
                        </span>
                        <span className="font-bold text-amber-700 bg-amber-100/60 px-1.5 py-0.2 rounded text-[10.5px]">
                          Max 40 Pts
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="font-medium text-slate-700 flex items-center gap-1.5">
                          <span>🎭</span> Cultural & Literary Arts
                        </span>
                        <span className="font-bold text-purple-700 bg-purple-100/60 px-1.5 py-0.2 rounded text-[10.5px]">
                          Max 30 Pts
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="font-medium text-slate-700 flex items-center gap-1.5">
                          <span>🌟</span> Leadership & Club Committees
                        </span>
                        <span className="font-bold text-indigo-700 bg-indigo-100/60 px-1.5 py-0.2 rounded text-[10.5px]">
                          Max 30 Pts
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submission Checklist */}
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-1">
                    <span className="font-bold text-[10.5px] flex items-center gap-1 text-emerald-900">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      Verification Criteria
                    </span>
                    <ul className="text-[10px] text-emerald-800 space-y-0.5 list-disc list-inside">
                      <li>Upload genuine certificate within 30 days of event.</li>
                      <li>Authorized institutional signature & seal mandatory.</li>
                      <li>Mentor approval awards provisional points on your ledger.</li>
                    </ul>
                  </div>

                  {/* Quick Action Button */}
                  <button
                    onClick={() => {
                      onNavigateHome?.();
                      setLinksDropdownOpen(false);
                      setTimeout(() => {
                        const el = document.getElementById('activity-meter-section') || document.getElementById('activity-center-section');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-[#8eb86e] hover:bg-[#7eb462] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>View My Activity Clearance Meter</span>
                  </button>
                </div>
              )}
            </div>

            {/* Rightmost Toggle Button (Matching LMS screenshot orange > button) */}
            <button
              onClick={onToggleRightDrawer}
              className="flex items-center justify-center w-8 h-8 rounded-md bg-[#ea580c] hover:bg-[#c2410c] text-white shadow-xs transition cursor-pointer ml-1 text-sm font-bold"
              title="Toggle Block Drawer"
              aria-label="Toggle Block Drawer"
            >
              {isRightDrawerOpen ? '✕' : '❯'}
            </button>
          </nav>
        </div>
      </div>

      {/* Slide-out Academic Messages Drawer (Real-Time Mentee &harr; Mentor Messaging) */}
      <AcademicMessagesDrawer
        isOpen={isMessagesDrawerOpen}
        onClose={() => setIsMessagesDrawerOpen(false)}
      />
      {/* Instant Demo Persona Switcher Modal */}
      <PersonaSwitcherModal
        isOpen={isPersonaSwitcherOpen}
        onClose={() => setIsPersonaSwitcherOpen(false)}
        currentUserId={user?.id}
      />
    </header>
  );
};
