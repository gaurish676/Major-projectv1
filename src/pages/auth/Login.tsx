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
} from 'lucide-react';

export const Login: React.FC = () => {
  const { login, switchPersona, personas } = useAuth();

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Common UI State
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState<string | null>(null);

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
          student: 'rahul.cse@rvu.edu.in',
          mentor: 'dr.ramesh@rvu.edu.in',
          hod: 'hod.cse@rvu.edu.in',
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
    <div className="min-h-screen bg-[#070D1E] flex flex-col justify-between text-slate-100 p-4 sm:p-6 lg:p-8 relative">
      {/* Background Subtle Gradient Accents */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between py-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
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
        <div className="bg-[#0D1836]/90 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-blue-900/40 shadow-2xl space-y-5">
          
          {/* Sign In Header */}
          <div className="text-center space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Sign In
            </h1>
            <p className="text-xs text-slate-400">
              Enter your institutional credentials to access Creditz
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SIGN IN FORM ONLY */}
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
                  placeholder="e.g. rahul.cse@rvu.edu.in"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#070D1E] border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition"
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
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-[#070D1E] border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition"
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
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
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

            {/* Quick Fill Credentials Helper */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                1-Click Quick Demo Sign In
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleQuickDemoLogin('student')}
                  className="p-2 rounded-xl bg-[#070D1E] hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 text-slate-300 hover:text-sky-300 transition text-center cursor-pointer disabled:opacity-50 group flex flex-col items-center justify-center min-h-[48px]"
                  title="1-Click Login as Student Rahul"
                >
                  {activeDemoRole === 'student' ? (
                    <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin my-1" />
                  ) : (
                    <>
                      <div className="font-bold text-[11px] text-sky-400 group-hover:underline">Student</div>
                      <div className="text-[9px] text-slate-400 truncate">Rahul Verma</div>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleQuickDemoLogin('mentor')}
                  className="p-2 rounded-xl bg-[#070D1E] hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-purple-300 transition text-center cursor-pointer disabled:opacity-50 group flex flex-col items-center justify-center min-h-[48px]"
                  title="1-Click Login as Faculty Mentor"
                >
                  {activeDemoRole === 'mentor' ? (
                    <div className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin my-1" />
                  ) : (
                    <>
                      <div className="font-bold text-[11px] text-purple-400 group-hover:underline">Mentor</div>
                      <div className="text-[9px] text-slate-400 truncate">Prof. Ravi</div>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleQuickDemoLogin('hod')}
                  className="p-2 rounded-xl bg-[#070D1E] hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 transition text-center cursor-pointer disabled:opacity-50 group flex flex-col items-center justify-center min-h-[48px]"
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
        </div>
      </div>

      {/* Page Footer */}
      <div className="max-w-5xl mx-auto w-full text-center text-[11px] text-slate-500 py-3 border-t border-slate-900">
        RV University CSE Department • Creditz Academic Tracking & Accreditation Portal
      </div>
    </div>
  );
};
