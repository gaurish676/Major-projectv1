import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Shield,
  ArrowRight,
  Lock,
  Mail,
  Sparkles,
  Eye,
  EyeOff,
  UserCheck,
  ChevronDown,
  UserPlus,
  User as UserIcon,
  Hash,
  BookOpen,
  Terminal,
} from 'lucide-react';
import { DEV_CONFIG } from '../../config/devConfig';

const defaultFallbackStudents = [
  { id: 'usr_std_1', name: 'Rahul Verma', roll_no: '4NN22CS089', semester: 6, cgpa: 8.45, email: 'rahul@university.edu' },
  { id: 'usr_std_2', name: 'Priya Patel', roll_no: '4NN23CS104', semester: 4, cgpa: 9.10, email: 'priya@university.edu' },
  { id: 'usr_std_3', name: 'Rohan Gupta', roll_no: '4NN22CS112', semester: 6, cgpa: 7.60, email: 'rohan@university.edu' },
  { id: 'usr_std_4', name: 'Neha Singh', roll_no: '4NN21CS045', semester: 8, cgpa: 8.85, email: 'neha@university.edu' },
  { id: 'usr_std_5', name: 'Amit Kumar', roll_no: '4NN21CS018', semester: 8, cgpa: 9.40, email: 'amit@university.edu' },
  { id: 'usr_std_6', name: 'Sneha Nair', roll_no: '4NN22CS140', semester: 6, cgpa: 8.20, email: 'sneha@university.edu' },
  { id: 'usr_std_7', name: 'Vikram Rao', roll_no: '4NN23CS155', semester: 4, cgpa: 7.90, email: 'vikram@university.edu' },
  { id: 'usr_std_8', name: 'Ananya Joshi', roll_no: '4NN24CS012', semester: 2, cgpa: 8.65, email: 'ananya@university.edu' },
];

