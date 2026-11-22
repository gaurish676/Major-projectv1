import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { apiRequest } from '../../lib/api';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  X,
  Layers,
  Sparkles,
  BookOpen,
  Calendar,
  Award,
  ShieldCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface RulebookPreset {
  id: string;
  title: string;
  description: string;
  target_year: string;
  rules_count: number;
}

interface RuleItem {
  id: string;
  category: string;
  year_scope: '1st Year' | '2nd, 3rd & 4th Years' | 'All Years';
  activity_name: string;
  points: number;
  max_cap: number;
  mandatory_hours: number;
  description: string;
}

interface RulebookManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRulesApplied?: () => void;
}

export const RulebookManagerModal: React.FC<RulebookManagerModalProps> = ({
  isOpen,
  onClose,
  onRulesApplied,
}) => {
  const [presets, setPresets] = useState<RulebookPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('preset_aicte_vtu');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'upload'>('presets');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Pre-configured rules separating 1st Year vs 2nd, 3rd, 4th Years
  const [parsedRules, setParsedRules] = useState<RuleItem[]>([
    {
      id: 'r_1',
      category: 'Induction & UHV',
      year_scope: '1st Year',
      activity_name: 'Student Induction Program (SIP) & Universal Human Values',
      points: 20,
      max_cap: 20,
      mandatory_hours: 60,
      description: 'Mandatory 3-week induction for freshers covering physical activities, creative arts, and universal human values.',
    },
    {
      id: 'r_2',
      category: 'Technical Certifications',
      year_scope: '2nd, 3rd & 4th Years',
      activity_name: 'Global Professional Certification (AWS / NPTEL Elite / Azure)',
      points: 30,
      max_cap: 60,
      mandatory_hours: 40,
      description: 'Recognized industry credentials verified with exam scorecard or digital badge.',
    },
    {
      id: 'r_3',
      category: 'Hackathons & Competitions',
      year_scope: '2nd, 3rd & 4th Years',
      activity_name: 'Smart India Hackathon / State-Level Competitions',
      points: 30,
      max_cap: 60,
      mandatory_hours: 36,
      description: 'National and state hackathons; awards, finalist certificates or participation.',
    },
    {
      id: 'r_4',
      category: 'Industrial Internships',
      year_scope: '2nd, 3rd & 4th Years',
      activity_name: 'Corporate & R&D Summer Internship (4 to 8 Weeks)',
      points: 40,
      max_cap: 50,
      mandatory_hours: 80,
      description: 'Summer/winter technical internships with completion letter and mentor evaluation.',
    },
    {
      id: 'r_5',
      category: 'Community & Social Service',
      year_scope: 'All Years',
      activity_name: 'NSS Rural Camp / Red Cross / Blood Donation Drives',
      points: 20,
      max_cap: 40,
      mandatory_hours: 40,
      description: 'Institutional social responsibility, village adoption, and community outreach programs.',
    },
    {
      id: 'r_6',
      category: 'Sports & Cultural',
      year_scope: 'All Years',
      activity_name: 'Inter-University Sports / Department Cultural Fests',
      points: 20,
      max_cap: 40,
      mandatory_hours: 30,
      description: 'University sports tournaments, athletics, music, dramatics, and arts representation.',
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      apiRequest<RulebookPreset[]>('/api/rulebook/presets')
        .then(setPresets)
        .catch((err) => console.warn('Rulebook presets note:', err));
    }
  }, [isOpen]);

  const handleApplyRules = async () => {
    try {
      setIsUploading(true);
      setStatusMsg(null);

      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      formData.append('preset_id', selectedPreset);

      await apiRequest('/api/rulebook/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      setStatusMsg({
        text: 'Rulebook policy applied successfully! 1st Year rules and 2nd–4th Year caps are now active.',
        type: 'success',
      });

      setTimeout(() => {
        if (onRulesApplied) onRulesApplied();
        onClose();
      }, 1500);
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to apply rulebook', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[90vh]"
          >
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-[#0B1329] via-[#0F1E4A] to-[#0B1329] text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                <BookOpen className="w-4 h-4 text-sky-300" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                  <span>University Rulebook & Circular Management</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-sky-300 border border-blue-500/30 font-bold">
                    1st Year vs 2nd–4th Years
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Upload AICTE/VTU circular PDF or activate presets to dynamically set activity caps
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto text-xs">
            {statusMsg && (
              <div
                className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                  statusMsg.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{statusMsg.text}</span>
              </div>
            )}

            {/* Presets vs Upload Switcher */}
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer text-center ${
                  activeTab === 'presets' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Official Presets (AICTE / VTU Autonomous)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer text-center ${
                  activeTab === 'upload' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Upload University Circular (PDF)
              </button>
            </div>

            {/* Mode 1: Presets */}
            {activeTab === 'presets' ? (
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Select Institutional Framework:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setSelectedPreset('preset_aicte_vtu')}
                    className={`p-3 rounded-xl border cursor-pointer transition space-y-1.5 ${
                      selectedPreset === 'preset_aicte_vtu'
                        ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-500'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">AICTE & VTU Autonomous Framework</span>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Explicitly separates <strong>1st Year SIP (60 hrs) & UHV</strong> from <strong>2nd, 3rd & 4th Year</strong> technical hackathons, NPTEL/AWS certs, and industrial internships.
                    </p>
                  </div>

                  <div
                    onClick={() => setSelectedPreset('preset_autonomous_fasttrack')}
                    className={`p-3 rounded-xl border cursor-pointer transition space-y-1.5 ${
                      selectedPreset === 'preset_autonomous_fasttrack'
                        ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-500'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">Honors & Industry Fast-Track</span>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-1.5 py-0.2 rounded">
                        Optional
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Higher weightage for global cloud certifications and corporate internships with 30 pts/semester cap.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/40 text-center space-y-2">
                <UploadCloud className="w-8 h-8 text-indigo-600 mx-auto" />
                <div>
                  <label className="text-xs font-bold text-indigo-900 cursor-pointer hover:underline block">
                    <span>Click to browse official university circular PDF</span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-500">
                    {selectedFile ? `Selected: ${selectedFile.name}` : 'AI parser will automatically extract rules, hours, and year separations'}
                  </p>
                </div>
              </div>
            )}

            {/* Parsed Rules Breakdown Showing Year Separation */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Configured Rules & Year Separation Preview</span>
                </span>
                <span className="text-[10px] text-slate-500">Semester Cap: 30 pts</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {parsedRules.map((r) => (
                  <div
                    key={r.id}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{r.activity_name}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            r.year_scope === '1st Year'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-purple-100 text-purple-900 border border-purple-300'
                          }`}
                        >
                          {r.year_scope}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">{r.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold font-mono text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs block">
                        +{r.points} pts
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        Cap: {r.max_cap} pts ({r.mandatory_hours}h)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApplyRules}
                disabled={isUploading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Parsing & Applying...' : 'Apply Rules to Portal'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
};
