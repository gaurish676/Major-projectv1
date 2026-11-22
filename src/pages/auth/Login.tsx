import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { NitteLogo } from '../../components/common/NitteLogo';
import { LMSFooter } from '../../components/common/LMSFooter';
import { PersonaSwitcherModal } from '../../components/common/PersonaSwitcherModal';
import {
  Shield,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserCheck,
  ChevronDown,
  UserPlus,
  User as UserIcon,
  Hash,
  Sparkles,
  Info,
  GraduationCap,
  Briefcase,
  Users,
} from 'lucide-react';

export const Login: React.FC = () => {
  const { login, register, switchPersona, personas } = useAuth();

  // Mode: 'login' or 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedMentorId, setSelectedMentorId] = useState<string>('');

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRole, setRegRole] = useState<'student' | 'mentor' | 'hod'>('student');
  const [regRollNo, setRegRollNo] = useState('');
  const [regSemester, setRegSemester] = useState<number>(6);

  // Common UI State
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState<string | null>(null);
  const [showCookieNotice, setShowCookieNotice] = useState(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [studentSearchInput, setStudentSearchInput] = useState('');

  // Dynamic persona lookups
  const primaryStudent = personas.find((p) => p.role === 'student');
  const primaryMentor = personas.find((p) => p.role === 'mentor');
  const primaryHod = personas.find((p) => p.role === 'hod');
  const primaryDean = personas.find((p) => p.role === 'dean');
  const studentList = useMemo(() => personas.filter((p) => p.role === 'student'), [personas]);
  const mentorList = useMemo(() => personas.filter((p) => p.role === 'mentor'), [personas]);

  const filteredStudents = useMemo(() => {
    return studentList
      .filter((s) => {
        if (!studentSearchInput.trim()) return true;
        const q = studentSearchInput.toLowerCase().trim();
        return s.name.toLowerCase().includes(q) || (s.roll_no && s.roll_no.toLowerCase().includes(q));
      })
      .slice(0, 60);
  }, [studentList, studentSearchInput]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginEmail.trim()) {
      setError('Please enter your institutional email or username');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(loginEmail.trim(), loginPassword || 'password123');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials or user not found. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!regEmail.trim()) {
      setError('Please enter your institutional email');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword.trim() || 'password123',
        role: regRole,
        roll_no: regRole === 'student' ? (regRollNo.trim() || undefined) : undefined,
        semester: regRole === 'student' ? Number(regSemester) : undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (role: 'student' | 'mentor' | 'hod' | 'dean') => {
    setError(null);
    setActiveDemoRole(role);
    setIsSubmitting(true);

    try {
      const targetPersona = personas.find((p) => p.role === role);
      if (targetPersona) {
        await switchPersona(targetPersona.id);
        return;
      }

      const fallbackEmails = {
        student: 'rahul@university.edu',
        mentor: 'ravi@university.edu',
        hod: 'hod@university.edu',
        dean: 'dean@university.edu',
      };
      await login(fallbackEmails[role], 'password123');
    } catch (err: any) {
      console.error('Demo login error:', err);
      try {
        const aliasEmails = {
          student: 'rahul.cse@nitte.edu.in',
          mentor: 'dr.ramesh@nitte.edu.in',
          hod: 'hod.cse@nitte.edu.in',
          dean: 'pawan@university.edu',
        };
        await login(aliasEmails[role], 'password123');
      } catch (secondErr: any) {
        setError(secondErr.message || `Failed to sign in as ${role}. Please try again.`);
      }
    } finally {
      setIsSubmitting(false);
      setActiveDemoRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans select-none overflow-x-hidden">
      {/* Tier 1 Header: Sage Green Strip (#8eb86e) */}
      <div className="bg-[#8eb86e] text-white text-xs px-4 sm:px-8 h-9 flex items-center justify-between">
        <span className="font-semibold tracking-wide hidden sm:inline">
          NMAM Institute of Technology Learning Management System
        </span>
        <div className="flex items-center gap-4 ml-auto text-xs font-semibold">
          <button
            onClick={() => setAuthMode('login')}
            className="hover:underline text-white cursor-pointer"
          >
            Log in
          </button>
        </div>
      </div>

      {/* Tier 2 Header: White Navbar with NITTE Logo and LMS Links */}
      <div className="bg-white border-b border-slate-200">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <NitteLogo size="md" />

          <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm font-medium text-slate-700">
            <span className="hover:text-[#8eb86e] cursor-pointer">Home</span>
            <span className="hover:text-[#8eb86e] cursor-pointer hidden sm:inline">Links</span>
            <span className="hover:text-[#8eb86e] cursor-pointer hidden sm:inline">MATLAB</span>
          </div>
        </div>
      </div>

      {/* Hero Canvas matching Screenshot 09-05-55.png (#29aae1 Sky Blue) */}
      <div className="flex-1 bg-[#29aae1] py-12 px-4 sm:px-6 flex items-center justify-center relative overflow-hidden">
        {/* Subtle geometric background overlay */}
        <div className="absolute inset-0 bg-radial from-white/10 to-transparent pointer-events-none" />

        {/* Center Auth Card */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 z-10 space-y-5 border border-white/60">
          {/* Top Emblem in Card */}
          <div className="flex flex-col items-center justify-center pb-2 border-b border-slate-100">
            <NitteLogo size="md" className="justify-center" />
            <div className="mt-2 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Institutional Academic & Activity Portal
              </span>
            </div>
          </div>

          {/* Mode Switcher Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                authMode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              New Registration
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {authMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username / Institutional Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Username"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#8eb86e] focus:border-transparent transition bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#8eb86e] focus:border-transparent transition bg-slate-50/50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Green Log In Button matching Screenshot 09-05-55.png */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-lg bg-[#7eb462] hover:bg-[#6fa454] active:bg-[#5c873f] text-white font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Authenticating...' : 'Log in'}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <a
                  href="#lost-password"
                  onClick={(e) => {
                    e.preventDefault();
                    setError('To reset your password, contact NMAMIT IT Center or use 1-click test logins below.');
                  }}
                  className="text-[#5c873f] hover:underline font-medium"
                >
                  Lost password?
                </a>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                {/* Orange Cookies Notice Button matching screenshot */}
                <button
                  type="button"
                  onClick={() => setShowCookieNotice(!showCookieNotice)}
                  className="px-3 py-1.5 rounded-md bg-[#ff6f00] hover:bg-[#e66300] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  Cookies notice
                </button>

                <span className="text-[11px] text-slate-400">
                  LMS Creditz v4.0
                </span>
              </div>

              {showCookieNotice && (
                <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-950 text-[11px] leading-relaxed">
                  This site uses session cookies compliant with institutional privacy standards to authenticate your activity points records.
                </div>
              )}

              {/* 1-Click Fast Role Sign-In Helpers */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Instant Demo Credentials</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPersonaModalOpen(true)}
                    className="text-[11px] font-bold text-[#5c873f] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Browse All ({personas.length})</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* 4 Primary Demo Roles */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('student')}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-left transition font-semibold flex items-center justify-between cursor-pointer"
                  >
                    <span>Student (Rahul)</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('mentor')}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-left transition font-semibold flex items-center justify-between cursor-pointer"
                  >
                    <span>Mentor (Prof. Ravi)</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('hod')}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-left transition font-semibold flex items-center justify-between cursor-pointer"
                  >
                    <span>HOD (Dr. Sannidhan)</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('dean')}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-left transition font-semibold flex items-center justify-between cursor-pointer"
                  >
                    <span>Dean (Dr. Pawan Kumar)</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                </div>

                {/* Choose Any Faculty Lecturer / Mentor Dropdown */}
                <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-purple-900 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                      <span>Choose Any Lecturer / Mentor ({mentorList.length} Available)</span>
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={selectedMentorId}
                      onChange={(e) => setSelectedMentorId(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-purple-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer truncate"
                    >
                      <option value="">-- Select Lecturer / Mentor --</option>
                      {mentorList.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.roll_no ? `(${m.roll_no})` : ''}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={!selectedMentorId || isSubmitting}
                      onClick={() => selectedMentorId && switchPersona(selectedMentorId)}
                      className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition disabled:opacity-40 cursor-pointer shrink-0"
                    >
                      Sign In
                    </button>
                  </div>
                </div>

                {/* Choose Any Student with Filter */}
                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-blue-900 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                      <span>Choose Any Student ({studentList.length} Available)</span>
                    </span>
                  </div>

                  <input
                    type="text"
                    placeholder="Filter by USN or Name (e.g. NNM23CS, Ananya, Sharan)..."
                    value={studentSearchInput}
                    onChange={(e) => setStudentSearchInput(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-blue-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />

                  <div className="flex gap-2">
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-blue-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer truncate"
                    >
                      <option value="">-- Select Student --</option>
                      {filteredStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.roll_no ? `${s.roll_no} - ` : ''}{s.name} (Sem {s.semester || 6})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={!selectedStudentId || isSubmitting}
                      onClick={() => selectedStudentId && switchPersona(selectedStudentId)}
                      className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition disabled:opacity-40 cursor-pointer shrink-0"
                    >
                      Sign In
                    </button>
                  </div>
                </div>

                {/* Full Persona Directory Modal Trigger */}
                <button
                  type="button"
                  onClick={() => setIsPersonaModalOpen(true)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
                >
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>Search All 440+ Personas Directory</span>
                </button>
              </div>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#8eb86e] transition bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institutional Email
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name.dept@nitte.edu.in"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#8eb86e] transition bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#8eb86e] transition bg-slate-50/50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#8eb86e] bg-white cursor-pointer"
                  >
                    <option value="student">Student</option>
                    <option value="mentor">Faculty Mentor</option>
                    <option value="hod">Head of Dept</option>
                  </select>
                </div>

                {regRole === 'student' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Semester
                    </label>
                    <select
                      value={regSemester}
                      onChange={(e) => setRegSemester(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#8eb86e] bg-white cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {regRole === 'student' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    University Roll No / USN
                  </label>
                  <input
                    type="text"
                    value={regRollNo}
                    onChange={(e) => setRegRollNo(e.target.value)}
                    placeholder="e.g. 4NM22CS089"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#8eb86e] transition bg-slate-50/50"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-lg bg-[#7eb462] hover:bg-[#6fa454] text-white font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Persona Switcher Modal for All 440+ Personas */}
      <PersonaSwitcherModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
      />

      {/* Official LMS Footer at Bottom */}
      <LMSFooter />
    </div>
  );
};
