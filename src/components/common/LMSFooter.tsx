import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  HelpCircle,
  ChevronUp,
  X,
} from 'lucide-react';

export const LMSFooter: React.FC = () => {
  const { user } = useAuth();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (window.scrollY > 200) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Authentic Moodle Light Footer Bar matching LMS screenshots */}
      <footer className="bg-white border-t border-slate-200/90 py-6 mt-14 text-center text-xs text-slate-500 select-none print:hidden">
        <div className="max-w-5xl mx-auto px-4 space-y-1.5">
          <p>
            You are logged in as{' '}
            <span className="font-semibold text-slate-700">
              {user?.name || 'Student'}
            </span>{' '}
            ({user?.roll_no || 'NNM23CS078'})
          </p>
          <p className="text-[11px] text-slate-400">
            NMAM Institute of Technology &bull; Creditz: An Intelligent Co-Curricular Activity Portal
          </p>
        </div>
      </footer>

      {/* Floating Bottom-Right Buttons matching LMS screenshot */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-center gap-2.5 print:hidden">
        {/* Scroll-to-top square button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            title="Scroll to Top"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-md bg-[#8eb86e] hover:bg-[#7eb462] text-white flex items-center justify-center shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        )}

        {/* Circular Help ? button */}
        <button
          onClick={() => setIsHelpOpen(true)}
          title="Creditz & LMS Help Guide"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#8eb86e] hover:bg-[#7eb462] text-white flex items-center justify-center shadow-lg transition transform hover:scale-105 font-bold text-base cursor-pointer"
        >
          ?
        </button>
      </div>

      {/* Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#8eb86e]/20 text-[#5c873f] flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    NMAMIT LMS Activity Credit Guide
                  </h3>
                  <p className="text-xs text-slate-500">Activity Points & Degree Clearance System</p>
                </div>
              </div>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-900">
                <span className="font-bold">What is Activity Credits in LMS?</span>
                <p className="mt-0.5">
                  This portal is the official activity point tracking module integrated into NMAMIT's Learning Management System. Every engineering student must earn mandatory non-academic credits (100 pts for regular / 75 pts for lateral entry) across 8 semesters to earn their B.Tech degree.
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-slate-900 text-xs">How do I submit proofs?</span>
                <p>
                  1. Click <strong>+ Upload Proof</strong> on your Activity Points course card or right block drawer.<br />
                  2. Upload your certificate (PDF or Image) and select the matching category.<br />
                  3. Our system will analyze the certificate and queue it for your Faculty Mentor's approval.
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-slate-900 text-xs">Category Limits & Semester Caps:</span>
                <p>
                  Maximum of <strong>30 points per semester</strong> can be counted towards degree clearance. Ensure your certificates are distributed across certifications, workshops, hackathons, and community volunteering.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsHelpOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#8eb86e] hover:bg-[#7eb462] text-white font-semibold text-xs transition cursor-pointer"
              >
                Got It, Thank You
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
