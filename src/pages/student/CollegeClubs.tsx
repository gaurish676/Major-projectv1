import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Users2,
  Building2,
  ExternalLink,
  Plus,
  CheckCircle2,
  Calendar,
  Sparkles,
  Award,
  Link as LinkIcon,
  Search,
  Filter,
  UserCheck,
  Globe,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  PlusCircle,
  X,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

export interface CollegeClub {
  id: string;
  name: string;
  category: 'Technical' | 'Societies' | 'Social & Outreach' | 'Cultural' | 'Innovation & E-Cell' | 'Sports';
  description: string;
  faculty_advisor: string;
  lead_student: string;
  member_count: number;
  is_registered: boolean;
  registration_id?: string;
  user_role?: string;
  joined_date?: string;
  club_url?: string;
  whatsapp_group?: string;
  points_eligible: boolean;
  tags: string[];
  banner_gradient: string;
  recent_activity?: string;
}

const DEFAULT_CLUBS: CollegeClub[] = [
  {
    id: 'club-1',
    name: 'Google Developer Groups (GDG) On Campus',
    category: 'Technical',
    description: 'Peer-to-peer learning community for students interested in Web, Cloud, AI, and Android development. Host hackathons and workshops.',
    faculty_advisor: 'Dr. Ramesh K (CS Dept)',
    lead_student: 'Aditya Shenoy (Final Year CSE)',
    member_count: 240,
    is_registered: true,
    registration_id: 'GDG-2025-089',
    user_role: 'Technical Team Member',
    joined_date: 'Sep 2024',
    club_url: 'https://gdsc.community.dev/campus-chapter',
    whatsapp_group: 'https://chat.whatsapp.com/demo-gdsc',
    points_eligible: true,
    tags: ['GenAI', 'Web3', 'Flutter', 'Hackathons'],
    banner_gradient: 'from-blue-600 to-indigo-700',
    recent_activity: 'Winter HackSprint 2025 Submission Review Open',
  },
  {
    id: 'club-2',
    name: 'ACM Student Chapter',
    category: 'Societies',
    description: 'Association for Computing Machinery official student chapter organizing competitive coding, algorithmic workshops, and research talks.',
    faculty_advisor: 'Prof. Ananya Rao',
    lead_student: 'Neha Verma (3rd Year CSE)',
    member_count: 185,
    is_registered: true,
    registration_id: 'ACM-IN-4421',
    user_role: 'Active Member',
    joined_date: 'Oct 2024',
    club_url: 'https://acm.org/chapters/student',
    points_eligible: true,
    tags: ['Competitive Coding', 'Algorithms', 'Research'],
    banner_gradient: 'from-sky-600 to-cyan-700',
    recent_activity: 'Monthly Algorithmic Sprint on Saturday',
  },
  {
    id: 'club-3',
    name: 'IEEE Computer Society & Robotics Chapter',
    category: 'Societies',
    description: 'Global technical professional organization driving technical innovation in Embedded Systems, Robotics, and IoT applications.',
    faculty_advisor: 'Dr. Suresh Babu',
    lead_student: 'Rohan Deshmukh',
    member_count: 160,
    is_registered: false,
    points_eligible: true,
    tags: ['Robotics', 'Embedded IoT', 'Paper Publishing'],
    banner_gradient: 'from-slate-800 to-slate-900',
    recent_activity: 'National RoboCon Project Teams Call for Proposals',
  },
  {
    id: 'club-4',
    name: 'Rotaract & NSS Social Impact Cell',
    category: 'Social & Outreach',
    description: 'Youth-led community outreach focusing on literacy camps, environmental drives, blood donation, and rural digital literacy missions.',
    faculty_advisor: 'Prof. Sunita Patil',
    lead_student: 'Kavya Sharma',
    member_count: 310,
    is_registered: true,
    registration_id: 'NSS-ENG-112',
    user_role: 'Volunteer Coordinator',
    joined_date: 'Aug 2024',
    club_url: 'https://nss.gov.in',
    points_eligible: true,
    tags: ['Community', 'NSS Camps', 'Blood Donation', 'Tree Plantation'],
    banner_gradient: 'from-rose-600 to-red-700',
    recent_activity: 'Rural Digital Empowerment Drive in Nov',
  },
  {
    id: 'club-5',
    name: 'E-Cell (Entrepreneurship & Innovation Cell)',
    category: 'Innovation & E-Cell',
    description: 'Incubation network supporting student startup ideation, venture pitch decks, founder AMA sessions, and seed grants.',
    faculty_advisor: 'Dr. Arvind Joshi (Incubation Head)',
    lead_student: 'Siddharth Rao',
    member_count: 140,
    is_registered: false,
    points_eligible: true,
    tags: ['Startups', 'Pitching', 'Venture Capital', 'Product Design'],
    banner_gradient: 'from-amber-600 to-orange-700',
    recent_activity: 'Campus Startup Pitch Day with Angel Investors',
  },
  {
    id: 'club-6',
    name: 'Dhwani - Cultural & Literary Society',
    category: 'Cultural',
    description: 'The creative hub for college theatre, inter-collegiate debate tournaments, musical ensembles, and the annual departmental fest.',
    faculty_advisor: 'Prof. Madhura K',
    lead_student: 'Tanvi Joshi',
    member_count: 220,
    is_registered: false,
    points_eligible: true,
    tags: ['Debate', 'Theatre', 'Annual Fest', 'Music'],
    banner_gradient: 'from-purple-600 to-indigo-800',
    recent_activity: 'Inter-Collegiate Debate Preliminary Round',
  },
];

