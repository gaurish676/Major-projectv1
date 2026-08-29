export interface CategoryInfo {
  id: string;
  name: string; // Plain-English friendly name
  academicName: string;
  iconName: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  description: string;
  fastestOptions: string[];
}

export const CATEGORIES: Record<string, CategoryInfo> = {
  cat_cert: {
    id: 'cat_cert',
    name: 'Online Courses & Certifications',
    academicName: 'Technical Certifications',
    iconName: 'GraduationCap',
    emoji: '',
    color: '#2563eb',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    description: 'NPTEL, Coursera, AWS, Cisco, GCP, Microsoft verified courses',
    fastestOptions: ['Complete an NPTEL 12-week course (+30 pts)', 'Earn AWS / GCP Certification (+25 pts)'],
  },
  cat_comp: {
    id: 'cat_comp',
    name: 'Hackathons & Coding Contests',
    academicName: 'Hackathons & Competitions',
    iconName: 'Trophy',
    emoji: '',
    color: '#d97706',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    description: 'National / State level hackathons, ideathons, algorithmic competitions',
    fastestOptions: ['Win or participate in Smart India Hackathon (+20 to +40 pts)', 'Inter-College Coding Contest (+25 pts)'],
  },
  cat_intern: {
    id: 'cat_intern',
    name: 'Internships & Work Experience',
    academicName: 'Internships & Industrial Projects',
    iconName: 'Briefcase',
    emoji: '',
    color: '#059669',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    description: 'Corporate tech internships (min 4 weeks) and university R&D lab assistantships',
    fastestOptions: ['8-Week Industry Tech Internship (+30 pts)', 'Department R&D Lab Assistantship (+20 pts)'],
  },
  cat_work: {
    id: 'cat_work',
    name: 'Bootcamps & Workshops',
    academicName: 'Workshops & Conferences',
    iconName: 'Presentation',
    emoji: '',
    color: '#4f46e5',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    description: 'Hands-on technical bootcamps, IEEE / ACM research workshops, seminars',
    fastestOptions: ['5-Day Hands-on Tech Bootcamp (+15 pts)', '2-Day IEEE / ACM Conference (+10 pts)'],
  },
  cat_vol: {
    id: 'cat_vol',
    name: 'Volunteering & Social Service',
    academicName: 'Community Service & Volunteering',
    iconName: 'HeartHandshake',
    emoji: '',
    color: '#172554',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-300',
    textColor: 'text-slate-800',
    description: 'NSS camps, blood donation drives, coding clubs, rural tech outreach initiatives',
    fastestOptions: ['NSS 7-Day Residential Rural Camp (+25 pts)', 'Blood Donation or Tech Club Lead (+10 to +20 pts)'],
  },
  cat_sports: {
    id: 'cat_sports',
    name: 'Sports, Fests & Cultural',
    academicName: 'Sports, Cultural & Extra-Curricular',
    iconName: 'Activity',
    emoji: '',
    color: '#0f172a',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    textColor: 'text-slate-700',
    description: 'Inter-university sports, annual cultural fest organizing, debate clubs',
    fastestOptions: ['All-India Inter-University Sports (+30 pts)', 'College Fest Core Organizer / Winner (+15 to +20 pts)'],
  },
};

export function getCategoryPlainName(categoryId?: string, fallbackName?: string): string {
  if (!categoryId) return fallbackName || 'General Activity';
  const cat = CATEGORIES[categoryId];
  if (cat) return cat.name;
  return fallbackName || 'General Activity';
}

export function getCategoryEmoji(categoryId?: string): string {
  return '';
}

export function getCategoryInfo(categoryId?: string): CategoryInfo {
  if (categoryId && CATEGORIES[categoryId]) {
    return CATEGORIES[categoryId];
  }
  return {
    id: categoryId || 'cat_other',
    name: 'Activity / Event',
    academicName: 'Other Activity',
    iconName: 'FileText',
    emoji: '',
    color: '#4f46e5',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    description: 'Verified academic or extracurricular activity proof',
    fastestOptions: ['Submit valid certificate (+20 pts)'],
  };
}
