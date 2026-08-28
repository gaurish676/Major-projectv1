import React, { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileCheck2,
  BookOpen,
  Calendar,
  Users,
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

      {/* 1. Profile */}
      <button
        onClick={() => onSelectTab('profile')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'profile'
            ? 'bg-blue-700 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <UserIcon className="w-4 h-4" />
          <span>Profile</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* 2. Dashboard Overview */}
      <button
        onClick={() => onSelectTab('student-dashboard')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'student-dashboard'
            ? 'bg-blue-700 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <LayoutDashboard className="w-4 h-4" />
          <span>200-Pt Dashboard</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* 3. Update Marks */}
      <button
        onClick={() => onSelectTab('student-marks')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'student-marks'
            ? 'bg-blue-700 text-white shadow-xs'
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
            ? 'bg-blue-700 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-sky-600" />
          <span>Upcoming Events</span>
        </div>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
        </span>
      </button>

      {/* 5. Submissions */}
      <button
        onClick={() => onSelectTab('student-submissions')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'student-submissions'
            ? 'bg-blue-700 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <FileCheck2 className="w-4 h-4" />
          <span>Submission</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* 6. Marking Schema */}
      <button
        onClick={() => onSelectTab('student-schema')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'student-schema'
            ? 'bg-blue-700 text-white shadow-xs'
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
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
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

      {/* 1. Profile */}
      <button
        onClick={() => onSelectTab('profile')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'profile'
            ? 'bg-purple-600 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <UserIcon className="w-4 h-4" />
          <span>Profile</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* 2. Submission Review */}
      <button
        onClick={() => onSelectTab('mentor-reviews')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'mentor-reviews' || activeTab === 'mentor-evaluations'
            ? 'bg-purple-600 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <FileCheck2 className="w-4 h-4" />
          <span>Submission Review</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* 3. Student Marks (Sem-wise) */}
      <button
        onClick={() => onSelectTab('mentor-marks')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'mentor-marks'
            ? 'bg-purple-600 text-white shadow-xs'
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

      {/* 4. Marking Schema */}
      <button
        onClick={() => onSelectTab('student-schema')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'student-schema'
            ? 'bg-purple-600 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4" />
          <span>Marking Schema</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* 5. Events & Activities */}
      <button
        onClick={() => onSelectTab('student-events')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'student-events'
            ? 'bg-purple-600 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4" />
          <span>Events & Activities</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* Mentor Dashboard Overview */}
      <button
        onClick={() => onSelectTab('mentor-dashboard')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'mentor-dashboard'
            ? 'bg-purple-600 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <LayoutDashboard className="w-4 h-4" />
          <span>Mentorship Overview</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* Mentees */}
      <button
        onClick={() => onSelectTab('mentor-mentees')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'mentor-mentees'
            ? 'bg-purple-600 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Users className="w-4 h-4" />
          <span>Assigned Mentees</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* Schema Change Request Button */}
      {onOpenSchemaRequestModal && (
        <div className="pt-2 px-1">
          <button
            onClick={onOpenSchemaRequestModal}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition cursor-pointer"
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

      {/* 1. Profile */}
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

      {/* 2. Submission & Queue */}
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

      {/* 3. Marking Schema Manager */}
      <button
        onClick={() => onSelectTab('hod-schemas')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'hod-schemas'
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

      {/* 4. Events & Activities */}
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

      {/* HOD Analytics Dashboard */}
      <button
        onClick={() => onSelectTab('hod-dashboard')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === 'hod-dashboard'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <BarChart3 className="w-4 h-4" />
          <span>Department Dashboard</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* Mentor Allocation and Report */}
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
          <span>Mentee Allocation and Report</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>
    </div>
  );

  return (
    <aside className="w-64 sm:w-72 shrink-0 bg-white border-r border-slate-200/90 p-4 min-h-screen flex flex-col justify-between shadow-lg lg:shadow-none">
      <div className="space-y-4">
        {/* Top Header Row with Close Button (if drawer is open) */}
        <div className="flex items-center justify-between pb-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Account & Menu
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
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

        {/* Medium-sized Profile Photo with Small Edit Icon */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/80 border border-slate-200/90 shadow-2xs text-center relative group">
          {/* Notification toast if any */}
          {photoNotification && (
            <div className="mb-2 p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-[10px] font-semibold animate-fade-in">
              {photoNotification}
            </div>
          )}

          {/* Medium size avatar container */}
          <div className="relative inline-block mx-auto mb-2.5">
            <div
              onClick={handleAvatarClick}
              className="relative rounded-2xl overflow-hidden cursor-pointer group/avatar ring-3 ring-white shadow-md mx-auto"
              title="Click to select image file from your device"
            >
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                alt={user.name}
                className={`w-18 h-18 sm:w-20 sm:h-20 object-cover bg-slate-200 transition duration-200 group-hover/avatar:scale-105 ${
                  isUploadingPhoto ? 'opacity-40 blur-[1px]' : ''
                }`}
              />
              
              {/* Hover overlay with Camera icon */}
              <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-1">
                <Camera className="w-5 h-5 drop-shadow-sm mb-0.5" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Change</span>
              </div>

              {/* Uploading Spinner */}
              {isUploadingPhoto && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 text-white">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                </div>
              )}
            </div>

            {/* Small Edit Icon button placed on the corner of the medium profile photo */}
            <button
              type="button"
              onClick={handleAvatarClick}
              title="Select image from files"
              className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md ring-2 ring-white transition cursor-pointer hover:scale-110 active:scale-95"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* User Details */}
          <div className="space-y-1 min-w-0">
            <h3
              onClick={() => onSelectTab('profile')}
              className="text-sm font-bold text-slate-900 truncate hover:text-indigo-600 transition cursor-pointer"
              title={user.name}
            >
              {user.name}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              {user.role === 'hod'
                ? 'Head of Department'
                : user.role === 'mentor'
                ? 'Faculty Mentor'
                : user.roll_no ? `USN: ${user.roll_no}` : 'Student'}
            </p>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{user.department_code || 'CSE'} • {user.role.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* List of Navigation Options */}
        <div className="pt-1">
          {user.role === 'student' && renderStudentNav()}
          {user.role === 'mentor' && renderMentorNav()}
          {user.role === 'hod' && renderHODNav()}
        </div>
      </div>

      {/* Footer Info & Sign Out */}
      <div className="pt-4 border-t border-slate-100 space-y-3 mt-4">
        <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-medium">AICTE Schema</span>
          </div>
          <span className="font-bold font-mono text-slate-800">200 Pts Target</span>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
