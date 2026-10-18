import React, { useRef } from 'react';
import { StudentCreditReportData } from '../../types';
import {
  Printer,
  X,
  GraduationCap,
  Award,
  CheckCircle2,
  Clock,
  Building2,
  ShieldCheck,
  Calendar,
  User as UserIcon,
  QrCode,
  FileSpreadsheet,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface StudentCreditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: StudentCreditReportData | null;
}

export const StudentCreditReportModal: React.FC<StudentCreditReportModalProps> = ({
  isOpen,
  onClose,
  reportData,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !reportData) return null;

  const {
    student,
    points_summary,
    categories_breakdown,
    semester_breakdown,
    submissions,
    academic_summary,
    verification_id,
    institution,
    generated_at,
  } = reportData;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(generated_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = new Date(generated_at).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Award className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Official Student Credit Report</h2>
              <p className="text-[11px] text-slate-400">Institutional Activity Transcript & Degree Clearance Record</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Report Sheet (What gets printed) */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-900 print:p-0 print:overflow-visible print:text-black">
          <div id="student-credit-report-print" ref={reportRef} className="space-y-6">
            
            {/* 1. Institutional Header */}
            <div className="border-b-2 border-slate-900 pb-5 text-center relative space-y-1.5">
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <h1 className="text-lg sm:text-xl font-extrabold uppercase tracking-tight text-slate-900">
                    {institution.name}
                  </h1>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {institution.accreditation}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <div className="inline-block px-3 py-1 rounded bg-slate-100 border border-slate-300 text-xs font-extrabold uppercase tracking-widest text-slate-800">
                  {institution.department}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1 uppercase tracking-wide">
                  Official Activity Points & Degree Clearance Transcript
                </h2>
                <p className="text-[11px] text-slate-500 italic">
                  Pursuant to AICTE Mandatory Co-Curricular & Extra-Curricular Activity Credit Regulations (200-Point Degree Matrix)
                </p>
              </div>

              {/* Verification Metadata Strip */}
              <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-200 mt-3 font-mono">
                <span>VERIFICATION REF: <strong className="text-slate-800">{verification_id}</strong></span>
                <span>DATE ISSUED: <strong className="text-slate-800">{formattedDate} ({formattedTime})</strong></span>
              </div>
            </div>

            {/* 2. Student Identity & Clearance Verdict Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-300">
              {/* Student Bio */}
              <div className="md:col-span-2 space-y-1.5 border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0 md:pr-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Candidate Credentials
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg border border-indigo-200">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{student.name}</h3>
                    <p className="text-xs text-slate-600 font-medium">{student.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Roll No / USN</span>
                    <strong className="font-mono text-slate-800">{student.roll_no || '1MS21CS098'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Current Semester</span>
                    <strong className="text-slate-800">Semester {student.semester || 6}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Academic CGPA</span>
                    <strong className="font-mono text-emerald-700 font-bold">{academic_summary.cumulative_sgpa || student.cgpa || '8.45'}</strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Faculty Mentor</span>
                    <strong className="text-slate-800">{student.mentor_name || 'Prof. Anita Desai'}</strong>
                  </div>
                </div>
              </div>

              {/* Clearance Status Stamp */}
              <div className="flex flex-col items-center justify-center text-center p-3 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Degree Clearance Status
                </span>
                <div className="flex items-center justify-center">
                  {points_summary.is_cleared ? (
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Clock className="w-7 h-7" />
                    </div>
                  )}
                </div>
                <div>
                  <div className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block ${
                    points_summary.is_cleared ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {points_summary.is_cleared ? 'DEGREE CLEARED' : 'IN PROGRESS'}
                  </div>
                  <div className="text-lg font-black font-mono text-slate-900 mt-1">
                    {points_summary.total_effective_points} <span className="text-xs font-normal text-slate-500">/ 200 PTS</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {points_summary.is_cleared ? 'Graduation activity point requirements met in full.' : `${200 - points_summary.total_effective_points} credits required for final sign-off.`}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Executive Credit Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Approved Points</span>
                <span className="text-xl font-extrabold text-slate-900 font-mono">{points_summary.raw_total_points}</span>
                <span className="text-[10px] text-slate-500 block">All verified submissions</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Effective Degree Points</span>
                <span className="text-xl font-extrabold text-emerald-600 font-mono">{points_summary.total_effective_points}</span>
                <span className="text-[10px] text-slate-500 block">After semester caps (30 max/sem)</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Excess Points Capped</span>
                <span className="text-xl font-extrabold text-amber-600 font-mono">+{points_summary.total_excess_points}</span>
                <span className="text-[10px] text-slate-500 block">Exceeded 30 pts ceiling</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Milestone Tier</span>
                <span className="text-xl font-extrabold text-indigo-600">{points_summary.milestone_tier}</span>
                <span className="text-[10px] text-slate-500 block">Institutional benchmark</span>
              </div>
            </div>

            {/* 4. Category-Wise Distribution Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <Award className="w-3.5 h-3.5 text-indigo-600" />
                <span>Domain Category Credit Compliance</span>
              </h3>
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                  <tr>
                    <th className="py-2 px-3 border-b border-slate-200">Activity Domain</th>
                    <th className="py-2 px-3 border-b border-slate-200 text-center">Institutional Cap</th>
                    <th className="py-2 px-3 border-b border-slate-200 text-center">Points Earned</th>
                    <th className="py-2 px-3 border-b border-slate-200 text-center">Approved Points</th>
                    <th className="py-2 px-3 border-b border-slate-200 text-right">Compliance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {categories_breakdown.map((cat: any) => {
                    const earned = cat.earned_points || 0;
                    const maxCap = cat.max_cap_points || 50;
                    const capped = cat.capped_points || Math.min(earned, maxCap);
                    const isMaxed = earned >= maxCap;

                    return (
                      <tr key={cat.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-900">{cat.name}</td>
                        <td className="py-2 px-3 text-center font-mono text-slate-500">{maxCap} pts</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-800">{earned}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700">{capped}</td>
                        <td className="py-2 px-3 text-right">
                          {isMaxed ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                              Max Cap Reached
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-500">
                              {maxCap - earned} pts remaining
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 5. Semester-by-Semester Progression (Sem 1 to 8) */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Semester Progression & Continuous Development (30 Pts / Sem Cap)</span>
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center">
                {semester_breakdown.map((sem: any) => {
                  const raw = sem.raw_earned_points || 0;
                  const capped = sem.capped_points || 0;
                  const excess = sem.excess_points || 0;
                  const isCap = raw >= 30;

                  return (
                    <div
                      key={sem.semester}
                      className={`p-2 rounded border text-xs ${
                        isCap
                          ? 'bg-emerald-50 border-emerald-300'
                          : capped > 0
                          ? 'bg-slate-50 border-slate-300'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase text-slate-500">Sem {sem.semester}</div>
                      <div className="text-sm font-extrabold font-mono text-slate-900 mt-0.5">{capped}</div>
                      <div className="text-[9px] text-slate-400 font-mono">/ 30 pts</div>
                      {excess > 0 && (
                        <div className="text-[9px] font-bold text-amber-700 mt-0.5" title="Excess points above 30">
                          +{excess} ex
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 6. Complete Verified Activity Ledger */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Activity Credentials & Sign-Off Ledger</span>
              </h3>
              {submissions.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center italic bg-slate-50 rounded">No approved certificates on record yet.</p>
              ) : (
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-2.5 border-b border-slate-200 w-8">#</th>
                      <th className="py-2 px-2.5 border-b border-slate-200">Activity Title</th>
                      <th className="py-2 px-2.5 border-b border-slate-200">Category</th>
                      <th className="py-2 px-2.5 border-b border-slate-200 text-center">Date</th>
                      <th className="py-2 px-2.5 border-b border-slate-200 text-center">Points</th>
                      <th className="py-2 px-2.5 border-b border-slate-200 text-center">Status</th>
                      <th className="py-2 px-2.5 border-b border-slate-200">Verified By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {submissions.map((sub: any, idx: number) => (
                      <tr key={sub.id} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2.5 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-1.5 px-2.5 font-semibold text-slate-900">{sub.activity_title}</td>
                        <td className="py-1.5 px-2.5 text-slate-600 text-[10px]">{sub.category_name}</td>
                        <td className="py-1.5 px-2.5 text-center text-slate-500 font-mono text-[10px]">{sub.completion_date}</td>
                        <td className="py-1.5 px-2.5 text-center font-mono font-bold text-emerald-700">+{sub.points_awarded || sub.base_points || 20}</td>
                        <td className="py-1.5 px-2.5 text-center">
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            sub.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : sub.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-700 text-[10px]">{sub.reviewer_name || 'Prof. Anita Desai'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* 7. Official Authentication Sign-off & Signatures Block */}
            <div className="pt-8 border-t border-slate-300">
              <div className="grid grid-cols-3 gap-6 text-center text-xs">
                
                {/* Mentor Signature */}
                <div className="space-y-12">
                  <div className="h-10 flex items-end justify-center">
                    <div className="font-serif italic text-sm text-slate-700 border-b border-slate-400 px-6 pb-1">
                      {student.mentor_name || 'Prof. Anita Desai'}
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">Faculty Mentor</div>
                    <div className="text-[10px] text-slate-500">Department Academic Advisory</div>
                  </div>
                </div>

                {/* Institutional QR & Seal */}
                <div className="flex flex-col items-center justify-center space-y-1">
                  <div className="w-16 h-16 border-2 border-dashed border-slate-400 rounded-lg flex flex-col items-center justify-center p-1 bg-slate-50">
                    <QrCode className="w-10 h-10 text-slate-800" />
                    <span className="text-[7px] font-mono text-slate-500 uppercase">Tamper-Proof</span>
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Institutional Seal</div>
                </div>

                {/* HOD Signature */}
                <div className="space-y-12">
                  <div className="h-10 flex items-end justify-center">
                    <div className="font-serif italic text-sm text-slate-700 border-b border-slate-400 px-6 pb-1">
                      Dr. Rajesh Sharma
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">Head of Department (HOD)</div>
                    <div className="text-[10px] text-slate-500">Computer Science & Engineering</div>
                  </div>
                </div>

              </div>

              {/* Legal / NBA accreditation footer */}
              <div className="text-center text-[9px] text-slate-400 pt-6 mt-4 border-t border-slate-100 font-mono">
                This document is a computer-generated academic credit transcript recognized for B.Tech degree awarding and NBA Tier-1 accreditation records.
                Document ID: {verification_id} | Timestamp: {generated_at}
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Sticky Bar (Hidden in Print) */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between print:hidden shrink-0">
          <div className="text-xs text-slate-600">
            Click <strong>Print / Save as PDF</strong> and choose destination <em>"Save as PDF"</em>.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