export const Login: React.FC = () => {
  const { login, register, switchPersona, personas } = useAuth();

  // Mode: 'login' or 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

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

  // Student list from personas or fallback
  const fetchedStudents = personas.filter((p) => p.role === 'student');
  const studentList = fetchedStudents.length > 0 ? fetchedStudents : defaultFallbackStudents;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginEmail.trim()) {
      setError('Please enter your registered institutional email');
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

  const handleQuickDemoLogin = async (role: 'student' | 'mentor' | 'hod') => {
    setError(null);
    setActiveDemoRole(role);
    setIsSubmitting(true);

    try {
      // 1. Try to find from fetched personas first
      const targetPersona = personas.find((p) => p.role === role);
      if (targetPersona) {
        await switchPersona(targetPersona.id);
        return;
      }

      // 2. Direct email fallback based on seeded database
      const fallbackEmails = {
        student: 'rahul@university.edu',
        mentor: 'ravi@university.edu',
        hod: 'hod@university.edu',
      };
      await login(fallbackEmails[role], 'password123');
    } catch (err: any) {
      console.error('Demo login error:', err);
      // Try secondary fallback
      try {
        const aliasEmails = {
          student: 'rahul.cse@nitte.edu.in',
          mentor: 'dr.ramesh@nitte.edu.in',
          hod: 'hod.cse@nitte.edu.in',
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

  const handleStudentSelectLogin = async (studentId: string) => {
    if (!studentId) return;
    setSelectedStudentId(studentId);
    setError(null);
    setIsSubmitting(true);
    setActiveDemoRole('student');

    try {
      await switchPersona(studentId);
    } catch (err: any) {
      console.error('Student switch persona error:', err);
      const student = studentList.find((s) => s.id === studentId);
      if (student?.email) {
        try {
          await login(student.email, 'password123');
        } catch (secondErr: any) {
          setError(secondErr.message || `Failed to sign in as ${student.name}. Please try again.`);
        }
      } else {
        setError(err.message || 'Failed to sign in as student. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
      setActiveDemoRole(null);
    }
  };

  const handleDevAccess = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await switchPersona('usr_dev');
    } catch (err: any) {
      console.warn('Developer switch persona fallback to login:', err);
      try {
        await login('dev@university.edu', 'demo123');
      } catch (loginErr: any) {
        console.error('Developer login failed:', loginErr);
        setError(loginErr.message || 'Developer portal access failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B132B] flex flex-col justify-between text-slate-100 p-4 sm:p-6 lg:p-8 relative">
      {/* Background Subtle Gradient Accents */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between py-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white tracking-tight text-base sm:text-lg flex items-center gap-1.5 leading-none">
              <span>Creditz</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Department of Computer Science & Engineering
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-800 text-[11px] text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>200 Activity Points Central System</span>
        </div>
      </div>

      {/* Center Auth Card */}
      <div className="max-w-md mx-auto w-full my-auto py-8">
        <div className="bg-[#111C44]/90 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-blue-900/40 shadow-2xl space-y-5">
          
          {/* Header */}
          <div className="text-center space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {authMode === 'login' ? 'Sign In' : 'Create an Account'}
            </h1>
            <p className="text-xs text-slate-400">
              {authMode === 'login'
                ? 'Enter your institutional credentials to access Creditz'
                : 'Join the Creditz academic & activity tracking portal'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {authMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Institutional Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    placeholder="e.g. rahul.cse@nitte.edu.in"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#070D1E] border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  <span className="text-[10px] text-slate-500">Default: password123</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-[#070D1E] border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Bottom Right: Don't have an account? Register here */}
              <div className="flex items-center justify-end text-xs text-slate-400 pt-1">
                <span>Don't have an account?</span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setError(null);
                  }}
                  className="ml-1.5 font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer transition"
                >
                  Register here
                </button>
              </div>

              {/* Quick Demo & Profile Selection Helper */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  1-Click Quick Demo Sign In
                </span>

                <div className="grid grid-cols-3 gap-2 text-[11px] items-stretch">
                  {/* Student Card with Integrated Button & Dropdown inside the card itself */}
                  <div className="w-full p-2 rounded-xl bg-[#070D1E] hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 flex flex-col justify-between items-center transition group min-h-[72px]">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleQuickDemoLogin('student')}
                      className="w-full text-center cursor-pointer disabled:opacity-50 flex flex-col items-center justify-center flex-1"
                      title="1-Click Login as Default Student (Rahul)"
                    >
                      {activeDemoRole === 'student' ? (
                        <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin my-1" />
                      ) : (
                        <>
                          <div className="font-bold text-[11px] text-indigo-400 group-hover:underline">Student</div>
                          <div className="text-[9px] text-slate-400 truncate">Rahul Verma</div>
                        </>
                      )}
                    </button>

                    {/* Integrated Select inside Student Card */}
                    <div className="relative w-full mt-1.5">
                      <select
                        id="student-profile-select"
                        value={selectedStudentId}
                        disabled={isSubmitting}
                        onChange={(e) => handleStudentSelectLogin(e.target.value)}
                        className="w-full pl-1.5 pr-4 py-0.5 text-[9px] bg-[#0c142e] border border-indigo-900/80 hover:border-indigo-500 rounded-md text-indigo-300 focus:ring-1 focus:ring-indigo-500 outline-hidden transition cursor-pointer appearance-none truncate"
                        title="Choose another student profile"
                      >
                        <option value="" disabled>
                          ▾ Profiles...
                        </option>
                        {studentList.map((std) => (
                          <option key={std.id} value={std.id} className="bg-[#0B132B] text-slate-200">
                            {std.name} ({std.roll_no || `Sem ${std.semester}`})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-2.5 h-2.5 text-indigo-400 absolute right-1 top-1 pointer-events-none" />
                    </div>
                  </div>

                  {/* Mentor Column */}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleQuickDemoLogin('mentor')}
                    className="w-full p-2 rounded-xl bg-[#070D1E] hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-300 transition text-center cursor-pointer disabled:opacity-50 group flex flex-col items-center justify-center min-h-[72px] h-full"
                    title="1-Click Login as Faculty Mentor"
                  >
                    {activeDemoRole === 'mentor' ? (
                      <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin my-1" />
                    ) : (
                      <>
                        <div className="font-bold text-[11px] text-indigo-300 group-hover:underline">Mentor</div>
                        <div className="text-[9px] text-slate-400 truncate">Prof. Ravi</div>
                      </>
                    )}
                  </button>

                  {/* HOD Column */}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleQuickDemoLogin('hod')}
                    className="w-full p-2 rounded-xl bg-[#070D1E] hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 transition text-center cursor-pointer disabled:opacity-50 group flex flex-col items-center justify-center min-h-[72px] h-full"
                    title="1-Click Login as HOD Dr. Sharma"
                  >
                    {activeDemoRole === 'hod' ? (
                      <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin my-1" />
                    ) : (
                      <>
                        <div className="font-bold text-[11px] text-amber-400 group-hover:underline">HOD</div>
                        <div className="text-[9px] text-slate-400 truncate">Dr. Sharma</div>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    placeholder="e.g. Sahil Bangera"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#070D1E] border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition"
                  />
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Institutional Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="e.g. sahil.cse@nitte.edu.in"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#070D1E] border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Account Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { role: 'student', label: 'Student' },
                    { role: 'mentor', label: 'Faculty Mentor' },
                    { role: 'hod', label: 'HOD' },
                  ].map((r) => (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => setRegRole(r.role as any)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer text-center ${
                        regRole === r.role
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-[#070D1E] border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Student Specific Fields */}
              {regRole === 'student' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      USN / Roll No
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={regRollNo}
                        onChange={(e) => setRegRollNo(e.target.value)}
                        placeholder="e.g. 4NN23CS180"
                        className="w-full pl-8 pr-2.5 py-2 text-xs bg-[#070D1E] border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition"
                      />
                      <Hash className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Current Semester
                    </label>
                    <div className="relative">
                      <select
                        value={regSemester}
                        onChange={(e) => setRegSemester(Number(e.target.value))}
                        className="w-full pl-8 pr-2.5 py-2 text-xs bg-[#070D1E] border border-slate-800 rounded-xl text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition cursor-pointer appearance-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s} className="bg-[#0B132B] text-white">
                            Semester {s}
                          </option>
                        ))}
                      </select>
                      <BookOpen className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-[#070D1E] border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </>
                )}
              </button>

              {/* Bottom Right: Already have an account? Sign in here */}
              <div className="flex items-center justify-end text-xs text-slate-400 pt-1">
                <span>Already have an account?</span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setError(null);
                  }}
                  className="ml-1.5 font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer transition"
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Page Footer */}
      <div className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 py-3 border-t border-slate-900">
        <div>
          Nitte University CSE Department • Creditz Academic Tracking & Accreditation Portal
        </div>

        {DEV_CONFIG.ENABLE_TEMPORARY_DEV_ACCESS_ON_AUTH && (
          <button
            type="button"
            onClick={handleDevAccess}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-300 transition text-[11px] font-mono cursor-pointer opacity-70 hover:opacity-100"
            title="Internal System Maintenance & Developer Portal"
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Developer Console</span>
          </button>
        )}
      </div>
    </div>
  );
};
