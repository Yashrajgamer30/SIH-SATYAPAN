import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../context/authStore';
import {
  CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, ArrowLeft,
  Save, Clock, UploadCloud, FileText, ChevronRight, ChevronDown,
  Lock, KeyRound, Award, QrCode, Download, RefreshCw, Check,
  AlertOctagon, Zap, Sparkles, Building, Users, GraduationCap,
  Layers, HelpCircle
} from 'lucide-react';

interface CategoryItem {
  code: string;
  name: string;
  description: string;
  checklist: Array<{
    code: string;
    name: string;
    mandatory: boolean;
    size_mb: number;
    types: string[];
  }>;
}

interface PreSubmissionFinding {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  reason: string;
  evidence: string;
  fix_now_target: string;
  is_locked: boolean;
  readiness_penalty: number;
}

interface PreSubmissionResult {
  advisory_banner: string;
  application_id: string;
  application_no: string;
  readiness_score: number;
  readiness_band: 'GREEN' | 'AMBER' | 'RED';
  submission_allowed: boolean;
  grouped_findings: {
    CRITICAL: PreSubmissionFinding[];
    HIGH: PreSubmissionFinding[];
    MEDIUM: PreSubmissionFinding[];
    LOW: PreSubmissionFinding[];
  };
  what_if_simulations: Array<{
    action: string;
    current_score: number;
    projected_score: number;
    gain: string;
  }>;
}

interface SubmissionSuccessData {
  status: string;
  message: string;
  application_no: string;
  submitted_at: string;
  signatory: {
    name: string;
    designation: string;
    method: string;
  };
  acknowledgement: {
    receipt_no: string;
    tamper_evident_sha256: string;
    qr_code_payload: string;
    download_url: string;
  };
}

