import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  GraduationCap,
  Calendar,
  Clock,
  Award,
  Printer,
  ArrowLeft,
  Copy,
  Check,
  FileCheck2,
} from 'lucide-react';

interface VerificationData {
  valid: boolean;
  credential_id: string;
  verification_status: string;
  student: {
    name: string;
    roll_no: string;
    department: string;
    semester: number;
  };
  activity: {
    title: string;
    category: string;
    points_awarded: number;
    hours_spent: number;
    completion_date: string;
    has_verified_proof: boolean;
  };
  audit: {
    reviewed_by: string;
    reviewer_designation: string;
    reviewed_at: string;
    mentor_feedback?: string;
    institutional_seal: string;
  };
  verification_url: string;
  qr_svg?: string;
  server_timestamp: string;
}

interface PublicVerificationPageProps {
  credentialId: string;
  onNavigateHome?: () => void;
}

export const PublicVerificationPage: React.FC<PublicVerificationPageProps> = ({
  credentialId,
  onNavigateHome,
}) => {
  const [data, setData] = useState<VerificationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`/api/verify/${encodeURIComponent(credentialId)}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || 'Failed to authenticate credential record.');
          setData(null);
        } else {
          setData(json);
        }
      } catch (err: any) {
        setError(err.message || 'Unable to connect to university verification ledger.');
      } finally {
        setIsLoading(false);
      }
    };

    if (credentialId) {
      fetchVerification();
    }
  }, [credentialId]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Banner Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-tight text-sm sm:text-base">Creditz</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Autonomous Ledger
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                Autonomous University Credential & Activity Points Verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateHome || (() => { window.location.href = '/'; })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer border border-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {isLoading ? (
          <div className="bg-slate-950 rounded-2xl p-10 border border-slate-800 shadow-xl text-center space-y-4 my-auto">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white">Querying Autonomous University Ledger...</h2>
              <p className="text-xs text-slate-400 font-mono">Verifying credential signature for ID: {credentialId}</p>
            </div>
          </div>
        ) : error || !data || !data.valid ? (
          <div className="bg-slate-950 rounded-2xl p-8 sm:p-10 border border-rose-900/50 shadow-2xl text-center space-y-4 max-w-xl mx-auto my-auto">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-white">Credential Record Not Found or Unverified</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {error || 'This activity credential could not be authenticated against the autonomous institutional ledger. The document hash may be invalid, pending evaluation, or revoked.'}
              </p>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 break-all">
              Ref Query: {credentialId}
            </div>
            <div className="pt-2">
              <button
                onClick={onNavigateHome || (() => { window.location.href = '/'; })}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm cursor-pointer"
              >
                Return to Creditz Portal
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden space-y-0 animate-in fade-in zoom-in-95 duration-200">
            {/* Top Verified Banner */}
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-6 border-b border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 tracking-wide uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{data.verification_status}</span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold text-white mt-1">
                    Authentic Academic Activity Credential
                  </h1>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    Ledger ID: <span className="text-emerald-400 font-semibold">{data.credential_id}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 print:hidden">
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                  title="Copy permanent verification URL"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy URL'}</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Print or export verified record"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Record</span>
                </button>
              </div>
            </div>

            {/* Credential Details Grid */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Student Identification Box */}
              <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Awarded To Student</span>
                  <div className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{data.student.name}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                      USN: {data.student.roll_no}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {data.student.department} • Semester {data.student.semester}
                  </p>
                </div>

                <div className="px-4 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-center sm:text-right shrink-0">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Degree Points Awarded</span>
                  <div className="text-2xl font-black text-emerald-300 font-mono">
                    +{data.activity.points_awarded} <span className="text-xs font-normal text-slate-400">/ 200 pts</span>
                  </div>
                </div>
              </div>

              {/* Activity & Proof Dossier */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-4">
                  <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800 space-y-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Activity Title</span>
                      <h3 className="text-base font-bold text-white mt-0.5">{data.activity.title}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">AICTE Category</span>
                        <span className="font-semibold text-indigo-300">{data.activity.category}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Mandatory Duration</span>
                        <span className="font-semibold text-slate-200">{data.activity.hours_spent} Hours Logged</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Date of Completion</span>
                        <span className="font-semibold text-slate-200">{data.activity.completion_date}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Digital Evidence</span>
                        <span className="font-semibold text-emerald-400">Verified Proof On-File ✓</span>
                      </div>
                    </div>
                  </div>

                  {/* Mentor Review Audit Trail */}
                  <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800 space-y-2.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Institutional Faculty Verification</span>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Verified By</span>
                        <span className="font-bold text-white">{data.audit.reviewed_by}</span>
                        <span className="text-slate-400 text-[11px] block">{data.audit.reviewer_designation}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[11px] block">Verification Timestamp</span>
                        <span className="font-mono text-slate-300">{new Date(data.audit.reviewed_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {data.audit.mentor_feedback && (
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 italic mt-2">
                        "{data.audit.mentor_feedback}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Dynamic QR Code Verification Card */}
                <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">Live Scannable QR Proof</span>
                  {data.qr_svg ? (
                    <div
                      className="w-40 h-40 bg-white p-2.5 rounded-xl shadow-md flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: data.qr_svg }}
                    />
                  ) : (
                    <img
                      src={`/api/verify/${encodeURIComponent(credentialId)}/qr.svg`}
                      alt="Verification QR"
                      className="w-40 h-40 bg-white p-2.5 rounded-xl shadow-md object-contain"
                    />
                  )}
                  <p className="text-[10px] text-slate-400 max-w-[180px] leading-tight">
                    Scan with any smartphone camera to inspect this official autonomous university credential record.
                  </p>
                </div>
              </div>

              {/* Institutional Seal Footer */}
              <div className="pt-4 border-t border-slate-800 text-center space-y-1">
                <p className="text-xs text-slate-400">
                  {data.audit.institutional_seal}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Autonomous AICTE 200-Point Activity & Degree Clearance Management System
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
