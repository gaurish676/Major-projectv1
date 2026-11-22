import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from './Badge';
import { NotificationPopover } from './NotificationPopover';
import { SyncStatusBadge } from './SyncStatusBadge';
import { NitteLogo } from './NitteLogo';
import { PersonaSwitcherModal } from './PersonaSwitcherModal';
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

            {/* "Links" Dropdown (matching Screenshot 09-07-17.png) */}
            <div className="relative" ref={linksDropdownRef}>
              <button
                onClick={() => setLinksDropdownOpen((prev) => !prev)}
                className="px-2.5 py-1.5 rounded-md hover:text-[#8eb86e] hover:bg-slate-50 transition cursor-pointer flex items-center gap-1"
              >
                <span>Links</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {linksDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 z-50 py-2 max-h-[85vh] overflow-y-auto">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Institutional Services
                  </div>

                  {/* Highlighted Creditz Feature Entry */}
                  <button
                    onClick={() => {
                      onNavigateHome?.();
                      setLinksDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 bg-[#8eb86e]/10 hover:bg-[#8eb86e]/20 text-[#436b28] font-bold flex items-center justify-between transition cursor-pointer border-l-3 border-[#8eb86e]"
                  >
                    <span className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#8eb86e]" />
                      <span>Creditz (Activity Points)</span>
                    </span>
                    <span className="text-[10px] bg-[#8eb86e] text-white px-1.5 py-0.5 rounded font-bold">
                      Active
                    </span>
                  </button>

                  <a
                    href="https://mail.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 transition"
                  >
                    <span>Email</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  <button
                    onClick={() => {
                      if (user?.role === 'mentor' || user?.role === 'hod') onNavigateTab?.('mentor-placement');
                      else if (user?.role === 'dean') onNavigateTab?.('dean-dashboard');
                      else onNavigateTab?.('student-events');
                      setLinksDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                  >
                    Placement
                  </button>

                  <a
                    href="https://nmamit.nitte.edu.in"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 transition"
                  >
                    <span>HR Office</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  <button
                    onClick={() => {
                      onNavigateTab?.('student-events');
                      setLinksDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                  >
                    Event Management System
                  </button>

                  <a
                    href="https://nmamit.nitte.edu.in/library.php"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 transition"
                  >
                    <span>KOHA-Central Library</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  <div className="my-1.5 border-t border-slate-100" />
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Academic Software & Video
                  </div>

                  <a
                    href="https://nptel.ac.in"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 hover:bg-slate-50 flex items-center justify-between text-slate-700 transition text-xs"
                  >
                    <span>NPTEL</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  <a
                    href="https://nmamit.nitte.edu.in"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 hover:bg-slate-50 flex items-center justify-between text-slate-700 transition text-xs"
                  >
                    <span>GATE Lecture Videos & Study Materials</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  <a
                    href="https://nmamit.nitte.edu.in"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 hover:bg-slate-50 flex items-center justify-between text-slate-700 transition text-xs"
                  >
                    <span>Linux & Windows Software</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
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

      {/* Slide-out Academic Messages Drawer (matching Screenshot 09-07-43.png) */}
      {isMessagesDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
            onClick={() => setIsMessagesDrawerOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl z-10 flex flex-col">
            <div className="p-3.5 bg-[#8eb86e] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span className="font-bold text-sm">Academic Messages</span>
              </div>
              <button
                onClick={() => setIsMessagesDrawerOpen(false)}
                className="p-1 rounded-md hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 flex-1 overflow-y-auto space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                <div className="font-bold text-orange-900">Faculty Mentor Counseling</div>
                <p className="text-orange-800 text-[11px] mt-0.5">
                  Ensure all Semester 6 certificates are uploaded before Mid-Semester exam evaluations.
                </p>
                <span className="text-[10px] text-orange-600 block mt-1">Today, 09:30 AM</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-800">Department Notice</div>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Hackathon activity points cap is 60 points. Verify your project submission certificates.
                </p>
                <span className="text-[10px] text-slate-400 block mt-1">Yesterday</span>
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 text-center">
              <button
                onClick={() => {
                  onNavigateTab?.('student-events');
                  setIsMessagesDrawerOpen(false);
                }}
                className="text-xs font-semibold text-[#5c873f] hover:underline cursor-pointer"
              >
                View all department announcements
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Instant Demo Persona Switcher Modal */}
      <PersonaSwitcherModal
        isOpen={isPersonaSwitcherOpen}
        onClose={() => setIsPersonaSwitcherOpen(false)}
        currentUserId={user?.id}
      />
    </header>
  );
};