export const NewApplicationWizard: React.FC = () => {
  const { token, user } = useAuthStore();

  // Wizard Navigation
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  // Autosave State
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [applicationNo, setApplicationNo] = useState<string>('AICTE/EOA/2026/DRAFT');
  const [lastSaved, setLastSaved] = useState<string>('Not saved yet');
  const [isSaving, setIsSaving] = useState(false);

  // Step 1: Categories
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<string>('EOA');
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Step 2: Application Details (Pre-filled from AICTE records, locked fields)
  const [appDetails, setAppDetails] = useState({
    institute_name: 'Sardar Patel Institute of Technology',
    aicte_id: '1-3327654121',
    institute_type: 'Government-Aided Autonomous',
    state: 'Maharashtra',
    district: 'Mumbai Suburban',
    established_year: 1962,
    built_up_area_sqm: 12540.0,
    head_of_institute: 'Dr. Prakash Patil',
    head_email: 'principal@spit.ac.in',
    contact_phone: '+91 22 2670 7440',
    statutory_trust: 'Bharatiya Vidya Bhavan',
    ter_fee_receipt: 'TER-MH-2026-98124',
    academic_year: '2026-2027',
    proposed_expansion_intake: 60
  });

  // Step 3: Students & Faculty counts & attachment
  const [attachedFacultyCount, setAttachedFacultyCount] = useState(48);
  const [attachedStudentCount, setAttachedStudentCount] = useState(38);
  const requiredStudentIntake = 60; // target batch

  // Step 4: Documents checklist state
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, {
    uploaded: boolean;
    fileName?: string;
    progress?: number;
    version?: number;
  }>>({
    'LAND_OWNERSHIP': { uploaded: true, fileName: 'Land_Title_Registry_712.pdf', version: 1 },
    'BUILDING_PLAN': { uploaded: true, fileName: 'Approved_Occupancy_Plan.pdf', version: 2 },
    'AFFIDAVIT_LAND': { uploaded: true, fileName: 'Anti_Ragging_Affidavit_2026.pdf', version: 1 },
    'FACULTY_ROSTER': { uploaded: true, fileName: 'Cadre_Faculty_Roster.pdf', version: 1 },
    'FIRE_NOC': { uploaded: false }
  });

  // Expandable per-student documents
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  // Step 5: AI Pre-submission check
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [preCheckResult, setPreCheckResult] = useState<PreSubmissionResult | null>(null);
  const [forceSubmitWithIssues, setForceSubmitWithIssues] = useState(false);

  // Step 6: Declaration & e-Sign OTP
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [signatoryName, setSignatoryName] = useState(user?.name || 'Dr. Prakash Patil');
  const [signatoryDesignation, setSignatoryDesignation] = useState('Director / Principal');
  const [esignOtp, setEsignOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 7: Submission Success
  const [submissionSuccess, setSubmissionSuccess] = useState<SubmissionSuccessData | null>(null);

  // 1. Fetch categories on mount
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const resp = await fetch('http://localhost:8000/institute/categories');
        if (resp.ok) {
          const json = await resp.json();
          setCategories(json);
        }
      } catch (e) {
        console.error('Failed to load categories:', e);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCats();
  }, []);

  // 2. Fetch Institute details to prefill Step 2
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const resp = await fetch('http://localhost:8000/institute/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) {
          const json = await resp.json();
          const i = json.institute;
          setAppDetails(prev => ({
            ...prev,
            institute_name: i.name || prev.institute_name,
            aicte_id: i.aicte_id || prev.aicte_id,
            institute_type: i.type || prev.institute_type,
            state: i.state || prev.state,
            district: i.district || prev.district,
            established_year: i.established_year || prev.established_year,
            built_up_area_sqm: i.built_up_area_sqm || prev.built_up_area_sqm,
            head_of_institute: i.principal_name || prev.head_of_institute,
            head_email: i.email || prev.head_email,
            contact_phone: i.phone || prev.contact_phone,
            statutory_trust: i.trust_name || prev.statutory_trust
          }));
        }
      } catch (e) {
        console.warn('Could not sync institute profile:', e);
      }
    };
    fetchProfile();
  }, [token]);

  // 3. Offline-Safe Autosave Every 20 Seconds (Differentiator 12)
  const [offlineRestored, setOfflineRestored] = useState(false);

  useEffect(() => {
    // Check for local draft on mount
    try {
      const local = localStorage.getItem('satyapan_offline_wizard_draft');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.appDetails) {
          setAppDetails(parsed.appDetails);
          if (parsed.currentStep) setCurrentStep(parsed.currentStep);
          if (parsed.selectedCategoryCode) setSelectedCategoryCode(parsed.selectedCategoryCode);
          if (parsed.uploadedDocs) setUploadedDocs(parsed.uploadedDocs);
          setLastSaved(`Restored from local storage (${parsed.timestamp})`);
          setOfflineRestored(true);
        }
      }
    } catch (e) {
      console.warn('Could not restore local draft:', e);
    }
  }, []);

  const performDraftSave = async () => {
    setIsSaving(true);
    const nowTime = new Date().toLocaleTimeString();

    // 1. LocalStorage Offline Save
    try {
      const draftPayload = {
        currentStep,
        appDetails,
        uploadedDocs,
        selectedCategoryCode,
        timestamp: nowTime
      };
      localStorage.setItem('satyapan_offline_wizard_draft', JSON.stringify(draftPayload));
    } catch (e) {
      console.warn('Local storage save failed:', e);
    }

    // 2. Server Sync
    try {
      const resp = await fetch('http://localhost:8000/institute/applications/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          application_id: applicationId,
          category_code: selectedCategoryCode,
          academic_year: '2026-2027',
          step_data: {
            current_step: currentStep,
            app_details: appDetails,
            uploaded_docs: uploadedDocs
          }
        })
      });
      if (resp.ok) {
        const json = await resp.json();
        setApplicationId(json.application_id);
        setApplicationNo(json.application_no);
        setLastSaved(json.last_saved);
      } else {
        setLastSaved(`Offline draft saved locally at ${nowTime}`);
      }
    } catch (e) {
      setLastSaved(`Offline draft saved locally at ${nowTime}`);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    // Autosave interval 20s
    const timer = setInterval(() => {
      performDraftSave();
    }, 20000);
    return () => clearInterval(timer);
  }, [applicationId, selectedCategoryCode, currentStep, appDetails, uploadedDocs, token]);

  // 4. Run AI Pre-submission scan
  const runAiPreCheck = async () => {
    setIsScanning(true);
    setScanStepIndex(0);

    const scanMessages = [
      'Scanning Cadre-Wise Faculty Roster with PAN Hash Cross-Check...',
      'Verifying Fire NOC OCR Validity & Municipal Department Metadata...',
      'Analyzing Land Title 7/12 Extract via District Collector Registry...',
      'Computing Faculty-Student Ratio (FSR) against AICTE Norms (1:20)...',
      'Synthesizing Readiness Score & Regulatory Risk Band...'
    ];

    for (let i = 0; i < scanMessages.length; i++) {
      setScanStepIndex(i);
      await new Promise(r => setTimeout(r, 600));
    }

    try {
      // First ensure draft is saved
      const draftResp = await fetch('http://localhost:8000/institute/applications/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          application_id: applicationId,
          category_code: selectedCategoryCode,
          academic_year: '2026-2027',
          step_data: {}
        })
      });
      const draftJson = await draftResp.json();
      const targetAppId = draftJson.application_id;
      setApplicationId(targetAppId);

      const resp = await fetch(`http://localhost:8000/institute/applications/${targetAppId}/pre-submission-check`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const json: PreSubmissionResult = await resp.json();
        setPreCheckResult(json);
      }
    } catch (e) {
      console.error('Pre-submission check failed:', e);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (currentStep === 5 && !preCheckResult && !isScanning) {
      runAiPreCheck();
    }
  }, [currentStep]);

  // 5. Submit Application (Step 6 -> 7)
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    if (!declarationAccepted) {
      setOtpError('You must acknowledge and sign the statutory declaration before submission.');
      return;
    }
    if (!esignOtp.trim()) {
      setOtpError('Please enter the 6-digit e-Sign OTP received on registered mobile.');
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await fetch(`http://localhost:8000/institute/applications/${applicationId || 'app-default'}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          application_id: applicationId || 'app-default',
          declaration_confirmed: declarationAccepted,
          esign_otp: esignOtp.trim(),
          signatory_name: signatoryName,
          signatory_designation: signatoryDesignation,
          force_submit_with_issues: forceSubmitWithIssues
        })
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || 'Application submission failed');
      }

      const json: SubmissionSuccessData = await resp.json();
      setSubmissionSuccess(json);
      setCurrentStep(7);
    } catch (err: any) {
      setOtpError(err.message || 'Error occurred during final submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateDocUpload = (code: string) => {
    setUploadedDocs(prev => ({
      ...prev,
      [code]: {
        uploaded: true,
        fileName: `${code}_Renewed_2026.pdf`,
        progress: 100,
        version: (prev[code]?.version || 0) + 1
      }
    }));
  };

  const currentCategory = categories.find(c => c.code === selectedCategoryCode) || categories[0];
  const progressPercent = Math.round(((currentStep - 1) / (totalSteps - 1)) * 100);

  return (
    <div className="space-y-6">
      {offlineRestored && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span><strong>Offline Draft Restored:</strong> Your previous application data and checklist have been restored from local storage.</span>
          </div>
          <button
            onClick={() => setOfflineRestored(false)}
            className="text-[11px] font-semibold underline text-blue-700 hover:text-blue-900 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Government Form Stepper Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-navy-800">
          <div>
            <div className="flex items-center gap-2 text-12 font-bold text-saffron-600 dark:text-saffron-400 uppercase tracking-wider">
              <span>AICTE Approval Process Handbook (APH 2026-27)</span>
              <span>•</span>
              <span className="font-mono text-gov-muted">{applicationNo}</span>
            </div>
            <h1 className="text-22 font-bold text-navy-950 dark:text-white mt-1">
              New Regulatory Approval Wizard
            </h1>
          </div>

          {/* Autosave Status & Save Draft Button */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-11 font-bold text-gov-muted flex items-center gap-1.5 justify-end">
                <Clock className="w-3.5 h-3.5 text-saffron-500" />
                <span>Last Autosaved: {lastSaved}</span>
              </div>
              <div className="text-[10px] text-gov-muted mt-0.5">
                Autosaves every 20 seconds
              </div>
            </div>

            <button
              onClick={performDraftSave}
              disabled={isSaving}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 hover:bg-slate-100 text-gov-text text-12 font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin text-saffron-500' : 'text-gov-muted'}`} />
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </button>
          </div>
        </div>

        {/* Horizontal Stepper */}
        <div className="pt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-12 font-bold text-navy-900 dark:text-white">
              Step {currentStep} of {totalSteps}: {
                currentStep === 1 ? 'Select Approval Category' :
                currentStep === 2 ? 'Institutional Details & Verification' :
                currentStep === 3 ? 'Attach Students & Faculty Records' :
                currentStep === 4 ? 'Upload Regulatory Document Checklist' :
                currentStep === 5 ? 'AI Pre-Submission Forensic Check' :
                currentStep === 6 ? 'Declaration & OTP e-Sign' :
                'Acknowledgement & Submission Receipt'
              }
            </span>
            <span className="text-12 font-mono font-bold text-saffron-500">
              {progressPercent}% Completed
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-navy-800 overflow-hidden">
            <div
              className="h-full bg-saffron-500 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Stepper Dots */}
          <div className="grid grid-cols-7 gap-2 mt-3 text-center text-11">
            {[
              'Category', 'Details', 'People', 'Documents',
              'AI Check', 'e-Sign', 'Receipt'
            ].map((name, idx) => {
              const stepNum = idx + 1;
              const isPast = currentStep > stepNum;
              const isCurrent = currentStep === stepNum;
              return (
                <button
                  key={stepNum}
                  onClick={() => {
                    // Only allow moving to steps previously reached or up to current
                    if (stepNum <= currentStep || (stepNum === currentStep + 1 && currentStep !== 5)) {
                      setCurrentStep(stepNum);
                    }
                  }}
                  className={`flex flex-col items-center gap-1 group transition-colors ${
                    isCurrent
                      ? 'text-saffron-600 font-bold'
                      : isPast
                      ? 'text-emerald-600 font-semibold'
                      : 'text-gov-muted'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-11 font-bold ${
                    isCurrent
                      ? 'bg-saffron-500 text-white ring-4 ring-saffron-500/20'
                      : isPast
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-navy-800 text-gov-muted'
                  }`}>
                    {isPast ? <Check className="w-3.5 h-3.5" /> : stepNum}
                  </div>
                  <span className="hidden sm:inline text-[11px] truncate">{name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Step Views */}
      <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs min-h-[440px]">
        {/* STEP 1: SELECT CATEGORY (8 Cards) */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-18 font-bold text-navy-950 dark:text-white">
                Step 1: Choose Approval Category
              </h2>
              <p className="text-13 text-gov-muted mt-1">
                Select your intended regulatory category. Mandatory checklists are auto-loaded from the AICTE handbook database.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((cat) => {
                const isSelected = selectedCategoryCode === cat.code;
                return (
                  <div
                    key={cat.code}
                    onClick={() => setSelectedCategoryCode(cat.code)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-saffron-500 bg-saffron-50/40 dark:bg-navy-800 ring-2 ring-saffron-500/20 shadow-sm'
                        : 'border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 hover:border-slate-300 dark:hover:border-navy-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-10 font-bold bg-slate-100 dark:bg-navy-700 text-gov-text font-mono">
                          {cat.code}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-saffron-500" />
                        )}
                      </div>
                      <h3 className="text-14 font-bold text-navy-950 dark:text-white leading-snug">
                        {cat.name}
                      </h3>
                      <p className="text-12 text-gov-muted mt-2 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-navy-800 text-11 text-gov-muted flex items-center justify-between">
                      <span>{cat.checklist.length} Checklist Docs</span>
                      <ChevronRight className="w-3.5 h-3.5 text-saffron-500" />
                    </div>
                  </div>
                );
              })}
            </div>

            {currentCategory && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200 dark:border-navy-700">
                <div className="text-12 font-bold uppercase tracking-wider text-gov-muted mb-2">
                  Auto-Loaded Checklist for {currentCategory.name}:
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentCategory.checklist.map((item) => (
                    <span key={item.code} className="px-3 py-1 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-12 font-medium text-navy-900 dark:text-slate-100 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-saffron-500" />
                      <span>{item.name}</span>
                      <span className="text-[10px] text-gov-muted">({item.types.join('/')})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: APPLICATION DETAILS (Pre-filled from AICTE, Locked where required) */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-18 font-bold text-navy-950 dark:text-white">
                  Step 2: Institutional Application Profile
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 text-11 font-bold">
                  Pre-filled from AICTE Central Records
                </span>
              </div>
              <p className="text-13 text-gov-muted mt-1">
                Core regulatory details are locked for consistency with government registries. Editable fields are marked with a blue pencil icon.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Locked Field: Institute Name */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-navy-800/40 border border-slate-200/80 dark:border-navy-700/80 relative">
                <div className="flex items-center justify-between text-11 font-bold text-gov-muted uppercase mb-1">
                  <span>Institute Full Name</span>
                  <span title="Locked by AICTE Central Registry">
                    <Lock className="w-3.5 h-3.5 text-gov-muted" />
                  </span>
                </div>
                <div className="text-13 font-bold text-navy-950 dark:text-white">
                  {appDetails.institute_name}
                </div>
                <div className="text-[10px] text-gov-muted mt-1">
                  Permanent ID: <span className="font-mono text-[13px] tabular-nums font-semibold">{appDetails.aicte_id}</span>
                </div>
              </div>

              {/* Locked Field: State / District */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-navy-800/40 border border-slate-200/80 dark:border-navy-700/80 relative">
                <div className="flex items-center justify-between text-11 font-bold text-gov-muted uppercase mb-1">
                  <span>Campus Jurisdiction</span>
                  <Lock className="w-3.5 h-3.5 text-gov-muted" />
                </div>
                <div className="text-13 font-bold text-navy-950 dark:text-white">
                  {appDetails.district}, {appDetails.state}
                </div>
                <div className="text-[10px] text-gov-muted mt-1">
                  Established in {appDetails.established_year}
                </div>
              </div>

              {/* Locked Field: Built-up Area */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-navy-800/40 border border-slate-200/80 dark:border-navy-700/80 relative">
                <div className="flex items-center justify-between text-11 font-bold text-gov-muted uppercase mb-1">
                  <span>Instructional Built-Up Area</span>
                  <Lock className="w-3.5 h-3.5 text-gov-muted" />
                </div>
                <div className="text-13 font-bold text-navy-950 dark:text-white">
                  {appDetails.built_up_area_sqm.toLocaleString()} sq. meters
                </div>
                <div className="text-[10px] text-gov-muted mt-1">
                  Cadastral Survey Endorsed
                </div>
              </div>

              {/* Editable Field: Principal Name */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700">
                <label className="block text-11 font-bold text-gov-muted uppercase mb-1">
                  Head of Institute (Principal) *
                </label>
                <input
                  type="text"
                  value={appDetails.head_of_institute}
                  onChange={(e) => setAppDetails({ ...appDetails, head_of_institute: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg text-13 text-gov-text font-medium"
                />
              </div>

              {/* Editable Field: Principal Email */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700">
                <label className="block text-11 font-bold text-gov-muted uppercase mb-1">
                  Official Communication Email *
                </label>
                <input
                  type="email"
                  value={appDetails.head_email}
                  onChange={(e) => setAppDetails({ ...appDetails, head_email: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg text-13 text-gov-text font-medium"
                />
              </div>

              {/* Editable Field: Proposed Intake */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700">
                <label className="block text-11 font-bold text-gov-muted uppercase mb-1">
                  Target Academic Batch Intake
                </label>
                <input
                  type="number"
                  value={appDetails.proposed_expansion_intake}
                  onChange={(e) => setAppDetails({ ...appDetails, proposed_expansion_intake: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg text-13 text-gov-text font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: STUDENTS & FACULTY ATTACHMENT */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-18 font-bold text-navy-950 dark:text-white">
                Step 3: Attach Students & Faculty Records
              </h2>
              <p className="text-13 text-gov-muted mt-1">
                Link existing enrolled students and endorsed faculty members to this approval application.
              </p>
            </div>

            {/* Counter Widget */}
            <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-14 font-bold text-amber-950 dark:text-amber-200">
                    Students Added: {attachedStudentCount} of {requiredStudentIntake}, remaining {requiredStudentIntake - attachedStudentCount}
                  </div>
                  <div className="text-12 text-amber-800 dark:text-amber-300/80 mt-0.5">
                    Target batch requires {requiredStudentIntake} verified enrolled students.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setAttachedStudentCount(requiredStudentIntake)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-12 transition-colors whitespace-nowrap"
              >
                + Link Remaining {requiredStudentIntake - attachedStudentCount} Students
              </button>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/40">
                <div className="flex items-center justify-between">
                  <div className="text-13 font-bold text-navy-950 dark:text-white">
                    Endorsed Faculty Attached
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-11 font-bold">
                    {attachedFacultyCount} Regular Cadre
                  </span>
                </div>
                <div className="text-12 text-gov-muted mt-2">
                  All 48 faculty profiles contain verified qualification degrees and masked PAN identifiers.
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/40">
                <div className="flex items-center justify-between">
                  <div className="text-13 font-bold text-navy-950 dark:text-white">
                    Faculty-to-Student Ratio
                  </div>
                  <span className="font-mono text-12 font-bold text-emerald-600">
                    1:15.8 (Compliant)
                  </span>
                </div>
                <div className="text-12 text-gov-muted mt-2">
                  Exceeds prescribed AICTE minimum 1:20 UG engineering standard.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: UPLOAD DOCUMENTS (Checklist Table with Dropzones & Per-Student Accordion) */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-18 font-bold text-navy-950 dark:text-white">
                Step 4: Upload Regulatory Document Checklist
              </h2>
              <p className="text-13 text-gov-muted mt-1">
                Upload mandatory institutional certificates. Dropzones validate format, file size, and OCR integrity.
              </p>
            </div>

            {/* Checklist Table */}
            <div className="rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden">
              <table className="w-full text-left border-collapse text-13">
                <thead className="bg-slate-50 dark:bg-navy-800/80 text-11 font-bold text-gov-muted uppercase border-b border-slate-200 dark:border-navy-700">
                  <tr>
                    <th className="py-3 px-4">Requirement</th>
                    <th className="py-3 px-4">Accepted Formats</th>
                    <th className="py-3 px-4">Size Limit</th>
                    <th className="py-3 px-4">Status & Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                  {currentCategory.checklist.map((doc) => {
                    const status = uploadedDocs[doc.code];
                    const isUploaded = status?.uploaded;
                    return (
                      <tr key={doc.code} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/30">
                        <td className="py-3 px-4">
                          <div className="font-bold text-navy-950 dark:text-white">
                            {doc.name}
                          </div>
                          <div className="text-11 text-gov-muted font-mono">
                            Rule: {doc.code} {doc.mandatory && <span className="text-red-500 font-bold">*Mandatory</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-12 text-gov-muted">
                          {doc.types.join(', ')}
                        </td>
                        <td className="py-3 px-4 font-mono text-12 text-gov-muted">
                          Up to {doc.size_mb} MB
                        </td>
                        <td className="py-3 px-4">
                          {isUploaded ? (
                            <div className="flex items-center gap-3">
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-11 font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Uploaded (v{status.version})</span>
                              </span>
                              <button
                                onClick={() => handleSimulateDocUpload(doc.code)}
                                className="text-11 font-bold text-saffron-600 hover:underline"
                              >
                                Replace
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSimulateDocUpload(doc.code)}
                              className="px-3.5 py-1.5 rounded-lg border border-dashed border-saffron-400 dark:border-saffron-600 bg-saffron-50/50 dark:bg-saffron-950/30 text-saffron-700 dark:text-saffron-300 font-bold text-12 hover:bg-saffron-100 transition-colors flex items-center gap-1.5"
                            >
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>Dropzone Upload</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Per-Student Document Upload Accordion */}
            <div className="rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden">
              <button
                onClick={() => setExpandedStudentId(expandedStudentId ? null : 'stu-sample')}
                className="w-full p-4 bg-slate-50 dark:bg-navy-800/80 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-5 h-5 text-saffron-500" />
                  <div>
                    <div className="text-13 font-bold text-navy-950 dark:text-white">
                      Per-Student Documents Section (Marksheets, ID Proof, Caste/Income Proof)
                    </div>
                    <div className="text-11 text-gov-muted">
                      Expand to view or upload mandatory student credentials for all 38 attached students
                    </div>
                  </div>
                </div>
                {expandedStudentId ? <ChevronDown className="w-5 h-5 text-gov-muted" /> : <ChevronRight className="w-5 h-5 text-gov-muted" />}
              </button>

              {expandedStudentId && (
                <div className="p-4 bg-white dark:bg-navy-900 space-y-3 text-12 border-t border-slate-100 dark:border-navy-800">
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-navy-700 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-navy-900 dark:text-white">EN2026SIT101</span> - Aarav Sharma (Computer Science)
                      <div className="text-11 text-gov-muted">3 of 3 Documents Verified via DigiLocker NAD</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-10 font-bold bg-emerald-100 text-emerald-800">
                      Complete
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 dark:border-navy-700 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-navy-900 dark:text-white">EN2026SIT102</span> - Ananya Deshmukh (Information Technology)
                      <div className="text-11 text-gov-muted">2 of 3 Uploaded • Domicile Certificate Pending</div>
                    </div>
                    <button
                      onClick={() => alert('Opening student upload modal...')}
                      className="px-2.5 py-1 rounded-md bg-saffron-50 text-saffron-700 border border-saffron-200 text-11 font-bold"
                    >
                      Upload Missing
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: AI PRE-SUBMISSION CHECK (Prompt C3) */}
        {currentStep === 5 && (
          <div className="space-y-6">
            {/* Advisory Banner */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center gap-3 text-blue-900 dark:text-blue-200 text-13">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <span className="font-medium">
                <strong>Advisory only.</strong> This pre-submission check runs AICTE's automated forensic pipeline to help you detect and correct compliance issues before submission. It is not an official regulatory decision.
              </span>
            </div>

            {/* Scanning Animation */}
            {isScanning && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-saffron-200 dark:border-navy-700 animate-pulse" />
                  <div className="absolute inset-2 rounded-full border-4 border-t-saffron-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  <Zap className="w-8 h-8 text-saffron-500 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-16 font-bold text-navy-950 dark:text-white">
                    Running SATYAPAN Forensic AI Pipeline...
                  </h3>
                  <p className="text-12 text-saffron-600 dark:text-saffron-400 font-mono mt-1">
                    Analyzing application against AICTE 2026-27 Regulatory Rulebook
                  </p>
                </div>
              </div>
            )}

            {/* Results Screen */}
            {!isScanning && preCheckResult && (
              <div className="space-y-6">
                {/* Readiness Gauge & Status */}
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-navy-800/50 border border-slate-200 dark:border-navy-700 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    {/* Gauge Circle */}
                    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                      <div className="text-center">
                        <span className="text-28 font-mono font-black text-navy-950 dark:text-white">
                          {preCheckResult.readiness_score}
                        </span>
                        <span className="text-11 font-bold text-gov-muted block">/ 100</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-12 font-bold ${
                          preCheckResult.readiness_band === 'GREEN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : preCheckResult.readiness_band === 'AMBER'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          Band: {preCheckResult.readiness_band}
                        </span>
                        <span className="text-13 font-bold text-navy-950 dark:text-white">
                          Readiness Evaluation
                        </span>
                      </div>
                      <p className="text-12 text-gov-muted mt-1 max-w-md">
                        {preCheckResult.submission_allowed
                          ? 'Application meets statutory minimum threshold (>= 70%) for regulatory scrutiny submission.'
                          : 'Application readiness is below threshold. Rectify critical deficiencies or provide explicit acknowledgement.'}
                      </p>
                    </div>
                  </div>

                  {/* What-If Simulator Card */}
                  <div className="w-full md:w-80 p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-xs">
                    <div className="text-11 font-bold text-saffron-600 dark:text-saffron-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>What-If Simulator</span>
                    </div>
                    {preCheckResult.what_if_simulations.map((sim, i) => (
                      <div key={i} className="text-12 pb-2 mb-2 border-b border-slate-100 dark:border-navy-800 last:border-0 last:pb-0 last:mb-0">
                        <div className="font-semibold text-navy-950 dark:text-white">{sim.action}</div>
                        <div className="text-11 text-emerald-600 dark:text-emerald-400 mt-0.5">
                          Raise readiness from <span className="font-bold">{sim.current_score}</span> to <span className="font-bold">{sim.projected_score}</span> ({sim.gain})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grouped Findings by Severity */}
                <div className="space-y-4">
                  <h3 className="text-15 font-bold text-navy-950 dark:text-white">
                    Compliance Findings & Immediate Rectifications
                  </h3>

                  {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => {
                    const list = preCheckResult.grouped_findings[sev];
                    if (!list || list.length === 0) return null;
                    return (
                      <div key={sev} className="space-y-2">
                        <div className="text-11 font-bold uppercase tracking-wider text-gov-muted">
                          {sev} Severity ({list.length})
                        </div>
                        {list.map((finding) => (
                          <div
                            key={finding.id}
                            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              sev === 'CRITICAL'
                                ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
                                : sev === 'HIGH'
                                ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                                : 'bg-slate-50 dark:bg-navy-800/40 border-slate-200 dark:border-navy-700'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-10 font-bold ${
                                  sev === 'CRITICAL' ? 'bg-red-600 text-white' :
                                  sev === 'HIGH' ? 'bg-amber-600 text-white' :
                                  'bg-slate-200 dark:bg-navy-700 text-gov-text'
                                }`}>
                                  {sev}
                                </span>
                                <span className="font-bold text-13 text-navy-950 dark:text-white">
                                  {finding.title}
                                </span>
                              </div>
                              <p className="text-12 text-gov-muted">
                                {finding.reason}
                              </p>
                              <div className="text-11 font-mono text-gov-muted">
                                Evidence: {finding.evidence}
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setCurrentStep(4);
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-saffron-600 hover:bg-slate-50 text-12 font-bold whitespace-nowrap shadow-2xs"
                            >
                              Fix now &rarr;
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>

                {/* Sub-threshold bypass checkbox */}
                {!preCheckResult.submission_allowed && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={forceSubmitWithIssues}
                        onChange={(e) => setForceSubmitWithIssues(e.target.checked)}
                        className="mt-1 rounded text-red-600 focus:ring-red-500"
                      />
                      <span className="text-12 text-red-800 dark:text-red-200">
                        <strong>Mandatory Acknowledgement:</strong> I acknowledge that known compliance issues remain unresolved below the 70% threshold. I request provisional scrutiny submission and agree to rectify during Scrutiny Desk review.
                      </span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 6: DECLARATION AND E-SIGN */}
        {currentStep === 6 && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <h2 className="text-18 font-bold text-navy-950 dark:text-white text-center">
                Step 6: Statutory Undertaking & OTP-Based e-Sign
              </h2>
              <p className="text-13 text-gov-muted text-center mt-1">
                Final statutory declaration pursuant to Section 10(1) of AICTE Act 1987.
              </p>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-5">
              {otpError && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-12 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              {/* Statutory Declaration Textbox */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200 dark:border-navy-700 text-12 text-gov-text leading-relaxed space-y-2 h-44 overflow-y-auto">
                <p className="font-bold">STATUTORY UNDERTAKING & LEGAL DECLARATION:</p>
                <p>
                  I hereby solemnly affirm that the information furnished, uploaded documents, faculty credentials, and physical infrastructure measurements are true, correct, and verified against original institutional records.
                </p>
                <p>
                  I understand that providing fraudulent, tampered, or misrepresentative documents entails severe penalties, including revocation of approval, criminal proceedings under the Bharatiya Nyaya Sanhita (BNS), and debarment.
                </p>
                <p>
                  I authorize AICTE and its regional scrutiny committees to verify all submitted credentials across DigiLocker, NAD, and local Municipal revenue records.
                </p>
              </div>

              {/* Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer p-2">
                <input
                  type="checkbox"
                  required
                  checked={declarationAccepted}
                  onChange={(e) => setDeclarationAccepted(e.target.checked)}
                  className="mt-1 rounded text-saffron-500 focus:ring-saffron-400"
                />
                <span className="text-12 font-medium text-navy-950 dark:text-white">
                  I have read, understood, and accept the statutory declaration on behalf of the Governing Body.
                </span>
              </label>

              {/* Signatory Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-11 font-bold text-gov-muted uppercase mb-1">
                    Signatory Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text"
                  />
                </div>

                <div>
                  <label className="block text-11 font-bold text-gov-muted uppercase mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    required
                    value={signatoryDesignation}
                    onChange={(e) => setSignatoryDesignation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text"
                  />
                </div>
              </div>

              {/* OTP e-Sign Input with Demo Hint */}
              <div className="p-4 rounded-xl border border-saffron-200 dark:border-saffron-900/40 bg-saffron-50/40 dark:bg-saffron-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-saffron-600" />
                    <span className="text-13 font-bold text-navy-950 dark:text-white">
                      Enter 6-Digit e-Sign Mobile OTP
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-11 font-mono font-bold bg-saffron-100 dark:bg-saffron-900 text-saffron-800 dark:text-saffron-200">
                    Demo OTP: 687851
                  </span>
                </div>

                <input
                  type="text"
                  maxLength={6}
                  value={esignOtp}
                  onChange={(e) => setEsignOtp(e.target.value)}
                  placeholder="687851"
                  className="w-full px-4 py-2.5 font-mono text-center text-18 font-bold tracking-widest bg-white dark:bg-navy-900 border border-saffron-300 dark:border-saffron-700 rounded-xl text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-saffron-500"
                />
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting || !declarationAccepted}
                  className="px-8 py-3 rounded-xl bg-saffron-500 hover:bg-saffron-600 disabled:opacity-40 text-white font-bold text-14 shadow-md transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Validating e-Sign Cryptographic Hash...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>Authorize e-Sign & Submit Application</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 7: SUBMISSION & DIGNIFIED SUCCESS RECEIPT */}
        {currentStep === 7 && submissionSuccess && (
          <div className="space-y-6 max-w-2xl mx-auto py-4 text-center">
            {/* Dignified Header */}
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-12 font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Official Regulatory Receipt
              </span>
              <h2 className="text-22 font-bold text-navy-950 dark:text-white mt-1">
                Application Submitted Successfully
              </h2>
              <p className="text-13 text-gov-muted mt-1">
                Your application has been registered with AICTE Western Regional Directorate and entered the automated scrutiny queue.
              </p>
            </div>

            {/* Official Receipt Card */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 text-left space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-navy-700">
                <div>
                  <div className="text-11 font-bold text-gov-muted uppercase">Application Number</div>
                  <div className="font-mono text-[13px] tabular-nums font-bold text-navy-950 dark:text-white mt-0.5">
                    {submissionSuccess.application_no}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-11 font-bold text-gov-muted uppercase">Receipt ID</div>
                  <div className="font-mono text-[13px] tabular-nums text-gov-muted mt-0.5">
                    {submissionSuccess.acknowledgement.receipt_no}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-12">
                <div>
                  <div className="text-gov-muted font-bold">Submission Timestamp:</div>
                  <div className="font-semibold text-navy-900 dark:text-white mt-0.5">
                    {submissionSuccess.submitted_at}
                  </div>
                </div>
                <div>
                  <div className="text-gov-muted font-bold">Authorized Signatory:</div>
                  <div className="font-semibold text-navy-900 dark:text-white mt-0.5">
                    {submissionSuccess.signatory.name} ({submissionSuccess.signatory.designation})
                  </div>
                </div>
              </div>

              {/* Tamper-evident cryptographic hash */}
              <div className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-11">
                <div className="font-bold text-gov-muted uppercase mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tamper-Evident SHA-256 Hash:</span>
                </div>
                <div className="font-mono text-11 break-all text-slate-700 dark:text-slate-300">
                  {submissionSuccess.acknowledgement.tamper_evident_sha256}
                </div>
              </div>

              {/* QR Code Payload Representation */}
              <div className="flex items-center gap-4 pt-2">
                <div className="p-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700">
                  <QrCode className="w-12 h-12 text-navy-950 dark:text-white" />
                </div>
                <div className="text-11 text-gov-muted">
                  <div className="font-bold text-navy-950 dark:text-white">Machine-Verifiable QR Code</div>
                  <div>Encodes application number, hash token, and official timestamp for physical inspections.</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => {
                  alert(`Downloading Official Acknowledgement PDF for ${submissionSuccess.application_no}...`);
                }}
                className="px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-13 shadow-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Acknowledgement PDF</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Stepper Navigation Bar (Back & Next) */}
      {currentStep < 7 && (
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-navy-700 text-gov-text font-semibold text-13 hover:bg-slate-50 dark:hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            onClick={() => {
              if (currentStep === 5 && preCheckResult && !preCheckResult.submission_allowed && !forceSubmitWithIssues) {
                alert('Please acknowledge known issues or rectify critical deficiencies before moving to e-sign.');
                return;
              }
              setCurrentStep(s => Math.min(totalSteps, s + 1));
            }}
            className="px-6 py-2 rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-13 shadow-sm hover:shadow transition-all flex items-center gap-2"
          >
            <span>{currentStep === 6 ? 'Review & Submit' : 'Next Step'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
