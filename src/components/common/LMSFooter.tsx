import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  ChevronUp,
  X,
  ExternalLink,
  GraduationCap,
  ShieldCheck,
  Award,
  Phone,
  Mail,
  MapPin,
  BookOpen,
} from 'lucide-react';

export const LMSFooter: React.FC = () => {
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
      <footer className="bg-[#2b2b2b] text-white pt-10 pb-8 mt-12 border-t border-slate-700 select-none print:hidden">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 pb-8 border-b border-white/10">
            {/* Column 1: About Us */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-[#f97316] tracking-wide">
                About Us
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                <li>
                  <a
                    href="https://nmamit.nitte.edu.in"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white hover:underline transition"
                  >
                    About NMAMIT
                  </a>
                </li>
                <li>
                  <a
                    href="https://nmamit.nitte.edu.in/vision-mission.php"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white hover:underline transition"
                  >
                    Vision, Mission & Core Values
                  </a>
                </li>
                <li>
                  <a
                    href="https://nmamit.nitte.edu.in/quality-policy.php"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white hover:underline transition"
                  >
                    Quality Policy
                  </a>
                </li>
                <li>
                  <a
                    href="https://nmamit.nitte.edu.in/rules-regulations.php"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white hover:underline transition"
                  >
                    Rules & Regulations
                  </a>
                </li>
                <li>
                  <span className="text-[#8eb86e] font-semibold flex items-center gap-1.5 mt-1">
                    <GraduationCap className="w-4 h-4 shrink-0" />
                    <span>AICTE & VTU Mandatory Activity Points Portal</span>
                  </span>
                </li>
              </ul>
            </div>

            {/* Column 2: Contact Us */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-[#f97316] tracking-wide">
                Contact Us
              </h3>
              <div className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                <p className="flex items-start gap-2 leading-relaxed">
                  <MapPin className="w-4 h-4 text-[#8eb86e] shrink-0 mt-0.5" />
                  <span>
                    NMAM Institute of Technology, Nitte, Karkala Taluk, Udupi-574110, Karnataka, India.
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#8eb86e] shrink-0" />
                  <span>Phone: +91 - 8258 - 281039 / 281263</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#8eb86e] shrink-0" />
                  <span>E-mail: principal_nmamit@nitte.edu.in</span>
                </p>
              </div>
            </div>

            {/* Column 3: Follow Us & Socials */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-[#f97316] tracking-wide">
                Follow Us
              </h3>
              <p className="text-xs text-slate-300">
                Connect with NMAM Institute of Technology across official campus channels:
              </p>
              <div className="flex items-center gap-3 pt-1">
                {/* Twitter / X */}
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  title="Twitter"
                  className="w-10 h-10 rounded-md bg-[#26a7de] hover:opacity-90 flex items-center justify-center text-white transition shadow-sm font-bold text-sm cursor-pointer"
                >
                  𝕏
                </a>

                {/* YouTube */}
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  title="YouTube"
                  className="w-10 h-10 rounded-md bg-[#cc181e] hover:opacity-90 flex items-center justify-center text-white transition shadow-sm font-bold text-sm cursor-pointer"
                >
                  ▶
                </a>

                {/* Facebook */}
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  title="Facebook"
                  className="w-10 h-10 rounded-md bg-[#2e639e] hover:opacity-90 flex items-center justify-center text-white transition shadow-sm font-bold text-sm cursor-pointer"
                >
                  f
                </a>

                {/* Instagram */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  title="Instagram"
                  className="w-10 h-10 rounded-md bg-[#c82d8c] hover:opacity-90 flex items-center justify-center text-white transition shadow-sm font-bold text-sm cursor-pointer"
                >
                  📷
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Accreditation strip */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <p>
              © {new Date().getFullYear()} NMAMIT & NITTE (Deemed to be University). All rights reserved.
            </p>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-[#8eb86e] font-semibold">Creditz LMS Feature Module</span>
              <span className="text-slate-600">|</span>
              <span>AICTE 100/200 Points Compliant</span>
            </div>
          </div>
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
                    NMAMIT LMS Creditz Portal Guide
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
                <span className="font-bold">What is Creditz in LMS?</span>
                <p className="mt-0.5">
                  Creditz is the official activity point tracking module integrated into NMAMIT's Learning Management System. Every engineering student must earn mandatory non-academic credits (100 pts for regular / 75 pts for lateral entry) across 8 semesters to earn their B.Tech degree.
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-slate-900 text-xs">How do I submit proofs?</span>
                <p>
                  1. Click <strong>+ Submit Proof</strong> in the sidebar or student dashboard.<br />
                  2. Upload your certificate (PDF or Image) and select the matching category.<br />
                  3. Our AI audit will analyze the file authenticity and queue it for your Faculty Mentor's approval.
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
