import React, { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  LayoutDashboard,
  FileCheck2,
  BookOpen,
  Calendar,
  Users,
  Users2,
  ShieldAlert,
  GitPullRequest,
  Sliders,
  Award,
  BarChart3,
  FileSpreadsheet,
  PlusCircle,
  Sparkles,
  ChevronRight,
  User as UserIcon,
  Pencil,
  Camera,
  X,
  LogOut,
  ShieldCheck,
  GraduationCap,
  Loader2,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSubmitModal?: () => void;
  onOpenSchemaRequestModal?: () => void;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenSubmitModal,
  onOpenSchemaRequestModal,
  onClose,
}) => {
  const { user, logout, updateAvatar } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoNotification, setPhotoNotification] = useState<string | null>(null);

  if (!user) return null;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoNotification('Please select a valid image file (JPG, PNG, WEBP, etc.)');
      setTimeout(() => setPhotoNotification(null), 3500);
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoNotification(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        await updateAvatar(base64Data);
        setPhotoNotification('Profile photo updated successfully!');
        setTimeout(() => setPhotoNotification(null), 3000);
      } catch (err: any) {
        setPhotoNotification('Failed to update photo. Please try again.');
        setTimeout(() => setPhotoNotification(null), 3500);
      } finally {
        setIsUploadingPhoto(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      setIsUploadingPhoto(false);
      setPhotoNotification('Error reading selected image.');
      setTimeout(() => setPhotoNotification(null), 3500);
    };

    reader.readAsDataURL(file);
  };

  const renderStudentNav = () => (
    <div className="space-y-1">
      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Navigation Options
      </div>

      {/* 1. Home Dashboard */}
      <button
        onClick={() => onSelectTab('student-dashboard')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'student-dashboard' || activeTab === 'home'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Home className="w-4 h-4" />
          <span>Home</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* 2. Profile */}
      <button
        onClick={() => onSelectTab('profile')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'profile'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <UserIcon className="w-4 h-4" />
          <span>Profile</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* 3. Update Marks */}
      <button
        onClick={() => onSelectTab('student-marks')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'student-marks'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Update Marks</span>
        </div>
        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
          SGPA
        </span>
      </button>

      {/* 4. Upcoming Events */}
      <button
        onClick={() => onSelectTab('student-events')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'student-events'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-indigo-500" />
          <span>Upcoming Events</span>
        </div>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
        </span>
      </button>

      {/* 5. College Clubs & Chapters */}
      <button
        onClick={() => onSelectTab('student-clubs')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'student-clubs'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Users2 className="w-4 h-4 text-indigo-500" />
          <span>College Clubs</span>
        </div>
        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
          Clubs
        </span>
      </button>

      {/* 6. Submissions */}
      <button
        onClick={() => onSelectTab('student-submissions')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'student-submissions'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <FileCheck2 className="w-4 h-4" />
          <span>Submission</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* 7. Marking Schema */}
      <button
        onClick={() => onSelectTab('student-schema')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'student-schema'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4" />
          <span>Marking Schema</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* Quick Action Button */}
      {onOpenSubmitModal && (
        <div className="pt-3 px-1">
          <button
            onClick={onOpenSubmitModal}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Certificate</span>
          </button>
        </div>
      )}
    </div>
  );

  const renderMentorNav = () => (
    <div className="space-y-1">
      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Faculty Options
      </div>

      {/* 1. Home Dashboard */}
      <button
        onClick={() => onSelectTab('mentor-dashboard')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'mentor-dashboard' || activeTab === 'home'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Home className="w-4 h-4" />
          <span>Home</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* 2. Profile */}
      <button
        onClick={() => onSelectTab('profile')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'profile'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <UserIcon className="w-4 h-4" />
          <span>Profile</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* 3. Submission Review */}
      <button
        onClick={() => onSelectTab('mentor-reviews')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'mentor-reviews' || activeTab === 'mentor-evaluations'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <FileCheck2 className="w-4 h-4" />
          <span>Submission Review</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* 4. Student Marks (Sem-wise) */}
      <button
        onClick={() => onSelectTab('mentor-marks')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'mentor-marks'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Student Marks</span>
        </div>
        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
          Sem-wise
        </span>
      </button>

      {/* 5. Assigned Mentees */}
      <button
        onClick={() => onSelectTab('mentor-mentees')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'mentor-mentees'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Users className="w-4 h-4" />
          <span>Assigned Mentees</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* 6. Marking Schema */}
      <button
        onClick={() => onSelectTab('student-schema')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'student-schema' || activeTab === 'mentor-schema'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4" />
          <span>Marking Schema</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* 7. Events & Activities */}
      <button
        onClick={() => onSelectTab('student-events')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'student-events'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4" />
          <span>Events & Activities</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* Schema Change Request Button */}
      {onOpenSchemaRequestModal && (
        <div className="pt-2 px-1">
          <button
            onClick={onOpenSchemaRequestModal}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer"
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>Request Schema Change</span>
          </button>
        </div>
      )}
    </div>
  );

  const renderHODNav = () => (
    <div className="space-y-1">
      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        HOD Executive Options
      </div>

      {/* 1. Home Dashboard */}
      <button
        onClick={() => onSelectTab('hod-dashboard')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'hod-dashboard' || activeTab === 'home'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Home className="w-4 h-4" />
          <span>Home</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* 2. Profile */}
      <button
        onClick={() => onSelectTab('profile')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'profile'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <UserIcon className="w-4 h-4" />
          <span>Profile</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* 3. Submission & Queue */}
      <button
        onClick={() => onSelectTab('hod-requests')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'hod-requests'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <FileCheck2 className="w-4 h-4" />
          <span>Submission Approvals</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* 4. Marking Schema Manager */}
      <button
        onClick={() => onSelectTab('hod-schemas')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'hod-schemas' || activeTab === 'hod-schema'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Sliders className="w-4 h-4" />
          <span>Marking Schema</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* 5. Events & Activities */}
      <button
        onClick={() => onSelectTab('student-events')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'student-events'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4" />
          <span>Events & Activities</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* 6. Mentor Allocation and Report */}
      <button
        onClick={() => onSelectTab('hod-allocation')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'hod-allocation' || activeTab === 'hod-allocations' || activeTab === 'hod-reports'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Users className="w-4 h-4" />
          <span>Mentee Allocation & Report</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>
    </div>
  );

  return (
    <aside className="w-56 sm:w-60 lg:w-60 shrink-0 bg-white border-r border-slate-200/90 p-3 sm:p-3.5 min-h-screen flex flex-col justify-between shadow-lg lg:shadow-none">
      <div className="space-y-3">
        {/* Top Header Row with Close Button (if drawer is open) */}
        <div className="flex items-center justify-between pb-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Account & Menu
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Hidden File Input for Profile Photo */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
          aria-label="Upload Profile Photo"
        />

        {/* Profile Photo and User Info without bulky outer rectangular border */}
        <div className="py-1 text-center relative group">
          {/* Notification toast if any */}
          {photoNotification && (
            <div className="mb-2 p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-[10px] font-semibold animate-fade-in">
              {photoNotification}
            </div>
          )}

          {/* Compact avatar container */}
          <div className="relative inline-block mx-auto mb-2">
            <div
              onClick={handleAvatarClick}
              className="relative rounded-2xl overflow-hidden cursor-pointer group/avatar ring-2 ring-slate-100 shadow-sm mx-auto"
              title="Click to select image file from your device"
            >
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                alt={user.name}
                className={`w-14 h-14 sm:w-16 sm:h-16 object-cover bg-slate-200 transition duration-200 group-hover/avatar:scale-105 ${
                  isUploadingPhoto ? 'opacity-40 blur-[1px]' : ''
                }`}
              />
              
              {/* Hover overlay with Camera icon */}
              <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-1">
                <Camera className="w-4 h-4 drop-shadow-sm mb-0.5" />
                <span className="text-[8px] font-bold uppercase tracking-wider">Change</span>
              </div>

              {/* Uploading Spinner */}
              {isUploadingPhoto && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 text-white">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                </div>
              )}
            </div>

            {/* Small Edit Icon button placed on the corner of profile photo */}
            <button
              type="button"
              onClick={handleAvatarClick}
              title="Select image from files"
              className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm ring-2 ring-white transition cursor-pointer hover:scale-110 active:scale-95"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>

          {/* User Details */}
          <div className="space-y-0.5 min-w-0">
            <h3
              onClick={() => onSelectTab('profile')}
              className="text-xs sm:text-sm font-bold text-slate-900 truncate hover:text-indigo-600 transition cursor-pointer"
              title={user.name}
            >
              {user.name}
            </h3>
            <p className="text-[10px] text-slate-500 font-medium truncate">
              {user.role === 'hod'
                ? 'Head of Department'
                : user.role === 'mentor'
                ? 'Faculty Mentor'
                : user.roll_no ? `USN: ${user.roll_no}` : 'Student'}
            </p>
            <div className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-slate-50 border border-slate-200 text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{user.department_code || 'CSE'} • {user.role.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* List of Navigation Options */}
        <div className="pt-0.5">
          {user.role === 'student' && renderStudentNav()}
          {user.role === 'mentor' && renderMentorNav()}
          {user.role === 'hod' && renderHODNav()}
          {user.role === 'developer' && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Developer Portal
              </div>
              <button
                onClick={() => onSelectTab('dev-console')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'dev-console'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Graph & Dev Console</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info & Sign Out */}
      <div className="pt-3 border-t border-slate-100 space-y-2 mt-3">
        <div className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200/80">
          <div className="flex items-center gap-1">
            <Award className="w-3 h-3 text-indigo-600" />
            <span className="font-medium">AICTE Target</span>
          </div>
          <span className="font-bold font-mono text-slate-800">200 Pts</span>
        </div>

        {/* Developer Console Button (Only visible if active user role is developer) */}
        {user.role === 'developer' && (
          <button
            onClick={() => onSelectTab('dev-console')}
            className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'dev-console'
                ? 'bg-slate-900 text-indigo-300 ring-2 ring-indigo-500 shadow-sm'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>Developer Console</span>
          </button>
        )}

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
