import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../../components/common/Badge';
import { apiRequest } from '../../lib/api';
import {
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  Award,
  Edit3,
  Check,
  X,
  MapPin,
  Briefcase,
  ShieldCheck,
  ArrowLeft,
  Camera,
  QrCode,
  Copy,
  Eye,
  Loader2,
  Upload,
} from 'lucide-react';

interface ProfilePageProps {
  onBack?: () => void;
}

type PerspectivePOV = 'self' | 'evaluator' | 'accreditation' | 'digital_id';

export const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const { user, refreshUser, updateAvatar } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Perspective POV state
  const [activePOV, setActivePOV] = useState<PerspectivePOV>('self');
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form fields
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '+91 98450 12345');
  const [bio, setBio] = useState(
    user?.bio ||
      (user?.role === 'student'
        ? 'Computer Science Undergraduate focused on Cloud Computing, Full-Stack Architecture, and competitive hackathons.'
        : user?.role === 'mentor'
        ? 'Senior Faculty guiding undergraduate scholars in core technical domains and activity points certification.'
        : 'Department Head leading academic operations, NBA/NAAC accreditation compliance, and curriculum.')
  );
  const [designation, setDesignation] = useState(
    user?.designation ||
      (user?.role === 'student'
        ? 'B.Tech CSE Scholar'
        : user?.role === 'mentor'
        ? 'Associate Professor'
        : 'Professor & Head of Department')
  );
  const [officeLocation, setOfficeLocation] = useState(
    user?.office_location ||
      (user?.role === 'student'
        ? 'Academic Block 3, Room CSE-6A'
        : user?.role === 'mentor'
        ? 'Faculty Wing B, Cabin 204'
        : 'Administration Suite, Room 101')
  );
  const [avatar, setAvatar] = useState(
    user?.avatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
  );

  // Keep state in sync with user if user updates
  useEffect(() => {
    if (user?.avatar) {
      setAvatar(user.avatar);
    }
  }, [user?.avatar]);

  if (!user) return null;

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, JPEG, WEBP, etc.)');
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }

    setIsUploadingAvatar(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        setAvatar(base64);

        // Directly persist to user profile
        await updateAvatar(base64);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to update profile photo.');
      } finally {
        setIsUploadingAvatar(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      setIsUploadingAvatar(false);
      setErrorMessage('Could not read image file.');
    };

    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      await apiRequest('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          bio: bio.trim(),
          designation: designation.trim(),
          office_location: officeLocation.trim(),
          avatar,
        }),
      });

      await refreshUser();
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user.name);
    setPhone(user.phone || '+91 98450 12345');
    setBio(user.bio || '');
    setDesignation(user.designation || '');
    setOfficeLocation(user.office_location || '');
    setAvatar(user.avatar || '');
    setIsEditing(false);
    setErrorMessage(null);
  };

  const handleCopyVerificationHash = () => {
    const hash = `NITTE-SEC-${user.id.toUpperCase()}-VERIFIED-${user.role.toUpperCase()}`;
    navigator.clipboard.writeText(hash);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // SVG QR Code Simulation
  const renderQRCodeSVG = () => (
    <svg className="w-20 h-20 sm:w-28 sm:h-28 bg-white p-1.5 sm:p-2 rounded-xl border border-slate-200 shadow-xs" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="white" />
      {/* Corner position markers */}
      <rect x="10" y="10" width="24" height="24" fill="#0f172a" rx="3" />
      <rect x="15" y="15" width="14" height="14" fill="white" />
      <rect x="18" y="18" width="8" height="8" fill="#0f172a" />

      <rect x="66" y="10" width="24" height="24" fill="#0f172a" rx="3" />
      <rect x="71" y="15" width="14" height="14" fill="white" />
      <rect x="74" y="18" width="8" height="8" fill="#0f172a" />

      <rect x="10" y="66" width="24" height="24" fill="#0f172a" rx="3" />
      <rect x="15" y="71" width="14" height="14" fill="white" />
      <rect x="18" y="74" width="8" height="8" fill="#0f172a" />

      {/* Decorative matrix bits */}
      <rect x="42" y="15" width="6" height="6" fill="#4f46e5" />
      <rect x="52" y="15" width="6" height="6" fill="#0f172a" />
      <rect x="42" y="27" width="6" height="6" fill="#0f172a" />
      <rect x="52" y="27" width="6" height="6" fill="#4f46e5" />

      <rect x="42" y="42" width="16" height="16" fill="#0f172a" rx="2" />
      <rect x="46" y="46" width="8" height="8" fill="#4f46e5" />

      <rect x="15" y="42" width="6" height="6" fill="#0f172a" />
      <rect x="27" y="42" width="6" height="6" fill="#4f46e5" />
      <rect x="21" y="52" width="6" height="6" fill="#0f172a" />

      <rect x="70" y="42" width="6" height="6" fill="#4f46e5" />
      <rect x="80" y="42" width="6" height="6" fill="#0f172a" />
      <rect x="75" y="52" width="6" height="6" fill="#0f172a" />

      <rect x="42" y="70" width="6" height="6" fill="#0f172a" />
      <rect x="52" y="70" width="6" height="6" fill="#4f46e5" />
      <rect x="42" y="80" width="6" height="6" fill="#4f46e5" />
      <rect x="52" y="80" width="6" height="6" fill="#0f172a" />

      <rect x="70" y="70" width="6" height="6" fill="#0f172a" />
      <rect x="80" y="70" width="6" height="6" fill="#4f46e5" />
      <rect x="70" y="80" width="16" height="6" fill="#0f172a" />
    </svg>
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-12 transition-all min-w-0">
      {/* Hidden File Input for Profile Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        className="hidden"
        onChange={handleAvatarFileSelect}
        aria-label="Choose profile photo"
      />

      {/* Top Header & Perspective Controls */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer shrink-0 min-h-[40px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight truncate">
                Profile & Credentials
              </h1>
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                Academic identity, roles, and verification details
              </p>
            </div>
          </div>

          {/* Edit Controls */}
          <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
            {!isEditing ? (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setActivePOV('self');
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center justify-center gap-2 transition cursor-pointer min-h-[42px]"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={handleCancel}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer min-h-[42px]"
                >
                  <X className="w-3.5 h-3.5 inline mr-1" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 min-h-[42px]"
                >
                  {isSaving ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Point of View (POV) Selector Ribbon */}
        <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-slate-100 text-xs">
          <span className="text-[11px] uppercase font-bold text-slate-400 mr-1 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>POV:</span>
          </span>

          <button
            onClick={() => setActivePOV('self')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 min-h-[38px] ${
              activePOV === 'self'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Standard Profile</span>
          </button>

          <button
            onClick={() => setActivePOV('evaluator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 min-h-[38px] ${
              activePOV === 'evaluator'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Mentor POV</span>
          </button>

          <button
            onClick={() => setActivePOV('accreditation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 min-h-[38px] ${
              activePOV === 'accreditation'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>HOD & NAAC</span>
          </button>

          <button
            onClick={() => setActivePOV('digital_id')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 min-h-[38px] ${
              activePOV === 'digital_id'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Digital ID Card</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile details saved and updated successfully!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2.5">
          <X className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* POV Context Banner */}
      {activePOV !== 'self' && (
        <div className={`p-3.5 sm:p-4 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          activePOV === 'evaluator'
            ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
            : activePOV === 'accreditation'
            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
            : 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
        }`}>
          <div className="flex items-start sm:items-center gap-2.5">
            {activePOV === 'evaluator' ? (
              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5 sm:mt-0" />
            ) : activePOV === 'accreditation' ? (
              <Award className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <QrCode className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5 sm:mt-0" />
            )}
            <div>
              <span className="font-bold block sm:inline text-sm sm:text-xs">
                {activePOV === 'evaluator'
                  ? 'Faculty Mentor & Reviewer Perspective'
                  : activePOV === 'accreditation'
                  ? 'HOD & NAAC/NBA Accreditation Audit Perspective'
                  : 'Institutional Digital Academic ID Card'}
              </span>
              <span className="block text-xs opacity-80 mt-0.5">
                {activePOV === 'evaluator'
                  ? 'Shows certification compliance, SHA-256 evidence status, and review authority'
                  : activePOV === 'accreditation'
                  ? 'Criteria scoring, 200 Activity Points index, and official department clearance status'
                  : 'QR compatible digital passport with cryptographic verification hash'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setActivePOV('self')}
            className="text-xs font-bold underline self-end sm:self-auto shrink-0 hover:opacity-80 cursor-pointer min-h-[32px] flex items-center"
          >
            Reset to Standard View
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: DIGITAL ID CARD POV */}
      {/* ========================================================================= */}
      {activePOV === 'digital_id' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full max-w-md mx-auto">
          {/* ID Card Top Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-3.5 sm:p-4 text-white text-center relative">
            <div className="flex items-center justify-center gap-2 mb-1">
              <GraduationCap className="w-5 h-5 text-indigo-400 shrink-0" />
              <span className="font-bold text-xs sm:text-sm tracking-wider uppercase truncate">Nitte University</span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium truncate">Department of Computer Science & Engineering</p>
            <div className="mt-2 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              OFFICIAL ACADEMIC IDENTITY PASS
            </div>
          </div>

          {/* ID Card Body */}
          <div className="p-4 sm:p-6 text-center space-y-3.5 sm:space-y-4">
            <div className="relative inline-block">
              <div
                onClick={handleTriggerFileInput}
                className="relative rounded-2xl overflow-hidden cursor-pointer group/avatar ring-4 ring-indigo-500/30 shadow-md mx-auto"
                title="Click to change ID photo from your device"
              >
                <img
                  src={avatar}
                  alt={user.name}
                  className={`w-24 h-24 sm:w-28 sm:h-28 object-cover bg-slate-100 transition duration-200 group-hover/avatar:scale-105 ${
                    isUploadingAvatar ? 'opacity-40 blur-[1px]' : ''
                  }`}
                />
                <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-1">
                  <Camera className="w-5 h-5 drop-shadow-sm mb-0.5" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Change Photo</span>
                </div>
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 text-white">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleTriggerFileInput}
                title="Select image file"
                className="absolute -bottom-1.5 -right-1.5 bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-full ring-2 ring-white shadow-md transition cursor-pointer hover:scale-110"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 break-words">{user.name}</h3>
              <p className="text-xs text-indigo-600 font-bold mt-0.5 uppercase tracking-wide truncate">
                {designation || (user.role === 'student' ? 'Student' : user.role === 'mentor' ? 'Faculty Mentor' : 'HOD')}
              </p>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
                <RoleBadge role={user.role} />
                {user.roll_no && (
                  <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                    {user.roll_no}
                  </span>
                )}
              </div>
            </div>

            {/* QR Code & Barcode Verification */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-2">
              {renderQRCodeSVG()}
              <div className="text-[10px] font-mono text-slate-500 truncate max-w-full">
                SEC-HASH: NITTE-{user.id.substring(0, 8).toUpperCase()}-2026
              </div>
            </div>

            {/* Entity Snapshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Department</span>
                <span className="font-semibold text-slate-800 truncate block">CSE (Computer Science)</span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Contact</span>
                <span className="font-semibold text-slate-800 font-mono truncate block">{user.phone || phone}</span>
              </div>
              {user.role === 'student' ? (
                <>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Current Standing</span>
                    <span className="font-semibold text-slate-800 truncate block">Semester {user.semester || 6} (CGPA {user.cgpa || 8.25})</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Activity Score</span>
                    <span className="font-bold text-indigo-600 font-mono truncate block">{user.total_points ?? 115} / 200 Pts</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-1 sm:col-span-2 min-w-0">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Office Location</span>
                    <span className="font-semibold text-slate-800 truncate block">{user.office_location || officeLocation}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={handleCopyVerificationHash}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer min-h-[44px]"
              >
                <Copy className="w-4 h-4 shrink-0" />
                <span>{copiedLink ? 'Copied Hash!' : 'Copy Verification Hash'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: STANDARD / EVALUATOR / ACCREDITATION PROFILE CARD */
        /* ========================================================================= */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden w-full">
          {/* Header Cover Banner */}
          <div className={`h-28 sm:h-40 relative p-4 sm:p-6 flex items-end justify-between transition-colors ${
            activePOV === 'evaluator'
              ? 'bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950'
              : activePOV === 'accreditation'
              ? 'bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950'
              : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white/95 backdrop-blur-md border border-white/20 truncate">
                Nitte University • CSE Central Repository
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono text-indigo-200 bg-slate-900/80 border border-indigo-500/30 font-semibold">
                200-PT VERIFIED
              </span>
            </div>
          </div>

          {/* Profile Content Body */}
          <div className="p-4 sm:p-7 pt-0 relative">
            {/* Avatar + Main Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 -mt-12 sm:-mt-18 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-end items-center text-center sm:text-left gap-4 sm:gap-5 min-w-0">
                <div className="relative group shrink-0">
                  <div
                    onClick={handleTriggerFileInput}
                    className="relative rounded-2xl overflow-hidden cursor-pointer group/avatar ring-4 ring-white shadow-md bg-slate-100"
                    title="Click to select image file from your device"
                  >
                    <img
                      src={avatar}
                      alt={user.name}
                      className={`w-24 h-24 sm:w-32 sm:h-32 object-cover bg-slate-100 transition duration-200 group-hover/avatar:scale-105 ${
                        isUploadingAvatar ? 'opacity-40 blur-[1px]' : ''
                      }`}
                    />
                    <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2">
                      <Camera className="w-6 h-6 drop-shadow-sm mb-1" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Change Photo</span>
                    </div>
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 text-white">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleTriggerFileInput}
                    title="Change Profile Photo"
                    className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs transition cursor-pointer shadow-md min-h-[36px] min-w-[36px] flex items-center justify-center ring-2 ring-white hover:scale-110"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 break-words">{user.name}</h2>
                    <RoleBadge role={user.role} />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">
                    {designation || (user.role === 'hod' ? 'Head of Department' : user.role === 'mentor' ? 'Faculty Mentor' : 'CSE Undergraduate Scholar')}
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-600 font-mono">
                    {user.roll_no && (
                      <span className="bg-slate-100 px-2.5 py-0.5 rounded font-semibold text-slate-800">
                        USN: {user.roll_no}
                      </span>
                    )}
                    <span className="bg-slate-100 px-2.5 py-0.5 rounded text-slate-700">
                      Dept: {user.department_code || user.department_id || 'CSE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score / Status Pill */}
              <div className="w-full sm:w-auto flex items-center justify-around sm:justify-end gap-4 bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shrink-0">
                {user.role === 'student' ? (
                  <>
                    <div className="text-center sm:text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Total Points</div>
                      <div className="text-lg font-bold text-indigo-600 font-mono">
                        {user.total_points ?? 115} <span className="text-xs text-slate-400 font-normal">/ 200</span>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-slate-200" />
                    <div className="text-center sm:text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400">CGPA</div>
                      <div className="text-lg font-bold text-slate-800 font-mono">{user.cgpa || 8.25}</div>
                    </div>
                  </>
                ) : user.role === 'mentor' ? (
                  <div className="text-center sm:text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Role Authority</div>
                    <div className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Faculty Mentor & Evaluator</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center sm:text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Executive Authority</div>
                    <div className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      <span>Head of Department</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* =================================================================== */}
            {/* EDIT PROFILE FORM */}
            {/* =================================================================== */}
            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-3.5 sm:space-y-4 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-hidden min-h-[44px]"
                      />
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Registered Email (Institutional)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed min-h-[44px]"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone / Mobile <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-hidden min-h-[44px]"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Designation / Title
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-hidden min-h-[44px]"
                      />
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Campus Office / Classroom Location
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={officeLocation}
                        onChange={(e) => setOfficeLocation(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-hidden min-h-[44px]"
                      />
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Academic Bio / Summary
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer disabled:opacity-50 min-h-[44px]"
                  >
                    Save Profile
                  </button>
                </div>
              </form>
            ) : (
              /* =================================================================== */
              /* PERSPECTIVE-BASED VIEW PANELS */
              /* =================================================================== */
              <div className="space-y-3.5 sm:space-y-4 pt-4 border-t border-slate-100">
                {/* EVALUATOR / MENTOR POV SPECIAL PANEL */}
                {activePOV === 'evaluator' && (
                  <div className="p-3 sm:p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>Evaluation & Verification Checklist</span>
                      </span>
                      <span className="text-[10px] font-bold bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">
                        Mentor Authority
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2.5 bg-white rounded-lg border border-indigo-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Category Cap Status</span>
                        <span className="font-bold text-slate-800">Within Thresholds (≤60 pts)</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-indigo-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Evidence Hash Audit</span>
                        <span className="font-bold text-emerald-600 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>SHA-256 Valid</span>
                        </span>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-indigo-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Verification Window</span>
                        <span className="font-bold text-slate-800">Open for Review</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ACCREDITATION / HOD POV SPECIAL PANEL */}
                {activePOV === 'accreditation' && (
                  <div className="p-3 sm:p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>NAAC / NBA Accreditation Dossier Audit</span>
                      </span>
                      <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                        Criteria 5.3 & 6.2 Compliant
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2.5 bg-white rounded-lg border border-amber-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Clearance Index</span>
                        <span className="font-bold text-indigo-600 font-mono">115 / 200 (57.5%)</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-amber-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Department Rank</span>
                        <span className="font-bold text-slate-800">Top 15% in CSE Cohort</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-amber-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Institutional Export</span>
                        <span className="font-bold text-amber-700">Ready for Dossier Sync</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bio block */}
                {bio && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed break-words">
                    <span className="font-bold text-slate-900 block mb-1">About</span>
                    {bio}
                  </div>
                )}

                {/* Responsive Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                  {/* Contact Email */}
                  <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 flex items-start gap-3.5 bg-white min-w-0 shadow-2xs">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Mail className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Institutional Email</div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate mt-0.5">{user.email}</div>
                      <div className="text-[11px] text-emerald-600 font-medium truncate mt-0.5">Verified Academic Address</div>
                    </div>
                  </div>

                  {/* Contact Phone */}
                  <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 flex items-start gap-3.5 bg-white min-w-0 shadow-2xs">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Phone className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Contact Phone</div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-900 font-mono truncate mt-0.5">
                        {user.phone || phone || '+91 98450 12345'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">Direct Mobile</div>
                    </div>
                  </div>

                  {/* Campus Location */}
                  <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 flex items-start gap-3.5 bg-white min-w-0 shadow-2xs">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <MapPin className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Location</div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate mt-0.5">
                        {user.office_location || officeLocation}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">Main Campus</div>
                    </div>
                  </div>

                  {/* Department Info */}
                  <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 flex items-start gap-3.5 bg-white min-w-0 shadow-2xs">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Building2 className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Department</div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate mt-0.5">
                        {user.department_name || 'Computer Science & Engineering'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">Code: {user.department_code || 'CSE'}</div>
                    </div>
                  </div>

                  {/* Student-Specific Credentials */}
                  {user.role === 'student' && (
                    <>
                      <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 flex items-start gap-3.5 bg-white min-w-0 shadow-2xs">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <UserIcon className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Assigned Faculty Mentor</div>
                          <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate mt-0.5">
                            {user.mentor_name || 'Prof. Ravi Kumar'}
                          </div>
                          <div className="text-[11px] text-indigo-600 font-medium mt-0.5">Review & Verification Mentor</div>
                        </div>
                      </div>

                      <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 flex items-start gap-3.5 bg-white min-w-0 shadow-2xs">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Academic Standing</div>
                          <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate mt-0.5">
                            Semester {user.semester || 6} • CGPA {user.cgpa || 8.25}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium mt-0.5">B.Tech Computer Science</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
