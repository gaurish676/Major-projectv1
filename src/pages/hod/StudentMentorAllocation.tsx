import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../../lib/api';
import { StatusBadge } from '../../components/common/Badge';
import { PDFViewerModal } from '../../components/common/PDFViewerModal';
import { Submission } from '../../types';
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Sparkles,
  Upload,
  FileSpreadsheet,
  Download,
  RefreshCw,
  Printer,
  ShieldCheck,
  Clock,
  Eye,
  Check,
  X,
  UserCheck,
  CheckSquare,
  Square,
  Loader2,
  FileText,
  Info,
  Layers,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  UserPlus,
  Phone,
  Mail,
  Building2,
  MapPin,
  User,
  AlertTriangle,
} from 'lucide-react';

interface StudentItem {
  id: string;
  name: string;
  email: string;
  roll_no: string;
  semester: number;
  cgpa: number;
  phone?: string;
  mentor_id: string | null;
  mentor_name: string | null;
  mentor_email: string | null;
  approved_points: number;
  pending_submissions: number;
  isNewFromCSV?: boolean;
}

interface MentorItem {
  id: string;
  name: string;
  email: string;
  current_mentees_count?: number;
  designation?: string;
  phone?: string;
  office_location?: string;
}

interface ParsedCSVStudent {
  name: string;
  roll_no: string;
  email: string;
  semester: string;
  cgpa: string;
  phone?: string;
}

interface ReportData {
  students: any[];
  submissions: Submission[];
  clearance_summary: {
    cleared: number;
    near_completion: number;
    in_progress: number;
    at_risk: number;
  };
}