interface CollegeClubsProps {
  onNavigateTab?: (tab: string) => void;
}

export const CollegeClubs: React.FC<CollegeClubsProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<CollegeClub[]>(() => {
    const saved = localStorage.getItem('college_clubs_registry');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_CLUBS;
      }
    }
    return DEFAULT_CLUBS;
  });

  const [activeFilter, setActiveFilter] = useState<'registered' | 'all' | 'Technical' | 'Societies' | 'Social & Outreach' | 'Cultural' | 'Innovation & E-Cell'>('registered');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClubForDetails, setSelectedClubForDetails] = useState<CollegeClub | null>(null);

  // New Club Form State
  const [newClubName, setNewClubName] = useState('');
  const [newCategory, setNewCategory] = useState<CollegeClub['category']>('Technical');
  const [newDescription, setNewDescription] = useState('');
  const [newRole, setNewRole] = useState('Member');
  const [newAdvisor, setNewAdvisor] = useState('');
  const [newClubUrl, setNewClubUrl] = useState('');
  const [newRegId, setNewRegId] = useState('');

  // Persist clubs
  useEffect(() => {
    localStorage.setItem('college_clubs_registry', JSON.stringify(clubs));
  }, [clubs]);

  const toggleRegisterClub = (clubId: string, customRole?: string) => {
    setClubs((prev) =>
      prev.map((c) => {
        if (c.id === clubId) {
          const nextState = !c.is_registered;
          return {
            ...c,
            is_registered: nextState,
            user_role: nextState ? customRole || c.user_role || 'Registered Member' : undefined,
            joined_date: nextState ? new Date().toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : undefined,
            registration_id: nextState ? c.registration_id || `REG-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
            member_count: nextState ? c.member_count + 1 : Math.max(1, c.member_count - 1),
          };
        }
        return c;
      })
    );
  };

  const handleAddNewClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClubName.trim()) return;

    const newClub: CollegeClub = {
      id: `custom-club-${Date.now()}`,
      name: newClubName.trim(),
      category: newCategory,
      description: newDescription.trim() || 'College registered student organization and activities chapter.',
      faculty_advisor: newAdvisor.trim() || 'Department Faculty Coordinator',
      lead_student: user?.name || 'Student Lead',
      member_count: 1,
      is_registered: true,
      user_role: newRole.trim() || 'Member',
      registration_id: newRegId.trim() || `CLUB-${Math.floor(1000 + Math.random() * 9000)}`,
      joined_date: new Date().toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
      club_url: newClubUrl.trim() || undefined,
      points_eligible: true,
      tags: [newCategory, 'College Chapter', 'Activities'],
      banner_gradient: 'from-indigo-600 to-blue-800',
      recent_activity: 'Connected to Student Activity Clearance Portal',
    };

    setClubs([newClub, ...clubs]);
    setIsAddModalOpen(false);
    // Reset form
    setNewClubName('');
    setNewDescription('');
    setNewRole('Member');
    setNewAdvisor('');
    setNewClubUrl('');
    setNewRegId('');
    setActiveFilter('registered');
  };

  const registeredClubs = clubs.filter((c) => c.is_registered);

  const filteredClubs = clubs.filter((club) => {
    const matchesSearch =
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      club.faculty_advisor.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'registered') return club.is_registered;
    if (activeFilter === 'all') return true;
    return club.category === activeFilter;
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-[#0B1329] rounded-2xl p-4 sm:p-6 text-white border border-slate-800/80 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-sky-300 border border-blue-500/30">
                Official Campus Chapters & Societies
              </span>
              <span className="text-xs text-slate-400">Activity Points Eligible</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
              <Users2 className="w-6 h-6 text-sky-400" />
              <span>College Clubs & Student Chapters</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Connect to your registered student clubs, access club portals, organize departmental hackathons, and verify your 200-point activity leadership credentials.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Connect New Club</span>
            </button>
          </div>
        </div>

        {/* Quick Highlights Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800">
            <div className="text-slate-400 text-[11px]">Your Registered Clubs</div>
            <div className="text-lg font-bold text-white mt-0.5">{registeredClubs.length} Active</div>
          </div>
          <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800">
            <div className="text-slate-400 text-[11px]">Campus Recognized</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">{clubs.length} Clubs</div>
          </div>
          <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800">
            <div className="text-slate-400 text-[11px]">Points Category</div>
            <div className="text-lg font-bold text-sky-300 mt-0.5">Cat 4 & 5 (Max 40 Pts)</div>
          </div>
          <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800">
            <div className="text-slate-400 text-[11px]">Clearance Status</div>
            <div className="text-lg font-bold text-amber-300 mt-0.5">Verified Chapter</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            <button
              onClick={() => setActiveFilter('registered')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'registered'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>My Registered Clubs ({registeredClubs.length})</span>
            </button>

            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All College Clubs ({clubs.length})
            </button>

            <button
              onClick={() => setActiveFilter('Technical')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
                activeFilter === 'Technical'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Technical
            </button>

            <button
              onClick={() => setActiveFilter('Societies')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
                activeFilter === 'Societies'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Societies
            </button>

            <button
              onClick={() => setActiveFilter('Social & Outreach')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
                activeFilter === 'Social & Outreach'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Social & NSS
            </button>

            <button
              onClick={() => setActiveFilter('Innovation & E-Cell')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
                activeFilter === 'Innovation & E-Cell'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              E-Cell & Startups
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search club, chapter, advisor..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Clubs Grid */}
      {filteredClubs.length === 0 ? (
        <div className="bg-white rounded-xl p-8 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">No clubs found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {activeFilter === 'registered'
                ? "You haven't registered with any college clubs yet. Explore and connect to earn activity points!"
                : 'Try adjusting your search terms or filters.'}
            </p>
          </div>
          {activeFilter === 'registered' && (
            <button
              onClick={() => setActiveFilter('all')}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer"
            >
              Browse All College Clubs
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClubs.map((club) => (
            <div
              key={club.id}
              className={`bg-white rounded-xl border transition-all flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md ${
                club.is_registered ? 'border-blue-300 ring-1 ring-blue-500/20' : 'border-slate-200'
              }`}
            >
              {/* Card Header Gradient */}
              <div className={`bg-gradient-to-r ${club.banner_gradient} p-4 text-white relative`}>
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 backdrop-blur-md text-white border border-white/30">
                    {club.category}
                  </span>
                  {club.is_registered ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/90 text-white flex items-center gap-1 shadow-xs">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Registered</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900/60 text-slate-200">
                      Open to Join
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white mt-2 line-clamp-2 leading-snug">
                  {club.name}
                </h3>

                {club.is_registered && club.user_role && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/15 backdrop-blur-md text-[11px] text-sky-100 font-medium">
                    <UserCheck className="w-3 h-3 text-emerald-300" />
                    <span>Your Role: <strong>{club.user_role}</strong></span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {club.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {club.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Faculty In-charge & Lead */}
                  <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-500">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Faculty Advisor:</span>
                      <span className="font-semibold text-slate-700 text-right truncate max-w-[170px]">
                        {club.faculty_advisor}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Members:</span>
                      <span className="font-semibold text-slate-700">{club.member_count} Students</span>
                    </div>
                    {club.registration_id && (
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-slate-400">Chapter ID:</span>
                        <span className="text-indigo-600 font-semibold">{club.registration_id}</span>
                      </div>
                    )}
                  </div>

                  {club.recent_activity && (
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] text-slate-600 flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{club.recent_activity}</span>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {club.club_url ? (
                    <a
                      href={club.club_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Club Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400">Internal College Chapter</span>
                  )}

                  <div className="flex items-center gap-1.5">
                    {club.is_registered ? (
                      <button
                        onClick={() => toggleRegisterClub(club.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 border border-slate-200 transition cursor-pointer"
                        title="Leave this club registration"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleRegisterClub(club.id, 'Member')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Join Club</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connect New Club Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Connect College Club Page</h3>
                  <p className="text-xs text-slate-500">Link your active club chapter or society to your student profile</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewClub} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Club / Chapter Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  placeholder="e.g. AI & Robotics Research Club, ACM-W, Debating Society"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as CollegeClub['category'])}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Technical">Technical & Coding</option>
                    <option value="Societies">Professional Societies (IEEE/ACM)</option>
                    <option value="Social & Outreach">Social & NSS</option>
                    <option value="Innovation & E-Cell">Innovation & E-Cell</option>
                    <option value="Cultural">Cultural & Arts</option>
                    <option value="Sports">Sports & Athletics</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Your Role / Designation</label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="e.g. Core Lead, Webmaster, Volunteer, Member"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Faculty Advisor / In-charge</label>
                  <input
                    type="text"
                    value={newAdvisor}
                    onChange={(e) => setNewAdvisor(e.target.value)}
                    placeholder="e.g. Dr. K. Sharma (CS Dept)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Registration ID / Membership No.</label>
                  <input
                    type="text"
                    value={newRegId}
                    onChange={(e) => setNewRegId(e.target.value)}
                    placeholder="e.g. CS-CLUB-2025"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Club Portal Link / Website URL</label>
                <div className="relative">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={newClubUrl}
                    onChange={(e) => setNewClubUrl(e.target.value)}
                    placeholder="https://yourcollegeclub.in or community page"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Activities Overview</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief summary of club objectives and key departmental activities"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 transition cursor-pointer"
                >
                  Save & Connect Club
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
