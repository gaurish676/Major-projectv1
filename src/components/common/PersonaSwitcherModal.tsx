import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from './Badge';
import {
  X,
  Search,
  Users,
  GraduationCap,
  Sparkles,
  CheckCircle,
  Building2,
  ArrowRight,
  Shield,
  Briefcase,
} from 'lucide-react';

interface PersonaSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPersona?: (personaId: string) => Promise<void>;
  currentUserId?: string;
}

export const PersonaSwitcherModal: React.FC<PersonaSwitcherModalProps> = ({
  isOpen,
  onClose,
  onSelectPersona,
  currentUserId,
}) => {
  const { personas, switchPersona, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'mentor' | 'student' | 'executive'>('all');
  const [isSwitching, setIsSwitching] = useState<string | null>(null);

  const activeId = currentUserId || user?.id;

  const filteredPersonas = useMemo(() => {
    return personas.filter((p) => {
      // Role filter
      if (roleFilter === 'mentor' && p.role !== 'mentor') return false;
      if (roleFilter === 'student' && p.role !== 'student') return false;
      if (roleFilter === 'executive' && p.role !== 'dean' && p.role !== 'hod') return false;

      // Text search
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.roll_no && p.roll_no.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.department_name && p.department_name.toLowerCase().includes(q)) ||
        (p.department_code && p.department_code.toLowerCase().includes(q))
      );
    });
  }, [personas, roleFilter, searchQuery]);

  const mentorCount = useMemo(() => personas.filter((p) => p.role === 'mentor').length, [personas]);
  const studentCount = useMemo(() => personas.filter((p) => p.role === 'student').length, [personas]);
  const execCount = useMemo(() => personas.filter((p) => p.role === 'dean' || p.role === 'hod').length, [personas]);

  if (!isOpen) return null;

  const handleSwitch = async (personaId: string) => {
    try {
      setIsSwitching(personaId);
      if (onSelectPersona) {
        await onSelectPersona(personaId);
      } else {
        await switchPersona(personaId);
      }
      onClose();
    } catch (err) {
      console.error('Failed to switch persona:', err);
    } finally {
      setIsSwitching(null);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-2xs animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
        {/* Modal Header */}
        <div className="bg-[#8eb86e] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Instant Demo Persona Switcher</span>
                <span className="text-xs font-normal text-white/90 bg-white/20 px-2 py-0.5 rounded-full">
                  {personas.length} Available Accounts
                </span>
              </h2>
              <p className="text-xs text-white/90 mt-0.5">
                Switch seamlessly between any NMAMIT lecturer, student, HOD, or Dean without re-logging
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Role Filter Tabs */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3 shrink-0">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, USN (e.g. NNM23CS...), employee ID, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#8eb86e] focus:border-transparent bg-white shadow-2xs"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Role Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                roleFilter === 'all'
                  ? 'bg-white text-slate-900 border border-slate-300 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>All Personas</span>
              <span className="text-[10px] bg-slate-200 px-1.5 py-0.2 rounded-full">
                {personas.length}
              </span>
            </button>

            <button
              onClick={() => setRoleFilter('mentor')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                roleFilter === 'mentor'
                  ? 'bg-white text-purple-900 border border-purple-200 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-purple-600" />
              <span>Lecturers & Mentors</span>
              <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-full font-bold">
                {mentorCount}
              </span>
            </button>

            <button
              onClick={() => setRoleFilter('student')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                roleFilter === 'student'
                  ? 'bg-white text-blue-900 border border-blue-200 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              <span>Students</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full font-bold">
                {studentCount}
              </span>
            </button>

            <button
              onClick={() => setRoleFilter('executive')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                roleFilter === 'executive'
                  ? 'bg-white text-amber-900 border border-amber-200 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Dean & HOD</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-bold">
                {execCount}
              </span>
            </button>
          </div>
        </div>

        {/* Persona Results List */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100 space-y-1">
          {filteredPersonas.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Users className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">No personas matching &ldquo;{searchQuery}&rdquo;</p>
              <p className="text-[11px] text-slate-400">Try searching with a different name or USN</p>
            </div>
          ) : (
            filteredPersonas.map((p) => {
              const isCurrent = p.id === activeId;
              const isCurrentlySwitching = isSwitching === p.id;

              return (
                <div
                  key={p.id}
                  className={`py-2.5 px-3 rounded-xl flex items-center justify-between gap-3 transition ${
                    isCurrent
                      ? 'bg-[#8eb86e]/10 border border-[#8eb86e]/30'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar Initials */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        p.role === 'dean'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : p.role === 'hod'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : p.role === 'mentor'
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}
                    >
                      {getInitials(p.name)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {p.name}
                        </span>
                        <RoleBadge role={p.role} />
                        {isCurrent && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Current</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                        {p.roll_no && (
                          <span className="font-semibold text-slate-700">{p.roll_no}</span>
                        )}
                        {p.roll_no && <span>&bull;</span>}
                        <span className="text-slate-500">{p.email}</span>
                        {p.semester && (
                          <>
                            <span>&bull;</span>
                            <span className="text-blue-700 font-sans font-semibold">Sem {p.semester}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Switch Action Button */}
                  <div className="shrink-0">
                    {isCurrent ? (
                      <span className="text-xs font-semibold text-emerald-700 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
                        Active Now
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSwitch(p.id)}
                        disabled={!!isSwitching}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#7eb462] hover:bg-[#6fa454] active:bg-[#5c873f] text-white shadow-2xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                      >
                        {isCurrentlySwitching ? (
                          <span>Switching...</span>
                        ) : (
                          <>
                            <span>Switch</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Showing <strong className="text-slate-800">{filteredPersonas.length}</strong> of {personas.length} total personas
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 font-medium text-slate-700 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
};