export const StudentMentorAllocation: React.FC = () => {
  // Navigation sub-tab: 'allocation' | 'mentors' | 'naac-summary' | 'audit-ledger'
  const [activeSubTab, setActiveSubTab] = useState<'allocation' | 'mentors' | 'naac-summary' | 'audit-ledger'>('allocation');

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [mentors, setMentors] = useState<MentorItem[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMentorFilter, setSelectedMentorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unallocated' | 'allocated'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Mentor Directory Filter
  const [mentorSearchQuery, setMentorSearchQuery] = useState('');

  // Mentor CRUD State
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [mentorModalMode, setMentorModalMode] = useState<'create' | 'edit'>('create');
  const [selectedMentorForEdit, setSelectedMentorForEdit] = useState<MentorItem | null>(null);
  const [mentorFormData, setMentorFormData] = useState({
    name: '',
    email: '',
    designation: 'Assistant Professor',
    phone: '',
    office_location: '',
  });
  const [isSavingMentor, setIsSavingMentor] = useState(false);

  // Student (Mentee) CRUD State
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentModalMode, setStudentModalMode] = useState<'create' | 'edit'>('create');
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<StudentItem | null>(null);
  const [studentFormData, setStudentFormData] = useState({
    name: '',
    roll_no: '',
    email: '',
    semester: 6,
    cgpa: 8.0,
    phone: '',
    mentor_id: '',
  });
  const [isSavingStudent, setIsSavingStudent] = useState(false);

  // Generic Delete Confirmation Dialog State
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'mentor' | 'student';
    id: string;
    name: string;
    extraInfo?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // NAAC & Audit Report Data
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Evidence PDF Viewer
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Selection state for manual batch allocation
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [batchMentorId, setBatchMentorId] = useState<string>('');
  const [isBatchAssigning, setIsBatchAssigning] = useState(false);

  // CSV Import State
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvRawText, setCsvRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedCSVStudent[]>([]);
  const [isImportingCSV, setIsImportingCSV] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-Allocation Modal State
  const [showAutoAllocateModal, setShowAutoAllocateModal] = useState(false);
  const [autoMethod, setAutoMethod] = useState<'balanced' | 'roll_range'>('balanced');
  const [autoScope, setAutoScope] = useState<'unallocated' | 'all' | 'selected'>('unallocated');
  const [isAutoAllocating, setIsAutoAllocating] = useState(false);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      // Load Allocations
      const res = await apiRequest<any>('/api/hod/allocations');
      const studentsList: StudentItem[] = Array.isArray(res) ? res : (res?.students || []);
      let mentorsList: MentorItem[] = res?.mentors || [];
      
      if (!mentorsList || mentorsList.length === 0) {
        try {
          const mentorsRes = await apiRequest<MentorItem[]>('/api/hod/mentors');
          mentorsList = mentorsRes || [];
        } catch {
          // ignore
        }
      }

      setStudents(studentsList);
      setMentors(mentorsList);
      setSelectedStudentIds([]);

      // Load NAAC / Audit Reports
      try {
        const rData = await apiRequest<ReportData>('/api/hod/reports');
        setReportData(rData);
      } catch (rErr) {
        console.error('Reports load error:', rErr);
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
      showToast('error', err.message || 'Failed to load allocation and reports data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Filter effect for Allocation view
  useEffect(() => {
    let res = [...students];

    if (statusFilter === 'unallocated') {
      res = res.filter((s) => !s.mentor_id);
    } else if (statusFilter === 'allocated') {
      res = res.filter((s) => !!s.mentor_id);
    }

    if (selectedMentorFilter !== 'all') {
      res = res.filter((s) => s.mentor_id === selectedMentorFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      res = res.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.roll_no && s.roll_no.toLowerCase().includes(q)) ||
          (s.email && s.email.toLowerCase().includes(q))
      );
    }

    setFilteredStudents(res);
  }, [searchQuery, selectedMentorFilter, statusFilter, students]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // --- Mentor CRUD Handlers ---
  const handleOpenAddMentor = () => {
    setMentorModalMode('create');
    setSelectedMentorForEdit(null);
    setMentorFormData({
      name: '',
      email: '',
      designation: 'Assistant Professor',
      phone: '',
      office_location: '',
    });
    setShowMentorModal(true);
  };

  const handleOpenEditMentor = (mentor: MentorItem) => {
    setMentorModalMode('edit');
    setSelectedMentorForEdit(mentor);
    setMentorFormData({
      name: mentor.name,
      email: mentor.email,
      designation: mentor.designation || 'Assistant Professor',
      phone: mentor.phone || '',
      office_location: mentor.office_location || '',
    });
    setShowMentorModal(true);
  };

  const handleSaveMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentorFormData.name.trim() || !mentorFormData.email.trim()) {
      showToast('error', 'Faculty Name and Official Email are required.');
      return;
    }

    try {
      setIsSavingMentor(true);
      if (mentorModalMode === 'create') {
        await apiRequest('/api/hod/mentors', {
          method: 'POST',
          body: JSON.stringify(mentorFormData),
        });
        showToast('success', `Faculty mentor ${mentorFormData.name} created successfully.`);
      } else if (selectedMentorForEdit) {
        await apiRequest(`/api/hod/mentors/${selectedMentorForEdit.id}`, {
          method: 'PUT',
          body: JSON.stringify(mentorFormData),
        });
        showToast('success', `Faculty mentor ${mentorFormData.name} updated successfully.`);
      }
      setShowMentorModal(false);
      await loadAllData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save mentor record.');
    } finally {
      setIsSavingMentor(false);
    }
  };

  const handleDeleteMentorRequest = (mentor: MentorItem) => {
    const menteeCount = students.filter((s) => s.mentor_id === mentor.id).length;
    setDeleteTarget({
      type: 'mentor',
      id: mentor.id,
      name: mentor.name,
      extraInfo:
        menteeCount > 0
          ? `${menteeCount} currently assigned mentee(s) will be unallocated.`
          : 'No mentees are currently assigned to this faculty member.',
    });
    setShowDeleteConfirmModal(true);
  };

  // --- Student (Mentee) CRUD Handlers ---
  const handleOpenAddStudent = () => {
    setStudentModalMode('create');
    setSelectedStudentForEdit(null);
    setStudentFormData({
      name: '',
      roll_no: '',
      email: '',
      semester: 6,
      cgpa: 8.0,
      phone: '',
      mentor_id: '',
    });
    setShowStudentModal(true);
  };

  const handleOpenEditStudent = (student: StudentItem) => {
    setStudentModalMode('edit');
    setSelectedStudentForEdit(student);
    setStudentFormData({
      name: student.name,
      roll_no: student.roll_no,
      email: student.email,
      semester: student.semester || 6,
      cgpa: student.cgpa || 8.0,
      phone: student.phone || '',
      mentor_id: student.mentor_id || '',
    });
    setShowStudentModal(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !studentFormData.name.trim() ||
      !studentFormData.roll_no.trim() ||
      !studentFormData.email.trim()
    ) {
      showToast('error', 'Student Name, Roll Number, and Email are required.');
      return;
    }

    try {
      setIsSavingStudent(true);
      if (studentModalMode === 'create') {
        await apiRequest('/api/hod/students', {
          method: 'POST',
          body: JSON.stringify(studentFormData),
        });
        showToast('success', `Student ${studentFormData.name} (${studentFormData.roll_no}) enrolled successfully.`);
      } else if (selectedStudentForEdit) {
        await apiRequest(`/api/hod/students/${selectedStudentForEdit.id}`, {
          method: 'PUT',
          body: JSON.stringify(studentFormData),
        });
        showToast('success', `Student record for ${studentFormData.name} updated successfully.`);
      }
      setShowStudentModal(false);
      await loadAllData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save student record.');
    } finally {
      setIsSavingStudent(false);
    }
  };

  const handleDeleteStudentRequest = (student: StudentItem) => {
    setDeleteTarget({
      type: 'student',
      id: student.id,
      name: student.name,
      extraInfo: `Roll No: ${student.roll_no} • ${student.approved_points || 0} approved points. All associated submissions will be purged.`,
    });
    setShowDeleteConfirmModal(true);
  };

  // --- Confirm Delete Action ---
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      if (deleteTarget.type === 'mentor') {
        await apiRequest(`/api/hod/mentors/${deleteTarget.id}`, {
          method: 'DELETE',
        });
        showToast('success', `Faculty mentor ${deleteTarget.name} removed successfully.`);
      } else {
        await apiRequest(`/api/hod/students/${deleteTarget.id}`, {
          method: 'DELETE',
        });
        showToast('success', `Student ${deleteTarget.name} removed successfully.`);
      }
      setShowDeleteConfirmModal(false);
      setDeleteTarget(null);
      await loadAllData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete record.');
    } finally {
      setIsDeleting(false);
    }
  };

  // 1. Manual Single Reallocation
  const handleSingleReassign = async (studentId: string, studentName: string, newMentorId: string) => {
    try {
      const targetMentorId = newMentorId === 'unassign' ? '' : newMentorId;
      await apiRequest('/api/hod/allocate', {
        method: 'POST',
        body: JSON.stringify({
          student_id: studentId,
          mentor_id: targetMentorId || null,
        }),
      });

      const mentorObj = mentors.find((m) => m.id === targetMentorId);
      showToast(
        'success',
        targetMentorId
          ? `Allocated ${studentName} to ${mentorObj?.name || 'mentor'}.`
          : `Unassigned mentor for ${studentName}.`
      );

      await loadAllData();
    } catch (err: any) {
      console.error('Allocation error:', err);
      showToast('error', err.message || 'Failed to update mentor allocation.');
    }
  };

  // 2. Manual Batch Allocation
  const handleBatchAssign = async () => {
    if (selectedStudentIds.length === 0) {
      showToast('error', 'Please select at least one student.');
      return;
    }
    if (!batchMentorId) {
      showToast('error', 'Please select a faculty mentor to allocate.');
      return;
    }

    try {
      setIsBatchAssigning(true);
      const targetMentorId = batchMentorId === 'unassign' ? null : batchMentorId;
      await apiRequest('/api/hod/allocations', {
        method: 'POST',
        body: JSON.stringify({
          student_ids: selectedStudentIds,
          mentor_id: targetMentorId,
        }),
      });

      const mentorObj = mentors.find((m) => m.id === targetMentorId);
      showToast(
        'success',
        targetMentorId
          ? `Successfully allocated ${selectedStudentIds.length} students to ${mentorObj?.name || 'mentor'}.`
          : `Successfully unassigned ${selectedStudentIds.length} students.`
      );

      setSelectedStudentIds([]);
      setBatchMentorId('');
      await loadAllData();
    } catch (err: any) {
      console.error('Batch allocation error:', err);
      showToast('error', err.message || 'Failed to batch allocate students.');
    } finally {
      setIsBatchAssigning(false);
    }
  };

  // Toggle selection
  const handleToggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // CSV Parsing & Import
  const parseCSVContent = (content: string) => {
    setCsvError(null);
    try {
      const lines = content
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length <= 1) {
        setCsvError('CSV must contain a header row and at least one student record.');
        setParsedRows([]);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.replace(/["']/g, '').trim().toLowerCase());
      
      const nameIdx = headers.findIndex((h) => h.includes('name'));
      const rollIdx = headers.findIndex((h) => h.includes('roll') || h.includes('usn') || h.includes('reg'));
      const emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('mail'));
      const semIdx = headers.findIndex((h) => h.includes('sem'));
      const cgpaIdx = headers.findIndex((h) => h.includes('cgpa') || h.includes('gpa'));
      const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('mobile'));

      if (nameIdx === -1 && rollIdx === -1 && emailIdx === -1) {
        setCsvError('Could not identify student columns. Header must include Name, Roll_No, and Email.');
        setParsedRows([]);
        return;
      }

      const parsed: ParsedCSVStudent[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.replace(/^["']|["']$/g, '').trim());
        if (cols.length === 0 || !cols.some((c) => c.length > 0)) continue;

        const name = nameIdx !== -1 ? cols[nameIdx] : `Student ${i}`;
        const rollNo = rollIdx !== -1 ? cols[rollIdx] : `STU${Date.now().toString().slice(-4)}${i}`;
        const email = emailIdx !== -1 && cols[emailIdx] ? cols[emailIdx] : `${rollNo.toLowerCase()}@college.edu`;
        const sem = semIdx !== -1 && cols[semIdx] ? cols[semIdx] : '6';
        const cgpa = cgpaIdx !== -1 && cols[cgpaIdx] ? cols[cgpaIdx] : '8.2';
        const phone = phoneIdx !== -1 ? cols[phoneIdx] : '';

        if (name || rollNo || email) {
          parsed.push({
            name: name || `Student ${rollNo}`,
            roll_no: rollNo,
            email,
            semester: sem,
            cgpa,
            phone,
          });
        }
      }

      if (parsed.length === 0) {
        setCsvError('No valid student entries found in CSV.');
      } else {
        setParsedRows(parsed);
      }
    } catch (err: any) {
      setCsvError('Error parsing CSV file. Please verify comma separation.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvRawText(text);
      parseCSVContent(text);
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (parsedRows.length === 0) {
      setCsvError('No students to import.');
      return;
    }

    try {
      setIsImportingCSV(true);
      setCsvError(null);
      const res = await apiRequest<{ success: boolean; createdCount: number; updatedCount: number }>('/api/hod/import-students', {
        method: 'POST',
        body: JSON.stringify({ students: parsedRows }),
      });

      showToast(
        'success',
        `Successfully imported ${parsedRows.length} students from CSV (${res.createdCount} new registered, ${res.updatedCount} refreshed).`
      );

      setShowCSVModal(false);
      setCsvFile(null);
      setCsvRawText('');
      setParsedRows([]);
      await loadAllData();
    } catch (err: any) {
      setCsvError(err.message || 'Failed to import students.');
    } finally {
      setIsImportingCSV(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleContent = `name,roll_no,email,semester,cgpa,phone
Aarav Sharma,1MS21CS001,aarav.cs21@msrit.edu,6,8.85,+919876543210
Diya Patel,1MS21CS002,diya.cs21@msrit.edu,6,9.12,+919876543211
Rohan Verma,1MS21CS003,rohan.cs21@msrit.edu,6,7.95,+919876543212
Ananya Iyer,1MS21CS004,ananya.cs21@msrit.edu,6,8.70,+919876543213
Vikramaditya Rao,1MS21CS005,vikram.cs21@msrit.edu,6,8.40,+919876543214
Sneha Kulkarni,1MS21CS006,sneha.cs21@msrit.edu,6,9.30,+919876543215`;

    const blob = new Blob([sampleContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'creditz_student_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Smart Auto-Allocation
  const handleExecuteAutoAllocate = async () => {
    try {
      setIsAutoAllocating(true);
      let targetIds: string[] | undefined = undefined;
      let onlyUnallocated = true;

      if (autoScope === 'selected') {
        if (selectedStudentIds.length === 0) {
          showToast('error', 'Please select students first to use selected scope.');
          setIsAutoAllocating(false);
          return;
        }
        targetIds = selectedStudentIds;
      } else if (autoScope === 'all') {
        onlyUnallocated = false;
      } else {
        onlyUnallocated = true;
      }

      const res = await apiRequest<{ success: boolean; allocatedCount: number }>('/api/hod/auto-allocate', {
        method: 'POST',
        body: JSON.stringify({
          method: autoMethod,
          student_ids: targetIds,
          only_unallocated: onlyUnallocated,
        }),
      });

      showToast(
        'success',
        `Auto-allocation complete! ${res.allocatedCount} students evenly allotted to ${mentors.length} faculty mentors.`
      );

      setShowAutoAllocateModal(false);
      setSelectedStudentIds([]);
      await loadAllData();
    } catch (err: any) {
      showToast('error', err.message || 'Auto-allocation failed.');
    } finally {
      setIsAutoAllocating(false);
    }
  };

  // Export Mentor Details CSV
  const handleExportMentorsCSV = () => {
    if (!mentors || mentors.length === 0) {
      showToast('error', 'No faculty mentor records available to export.');
      return;
    }

    const headers = [
      'Mentor ID',
      'Mentor Name',
      'Email Address',
      'Department',
      'Designation',
      'Assigned Mentees Count',
      'Advisory Capacity',
    ];

    const rows = mentors.map((m) => {
      const menteeCount = students.filter((s) => s.mentor_id === m.id).length;
      return [
        m.id,
        `"${m.name}"`,
        m.email,
        '"Computer Science and Engineering"',
        `"${m.designation || 'Faculty Mentor'}"`,
        menteeCount,
        '15 Students',
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `CSE_Faculty_Mentors_Roster_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Mentor details CSV exported successfully.');
  };

  // Export Mentee Details CSV
  const handleExportMenteesCSV = () => {
    const dataSource = reportData?.students || students;
    if (!dataSource || dataSource.length === 0) {
      showToast('error', 'No mentee student records available to export.');
      return;
    }

    const headers = [
      'Student ID',
      'Roll Number',
      'Student Name',
      'Email Address',
      'Department',
      'Semester',
      'CGPA',
      'Assigned Mentor ID',
      'Assigned Mentor Name',
      'Mentor Email',
      'Approved Activity Points',
      'Pending Submissions Count',
      'Degree Clearance Status',
      'Accreditation Milestone',
    ];

    const rows = dataSource.map((s: any) => {
      const points = s.approved_points || 0;
      const isCleared = points >= 200;
      let classification = 'Action Required (<100)';
      if (points >= 200) classification = 'Degree Cleared (200+)';
      else if (points >= 150) classification = 'Gold Milestone (150-199)';
      else if (points >= 100) classification = 'Silver Milestone (100-149)';

      return [
        s.id,
        s.roll_no,
        `"${s.name}"`,
        s.email,
        '"Computer Science and Engineering"',
        s.semester || 6,
        s.cgpa || 8.0,
        s.mentor_id || 'UNASSIGNED',
        `"${s.mentor_name || 'Unassigned'}"`,
        s.mentor_email || '',
        points,
        s.pending_submissions || 0,
        isCleared ? 'CLEARED' : 'IN_PROGRESS',
        `"${classification}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `CSE_Mentees_Roster_Details_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Mentees details CSV exported successfully.');
  };

  // Export Comprehensive Audit CSV
  const handleExportFullCSV = () => {
    handleExportMenteesCSV();
  };

  const handlePrint = () => {
    window.print();
  };

  const unallocatedCount = students.filter((s) => !s.mentor_id).length;
  const allocatedCount = students.filter((s) => !!s.mentor_id).length;

  const clearance_summary = reportData?.clearance_summary || {
    cleared: students.filter((s) => (s.approved_points || 0) >= 200).length,
    near_completion: students.filter((s) => (s.approved_points || 0) >= 150 && (s.approved_points || 0) < 200).length,
    in_progress: students.filter((s) => (s.approved_points || 0) >= 100 && (s.approved_points || 0) < 150).length,
    at_risk: students.filter((s) => (s.approved_points || 0) < 100).length,
  };

  const submissions = reportData?.submissions || [];
  const filteredSubmissions = submissions.filter((s) => {
    const q = auditSearchQuery.toLowerCase();
    const matchesSearch =
      !auditSearchQuery.trim() ||
      (s.student_name && s.student_name.toLowerCase().includes(q)) ||
      (s.student_roll_no && s.student_roll_no.toLowerCase().includes(q)) ||
      s.activity_title.toLowerCase().includes(q) ||
      (s.category_name && s.category_name.toLowerCase().includes(q));

    const matchesCategory =
      selectedCategoryFilter === 'all' || s.category_name === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4 sm:space-y-5 pb-10">
      {/* 1. Header Banner & Global Actions */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-slate-900 text-white">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Mentee Allocation & Report
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  NAAC / NBA Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Faculty workload allocation, CSV student roster ingestion, and accreditation compliance audit reports.
              </p>
            </div>
          </div>
        </div>

        {/* Global Actions Toolbar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Add Mentee Student */}
          <button
            type="button"
            onClick={handleOpenAddStudent}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>

          {/* Add Faculty Mentor */}
          <button
            type="button"
            onClick={handleOpenAddMentor}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-purple-600" />
            <span>Add Faculty Mentor</span>
          </button>

          {/* Download Mentors CSV */}
          <button
            type="button"
            onClick={handleExportMentorsCSV}
            title="Download Mentor Details CSV"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-purple-600" />
            <span>Mentors CSV</span>
          </button>

          {/* Download Mentees CSV */}
          <button
            type="button"
            onClick={handleExportMenteesCSV}
            title="Download Mentees Details CSV"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Mentees CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            title="Print Official Dossier"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setParsedRows([]);
              setCsvFile(null);
              setCsvError(null);
              setShowCSVModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/90 rounded-xl transition cursor-pointer shadow-2xs"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Upload Student CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAutoAllocateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl transition cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Auto-Allot Students</span>
          </button>

          <button
            type="button"
            onClick={loadAllData}
            title="Refresh All Data"
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between shadow-xs transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : notification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-indigo-50 border-indigo-200 text-indigo-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            )}
            <span className="font-semibold">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-500 hover:text-slate-700 font-bold p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Sub-View Navigation Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200/90 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('allocation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'allocation'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Mentee Allocation Matrix</span>
          <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
            {students.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('mentors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'mentors'
              ? 'bg-purple-900 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-purple-50 hover:text-purple-900'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-purple-400" />
          <span>Faculty Mentors Directory</span>
          <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-900 text-[10px]">
            {mentors.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('naac-summary')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'naac-summary'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>NAAC / NBA Accreditation Summary</span>
          <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[10px]">
            {clearance_summary.cleared} Cleared
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('audit-ledger')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'audit-ledger'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
          <span>Submission Audit Ledger</span>
          <span className="px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-800 text-[10px]">
            {submissions.length}
          </span>
        </button>
      </div>

      {/* VIEW 1: MENTEE ALLOCATION MATRIX */}
      {activeSubTab === 'allocation' && (
        <div className="space-y-4">
          {/* Faculty Mentors Cards */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  <span>Department Faculty Mentors</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Select a faculty mentor card to filter assigned students below.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleOpenAddMentor}
                  className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-purple-600" />
                  <span>Add Mentor</span>
                </button>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-bold">
                  {mentors.length} Faculty Mentors
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold">
                  {allocatedCount} Allocated
                </span>
                {unallocatedCount > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-bold flex items-center gap-1 animate-pulse">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    {unallocatedCount} Pending Allotment
                  </span>
                )}
              </div>
            </div>

            {/* Mentor Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {mentors.map((m) => {
                const menteeCount = students.filter((s) => s.mentor_id === m.id).length;
                const isSelected = selectedMentorFilter === m.id;
                const isHeavyLoad = menteeCount >= 10;

                return (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-xl border transition relative group ${
                      isSelected
                        ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-400/50 shadow-xs'
                        : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200/90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div
                        onClick={() => setSelectedMentorFilter(isSelected ? 'all' : m.id)}
                        className="min-w-0 flex-1 cursor-pointer"
                      >
                        <div className="font-bold text-xs text-slate-900 truncate flex items-center gap-1" title={m.name}>
                          <span>{m.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate" title={m.email}>
                          {m.email}
                        </div>
                        {m.designation && (
                          <div className="text-[9px] text-purple-700 font-medium truncate mt-0.5">
                            {m.designation}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                            isHeavyLoad
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-purple-100 text-purple-800 border-purple-200'
                          }`}
                        >
                          {menteeCount} Mentees
                        </span>

                        {/* Quick Mentor Actions */}
                        <div className="flex items-center gap-1 pt-1 opacity-80 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditMentor(m);
                            }}
                            title="Edit Mentor Details"
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMentorRequest(m);
                            }}
                            title="Delete Mentor"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={() => setSelectedMentorFilter(isSelected ? 'all' : m.id)}
                      className="space-y-1 cursor-pointer"
                    >
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Advisory Load</span>
                        <span className="font-medium">{Math.min(100, Math.round((menteeCount / 12) * 100))}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isHeavyLoad ? 'bg-amber-500' : 'bg-purple-600'
                          }`}
                          style={{ width: `${Math.min(100, (menteeCount / 12) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {/* Table Header Controls */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200/90 bg-slate-50/50 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                      statusFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All Students ({students.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter('unallocated')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      statusFilter === 'unallocated'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    <span>Unallocated</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold">
                      {unallocatedCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter('allocated')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                      statusFilter === 'allocated'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Allocated ({allocatedCount})
                  </button>
                </div>

                {/* Search, Mentor Filter & Add Student */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full sm:w-60">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search name, roll no, email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200/90 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white outline-hidden"
                    />
                  </div>

                  <select
                    value={selectedMentorFilter}
                    onChange={(e) => setSelectedMentorFilter(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-xl border border-slate-200/90 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-700 font-medium cursor-pointer"
                  >
                    <option value="all">Filter by Mentor (All)</option>
                    {mentors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleOpenAddStudent}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Mentee</span>
                  </button>
                </div>
              </div>

              {/* Multi-Select Batch Action Bar */}
              {selectedStudentIds.length > 0 && (
                <div className="p-3 bg-indigo-50/90 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-950">
                      {selectedStudentIds.length} student{selectedStudentIds.length > 1 ? 's' : ''} selected
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={batchMentorId}
                      onChange={(e) => setBatchMentorId(e.target.value)}
                      className="text-xs px-3 py-1.5 rounded-xl border border-indigo-300 focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 font-medium"
                    >
                      <option value="">Choose Mentor for Selected...</option>
                      {mentors.map((m) => (
                        <option key={m.id} value={m.id}>
                          Assign to: {m.name}
                        </option>
                      ))}
                      <option value="unassign">Unassign / Clear Mentor</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleBatchAssign}
                      disabled={isBatchAssigning || !batchMentorId}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      {isBatchAssigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                      <span>Apply to {selectedStudentIds.length} Students</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedStudentIds([])}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold text-[10px]">
                  <tr>
                    <th className="py-3 px-3.5 w-10 text-center">
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="cursor-pointer text-slate-500 hover:text-slate-900"
                        title={selectedStudentIds.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                      >
                        {filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-3.5">Student Information</th>
                    <th className="py-3 px-3.5">Roll Number</th>
                    <th className="py-3 px-3.5">Sem & CGPA</th>
                    <th className="py-3 px-3.5">200-Pt Progress</th>
                    <th className="py-3 px-3.5">Current Mentor</th>
                    <th className="py-3 px-3.5 text-center">Manual Allocation</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                        <AlertCircle className="w-6 h-6 mx-auto text-slate-300 mb-2" />
                        No students match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => {
                      const isSelected = selectedStudentIds.includes(s.id);
                      const isAllocated = !!s.mentor_id;

                      return (
                        <tr
                          key={s.id}
                          className={`hover:bg-slate-50/80 transition ${
                            isSelected ? 'bg-indigo-50/40' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleStudent(s.id)}
                              className="cursor-pointer text-slate-400 hover:text-indigo-600"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          <td className="py-2.5 px-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {s.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                  <span>{s.name}</span>
                                  {s.isNewFromCSV && (
                                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">
                                      CSV
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400">{s.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-800 text-xs">
                            {s.roll_no}
                          </td>

                          <td className="py-2.5 px-3.5">
                            <div className="text-slate-800 font-medium text-xs">Sem {s.semester || 6}</div>
                            <div className="text-[10px] text-amber-700 font-bold">
                              CGPA: {s.cgpa || 8.0}
                            </div>
                          </td>

                          <td className="py-2.5 px-3.5">
                            <span className="font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 text-xs">
                              {s.approved_points || 0} / 200p
                            </span>
                          </td>

                          <td className="py-2.5 px-3.5">
                            {isAllocated ? (
                              <span className="font-semibold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 text-[11px] inline-flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-purple-600" />
                                <span>{s.mentor_name || 'Assigned'}</span>
                              </span>
                            ) : (
                              <span className="font-semibold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-[11px] inline-flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                <span>Unassigned</span>
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3.5 text-center">
                            <select
                              value={s.mentor_id || ''}
                              onChange={(e) => handleSingleReassign(s.id, s.name, e.target.value)}
                              className="text-xs px-2.5 py-1.2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-medium text-slate-800 cursor-pointer shadow-2xs transition hover:border-indigo-400"
                            >
                              <option value="">Select Mentor...</option>
                              {mentors.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name}
                                </option>
                              ))}
                              {isAllocated && <option value="unassign">Unassign</option>}
                            </select>
                          </td>

                          <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditStudent(s)}
                                title="Edit Mentee Student"
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteStudentRequest(s)}
                                title="Delete Mentee Student"
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200/90 text-slate-500 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>
                Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> students
              </span>
              <div className="flex items-center gap-3 font-medium">
                <span className="text-emerald-700">● {allocatedCount} Allocated</span>
                <span className="text-amber-700">● {unallocatedCount} Pending Allotment</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: FACULTY MENTORS DIRECTORY & WORKLOAD */}
      {activeSubTab === 'mentors' && (
        <div className="space-y-4">
          {/* Mentors Header & Stats */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                  <span>Department Faculty Mentors Directory</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage faculty advisory profiles, designations, contact numbers, and monitor individual mentoring loads.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportMentorsCSV}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-purple-600" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddMentor}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Faculty Mentor</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Total Mentors</div>
                <div className="text-2xl font-bold font-mono text-purple-950 mt-0.5">{mentors.length}</div>
                <div className="text-[10px] text-purple-700 mt-0.5">Active CSE Faculty</div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Total Mentees Assigned</div>
                <div className="text-2xl font-bold font-mono text-indigo-950 mt-0.5">{allocatedCount}</div>
                <div className="text-[10px] text-indigo-700 mt-0.5">Across all faculty</div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Avg Mentees / Mentor</div>
                <div className="text-2xl font-bold font-mono text-emerald-950 mt-0.5">
                  {mentors.length > 0 ? (allocatedCount / mentors.length).toFixed(1) : 0}
                </div>
                <div className="text-[10px] text-emerald-700 mt-0.5">Target: 12 - 15 max</div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Unassigned Students</div>
                <div className="text-2xl font-bold font-mono text-amber-950 mt-0.5">{unallocatedCount}</div>
                <div className="text-[10px] text-amber-800 mt-0.5">Awaiting allocation</div>
              </div>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search faculty by name, email, designation, office..."
                value={mentorSearchQuery}
                onChange={(e) => setMentorSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200/90 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white outline-hidden"
              />
            </div>
          </div>

          {/* Mentors Detailed Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {mentors
              .filter((m) => {
                if (!mentorSearchQuery.trim()) return true;
                const q = mentorSearchQuery.toLowerCase();
                return (
                  m.name.toLowerCase().includes(q) ||
                  m.email.toLowerCase().includes(q) ||
                  (m.designation && m.designation.toLowerCase().includes(q)) ||
                  (m.office_location && m.office_location.toLowerCase().includes(q))
                );
              })
              .map((m) => {
                const assignedMentees = students.filter((s) => s.mentor_id === m.id);
                const menteeCount = assignedMentees.length;
                const isHeavyLoad = menteeCount >= 10;

                return (
                  <div
                    key={m.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex flex-col justify-between space-y-3.5 hover:border-purple-300 transition"
                  >
                    <div>
                      {/* Top Mentor Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 text-sm truncate" title={m.name}>
                              {m.name}
                            </h3>
                            <span className="inline-block text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 mt-0.5">
                              {m.designation || 'Faculty Mentor'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditMentor(m)}
                            title="Edit Faculty Details"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMentorRequest(m)}
                            title="Delete Faculty Mentor"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Contact & Location Info */}
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate text-slate-700 font-medium">{m.email}</span>
                        </div>
                        {m.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-slate-700">{m.phone}</span>
                          </div>
                        )}
                        {m.office_location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-slate-700">{m.office_location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Advisory Capacity Bar & Action */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Assigned Mentees</span>
                        <span className="font-bold font-mono text-purple-900">
                          {menteeCount} / 12 Capacity
                        </span>
                      </div>

                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isHeavyLoad ? 'bg-amber-500' : 'bg-purple-600'
                          }`}
                          style={{ width: `${Math.min(100, (menteeCount / 12) * 100)}%` }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMentorFilter(m.id);
                          setActiveSubTab('allocation');
                        }}
                        className="w-full py-1.5 text-center text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Users className="w-3.5 h-3.5 text-purple-600" />
                        <span>View Assigned Students ({menteeCount})</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* VIEW 2: NAAC / NBA ACCREDITATION SUMMARY */}
      {activeSubTab === 'naac-summary' && (
        <div className="space-y-4">
          {/* Degree Clearance Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Degree Cleared (200p)
                </span>
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-600 font-mono">
                {clearance_summary.cleared} Students
              </div>
              <div className="text-[10px] text-slate-500">
                100% Activity Points requirement fulfilled
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Near Completion (150-199)
                </span>
                <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-indigo-600 font-mono">
                {clearance_summary.near_completion} Students
              </div>
              <div className="text-[10px] text-slate-500">
                Gold tier milestone reached
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  On Track (100-149)
                </span>
                <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600 font-mono">
                {clearance_summary.in_progress} Students
              </div>
              <div className="text-[10px] text-slate-500">
                Silver tier milestone reached
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Action Required (&lt;100)
                </span>
                <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-amber-600 font-mono">
                {clearance_summary.at_risk} Students
              </div>
              <div className="text-[10px] text-slate-500">
                Assigned mentors flagged for follow-up
              </div>
            </div>
          </div>

          {/* Student Compliance Clearance Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Student Degree Clearance Compliance Roster
                </h3>
                <p className="text-[11px] text-slate-500">
                  Official status matrix mapped against NAAC / NBA student progression accreditation metrics.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportFullCSV}
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Compliance CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold text-[10px]">
                  <tr>
                    <th className="py-3 px-3.5">Roll Number</th>
                    <th className="py-3 px-3.5">Student Name</th>
                    <th className="py-3 px-3.5">Semester & CGPA</th>
                    <th className="py-3 px-3.5">Assigned Mentor</th>
                    <th className="py-3 px-3.5">Approved Points</th>
                    <th className="py-3 px-3.5">Progress %</th>
                    <th className="py-3 px-3.5 text-center">NAAC Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st) => {
                    const pts = st.approved_points || 0;
                    const isCleared = pts >= 200;
                    const percent = Math.min(100, Math.round((pts / 200) * 100));

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900">{st.roll_no}</td>
                        <td className="py-2.5 px-3.5 font-semibold text-slate-800">{st.name}</td>
                        <td className="py-2.5 px-3.5 text-slate-600">
                          Sem {st.semester || 6} • CGPA {st.cgpa || 8.0}
                        </td>
                        <td className="py-2.5 px-3.5 text-purple-900 font-medium">
                          {st.mentor_name || <span className="text-amber-600 font-bold">Unassigned</span>}
                        </td>
                        <td className="py-2.5 px-3.5 font-mono font-bold text-indigo-600">
                          {pts} / 200p
                        </td>
                        <td className="py-2.5 px-3.5">
                          <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isCleared ? 'bg-emerald-500' : pts >= 100 ? 'bg-indigo-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          {isCleared ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              CLEARED
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              IN PROGRESS
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: SUBMISSION AUDIT LEDGER */}
      {activeSubTab === 'audit-ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-3 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                <span>Department-Wide Submission Audit Ledger</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Immutable record of verified certificates stamped with cryptographic integrity SHA256 and schema version snapshot.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search student, activity, domain..."
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Student & Roll No</th>
                  <th className="py-2.5 px-3">Activity & Evidence Name</th>
                  <th className="py-2.5 px-3">Category Domain</th>
                  <th className="py-2.5 px-3">Snapshot</th>
                  <th className="py-2.5 px-3">Reviewer & Status</th>
                  <th className="py-2.5 px-3 text-right">Points</th>
                  <th className="py-2.5 px-3 text-center">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                      No submission audit records match your query.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 text-xs">{sub.student_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{sub.student_roll_no}</div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 text-xs">{sub.activity_title}</div>
                        <div className="text-[10px] text-slate-500">{sub.schema_activity_name}</div>
                      </td>

                      <td className="py-2.5 px-3 font-medium text-slate-700 text-xs">
                        {sub.category_name}
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-bold">
                          v{sub.schema_version_snapshot}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="space-y-0.5">
                          <StatusBadge status={sub.status} />
                          {sub.reviewer_name && (
                            <div className="text-[10px] text-slate-400 font-medium">
                              {sub.reviewer_name}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-bold text-xs">
                        <span className={sub.status === 'approved' ? 'text-emerald-600' : 'text-slate-400'}>
                          {sub.status === 'approved' ? `+${sub.points_awarded}` : `+${sub.base_points || 20}`}p
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setIsViewerOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. CSV Upload Modal */}
      {showCSVModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <FileSpreadsheet className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Import Students via CSV</h3>
                  <p className="text-xs text-slate-500">
                    Upload your class roster to display students and allocate them to mentors.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCSVModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-2xl p-6 text-center cursor-pointer transition"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,text/csv,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                <p className="font-bold text-slate-800 text-xs">
                  {csvFile ? csvFile.name : 'Click to select or drag and drop your CSV file'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Required columns: <strong>name, roll_no, email</strong> (optional: semester, cgpa, phone)
                </p>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-slate-600">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>Need an example file format?</span>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleCSV}
                  className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Or Paste Raw CSV Data:</label>
                <textarea
                  rows={4}
                  value={csvRawText}
                  onChange={(e) => {
                    setCsvRawText(e.target.value);
                    parseCSVContent(e.target.value);
                  }}
                  placeholder="name,roll_no,email,semester,cgpa&#10;Rahul Roy,1MS21CS010,rahul@college.edu,6,8.5"
                  className="w-full font-mono text-[11px] p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-hidden bg-slate-50"
                />
              </div>

              {csvError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{csvError}</span>
                </div>
              )}

              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      Parsed Preview ({parsedRows.length} students found):
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Ready to Import
                    </span>
                  </div>

                  <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                        <tr>
                          <th className="p-2">Name</th>
                          <th className="p-2">Roll No</th>
                          <th className="p-2">Email</th>
                          <th className="p-2">Sem</th>
                          <th className="p-2">CGPA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-medium text-slate-900">{row.name}</td>
                            <td className="p-2 font-mono text-slate-700">{row.roll_no}</td>
                            <td className="p-2 text-slate-500">{row.email}</td>
                            <td className="p-2 text-slate-700">{row.semester}</td>
                            <td className="p-2 text-slate-700">{row.cgpa}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedRows.length > 10 && (
                    <p className="text-[10px] text-slate-400 italic text-center">
                      Showing first 10 of {parsedRows.length} students...
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCSVModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={isImportingCSV || parsedRows.length === 0}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {isImportingCSV ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Import {parsedRows.length > 0 ? `${parsedRows.length} Students` : ''}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Auto-Allocation Modal */}
      {showAutoAllocateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Auto-Allocate Students to Mentors
                  </h3>
                  <p className="text-xs text-slate-500">
                    Automatically balance and assign students across available faculty mentors.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAutoAllocateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 text-xs">
              <div className="space-y-2">
                <label className="font-bold text-slate-800">1. Select Target Students Scope:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAutoScope('unallocated')}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition cursor-pointer ${
                      autoScope === 'unallocated'
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-900 ring-1 ring-indigo-400'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>Unallocated</div>
                    <div className="text-[10px] text-amber-700 font-bold">({unallocatedCount} students)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAutoScope('all')}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition cursor-pointer ${
                      autoScope === 'all'
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-900 ring-1 ring-indigo-400'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>All Students</div>
                    <div className="text-[10px] text-slate-500">({students.length} students)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAutoScope('selected')}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition cursor-pointer ${
                      autoScope === 'selected'
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-900 ring-1 ring-indigo-400'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>Selected</div>
                    <div className="text-[10px] text-indigo-600 font-bold">({selectedStudentIds.length} chosen)</div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-800">2. Choose Allocation Strategy:</label>
                <div className="space-y-2">
                  <label
                    onClick={() => setAutoMethod('balanced')}
                    className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                      autoMethod === 'balanced'
                        ? 'bg-indigo-50/70 border-indigo-400 ring-1 ring-indigo-400 text-indigo-950'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="autoMethod"
                      checked={autoMethod === 'balanced'}
                      onChange={() => setAutoMethod('balanced')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-bold text-xs">Balanced Load Balancing (Recommended)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Equally distributes students to mentors with the least active mentees so faculty workloads remain balanced.
                      </div>
                    </div>
                  </label>

                  <label
                    onClick={() => setAutoMethod('roll_range')}
                    className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                      autoMethod === 'roll_range'
                        ? 'bg-indigo-50/70 border-indigo-400 ring-1 ring-indigo-400 text-indigo-950'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="autoMethod"
                      checked={autoMethod === 'roll_range'}
                      onChange={() => setAutoMethod('roll_range')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-bold text-xs">Roll Number Range Split</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Sorts students by Roll Number/USN and assigns contiguous batch blocks equally across mentors.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-slate-600">
                <span>Faculty Mentors Pool:</span>
                <span className="font-bold text-slate-900">{mentors.length} Mentors Available</span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowAutoAllocateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteAutoAllocate}
                disabled={isAutoAllocating || (autoScope === 'selected' && selectedStudentIds.length === 0)}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {isAutoAllocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Execute Auto-Allocation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Add/Edit Faculty Mentor Modal */}
      {showMentorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-purple-50/50">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <GraduationCap className="w-5 h-5 text-purple-700" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {mentorModalMode === 'create' ? 'Add New Faculty Mentor' : 'Edit Faculty Mentor Details'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {mentorModalMode === 'create'
                      ? 'Register a faculty member as an official academic mentor.'
                      : `Update advisory profile for ${selectedMentorForEdit?.name || 'Faculty'}.`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMentorModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMentor}>
              <div className="p-4 sm:p-5 space-y-4 text-xs">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1">
                    <span>Full Name</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Sharma"
                    value={mentorFormData.name}
                    onChange={(e) => setMentorFormData({ ...mentorFormData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1">
                    <span>Official Email Address</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rajesh.sharma@university.edu"
                    value={mentorFormData.email}
                    onChange={(e) => setMentorFormData({ ...mentorFormData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                  />
                </div>

                {/* Academic Designation */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">Academic Designation</label>
                  <select
                    value={mentorFormData.designation}
                    onChange={(e) => setMentorFormData({ ...mentorFormData, designation: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white cursor-pointer"
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                    <option value="Department Chair">Department Chair</option>
                    <option value="Senior Lecturer">Senior Lecturer</option>
                    <option value="Visiting Faculty">Visiting Faculty</option>
                  </select>
                </div>

                {/* Phone & Office Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800">Phone / Extension</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={mentorFormData.phone}
                      onChange={(e) => setMentorFormData({ ...mentorFormData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800">Cabin / Office Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Academic Block-2, Room 405"
                      value={mentorFormData.office_location}
                      onChange={(e) => setMentorFormData({ ...mentorFormData, office_location: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowMentorModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingMentor}
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  {isSavingMentor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{mentorModalMode === 'create' ? 'Add Faculty Mentor' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Add/Edit Mentee Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-indigo-50/50">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <UserPlus className="w-5 h-5 text-indigo-700" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {studentModalMode === 'create' ? 'Enroll New Mentee Student' : 'Edit Mentee Student Record'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {studentModalMode === 'create'
                      ? 'Add an individual student to the department roster.'
                      : `Update profile, academic scores, and mentor assignment for ${selectedStudentForEdit?.name || 'Student'}.`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStudentModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent}>
              <div className="p-4 sm:p-5 space-y-4 text-xs">
                {/* Full Name & Roll No */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 flex items-center gap-1">
                      <span>Full Name</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={studentFormData.name}
                      onChange={(e) => setStudentFormData({ ...studentFormData, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 flex items-center gap-1">
                      <span>Roll Number / USN</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1MS21CS099"
                      value={studentFormData.roll_no}
                      onChange={(e) => setStudentFormData({ ...studentFormData, roll_no: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 flex items-center gap-1">
                      <span>Student Email</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. priya.s@student.edu"
                      value={studentFormData.email}
                      onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800">Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 91234 56789"
                      value={studentFormData.phone}
                      onChange={(e) => setStudentFormData({ ...studentFormData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    />
                  </div>
                </div>

                {/* Semester & CGPA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800">Current Semester</label>
                    <select
                      value={studentFormData.semester}
                      onChange={(e) => setStudentFormData({ ...studentFormData, semester: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800">Cumulative GPA (CGPA)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      placeholder="e.g. 8.45"
                      value={studentFormData.cgpa}
                      onChange={(e) => setStudentFormData({ ...studentFormData, cgpa: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    />
                  </div>
                </div>

                {/* Assigned Faculty Mentor */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">Assigned Faculty Mentor</label>
                  <select
                    value={studentFormData.mentor_id}
                    onChange={(e) => setStudentFormData({ ...studentFormData, mentor_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white cursor-pointer"
                  >
                    <option value="">Unassigned (No mentor allocated yet)</option>
                    {mentors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.designation || 'Faculty'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingStudent}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  {isSavingStudent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{studentModalMode === 'create' ? 'Enroll Mentee' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Delete Confirmation Modal */}
      {showDeleteConfirmModal && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-rose-200 w-full max-w-md overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-rose-100 bg-rose-50/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Confirm Deletion
                </h3>
                <p className="text-xs text-rose-700">
                  Delete {deleteTarget.type === 'mentor' ? 'Faculty Mentor' : 'Mentee Student'} Record
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-3 text-xs text-slate-600">
              <p>
                Are you sure you want to permanently remove <strong>{deleteTarget.name}</strong> from the system?
              </p>
              {deleteTarget.type === 'mentor' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Mentee Reassignment Notice</span>
                  </div>
                  <p className="text-[11px]">
                    Any students currently allocated to this faculty mentor will automatically become unassigned.
                  </p>
                </div>
              )}
              {deleteTarget.type === 'student' && (
                <p className="text-slate-500 text-[11px]">
                  This will remove the student profile, activity point records, and all submission history from the database.
                </p>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. PDF / Evidence Viewer Modal */}
      <PDFViewerModal
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setSelectedSubmission(null);
        }}
        submission={selectedSubmission}
      />
    </div>
  );
};
