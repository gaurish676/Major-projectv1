import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from './Badge';
import {
  GraduationCap,
  ChevronDown,
  LogOut,
  Bell,
  CheckCircle,
  Clock,
  Menu,
  User as UserIcon,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onNavigateProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onNavigateProfile }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-sm">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-14 flex items-center justify-between">
        {/* Left: Clearly Visible 3-Lines (Hamburger) Button + Brand */}
        <div className="flex items-center gap-3">
          {/* Top-Left: Clearly visible 3-lines Menu Button */}
          <button
            onClick={onToggleSidebar}
            className="flex items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/80 shadow-xs transition cursor-pointer group shrink-0 min-h-[40px] min-w-[40px]"
            title="Open Menu & Profile Sidebar"
            aria-label="Open Navigation & Profile Menu"
          >
            {/* 3 crisp, clearly visible horizontal lines */}
            <div className="flex flex-col justify-center items-center gap-1 w-5 h-4.5">
              <span className="w-5 h-0.5 bg-white rounded-full transition-all group-hover:bg-indigo-400 group-hover:w-5.5" />
              <span className="w-5 h-0.5 bg-white rounded-full transition-all group-hover:bg-indigo-400 group-hover:w-5.5" />
              <span className="w-5 h-0.5 bg-white rounded-full transition-all group-hover:bg-indigo-400 group-hover:w-5.5" />
            </div>
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-600/30">
              <GraduationCap className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 leading-none">
                <span className="font-bold text-white tracking-tight text-sm sm:text-base truncate">
                  Creditz
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                  200-PT
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate mt-0.5">
                Department of Computer Science & Engineering
              </p>
            </div>
          </div>
        </div>

        {/* Right: Active Role & User Controls (without duplicate profile photo) */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {user && (
            <>
              {/* Notification Center */}
              <div className="relative">
                <button
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition relative cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-slate-900" />
                </button>

                {notificationOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 z-50 p-3 space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">System Alerts</span>
                      <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">CSE Academic</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-indigo-950 text-xs">Official Schema v1.0 Active</div>
                          <div className="text-[11px] text-indigo-800 mt-0.5">200 Activity Points graduation requirement in effect.</div>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-100 flex items-start gap-2.5">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-amber-950 text-xs">Certificate Verification Window</div>
                          <div className="text-[11px] text-amber-800 mt-0.5">Faculty mentors are reviewing pending submissions.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Identity Pill & Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 transition cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-md bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-semibold text-white truncate max-w-[130px] leading-tight">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize font-medium leading-none mt-0.5">
                      {user.role === 'hod' ? 'Head of Department' : user.role === 'mentor' ? 'Faculty Mentor' : 'Student'}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 z-50 p-2 space-y-2">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {user.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-bold text-xs text-slate-900 truncate">{user.name}</div>
                          <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/60">
                        <span className="text-slate-500 font-medium">Role</span>
                        <RoleBadge role={user.role} />
                      </div>
                      {user.roll_no && (
                        <div className="mt-1 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Roll No</span>
                          <span className="font-mono font-bold text-slate-700">{user.roll_no}</span>
                        </div>
                      )}
                      {user.semester && (
                        <div className="mt-1 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Semester</span>
                          <span className="font-semibold text-slate-700">Sem {user.semester}</span>
                        </div>
                      )}
                    </div>

                    {onNavigateProfile && (
                      <button
                        onClick={() => {
                          onNavigateProfile();
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 transition font-semibold cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4" />
                        <span>View & Edit Profile</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition font-semibold cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Direct Sign Out Button */}
              <button
                onClick={logout}
                title="Sign Out"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                <span>Sign Out</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
