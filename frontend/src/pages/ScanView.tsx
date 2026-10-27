import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../context/authStore';
import {
  FileText, CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert,
  ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, Eye, EyeOff,
  Sliders, Download, Check, X, ArrowLeft, ArrowRight, CornerDownRight,
  QrCode, Stamp, FileCheck, Layers, Sparkles, AlertCircle, Clock,
  ChevronDown, ChevronRight, User, Building, HelpCircle, FileSearch, RefreshCw
} from 'lucide-react';

interface ScanViewProps {
  onClose: () => void;
  documentId?: string;
  initialFileName?: string;
}

interface BoundingBox {
  id: string;
  type: 'text' | 'qr' | 'signature' | 'seal' | 'tamper';
  field: string;
  value: string;
  confidence: number;
  model: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const ScanView: React.FC<ScanViewProps> = ({
  onClose,
  documentId = 'doc-demo-01',
  initialFileName = 'fire_noc_clean.pdf'
}) => {
  const { theme, language } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  // Selected Demo Pack document for stage evaluation
  const [selectedDoc, setSelectedDoc] = useState<string>(initialFileName);
  
  // Viewer state
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'scan' | 'student'>('scan');
  
  // Scanning animation & SSE simulation
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // Forensic Heatmap overlay state
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.65);

  // Active Zoom Target & Overlays
  const [activeBox, setActiveBox] = useState<BoundingBox | null>(null);
  const [hoveredBox, setHoveredBox] = useState<BoundingBox | null>(null);

  // Action Modals & Audit Trail Remarks
  const [activeActionModal, setActiveActionModal] = useState<string | null>(null);
  const [actionRemarks, setActionRemarks] = useState<string>('');
  const [auditConfirmationToast, setAuditConfirmationToast] = useState<{ id: string; msg: string } | null>(null);

  // Collapsible cards in Right Authenticity Report
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({
    verdict: false,
    fields: false,
    qr: false,
    signature: false,
    seal: false,
    tamper: false,
    duplicate: false,
    authority: false,
    findings: false
  });

  const toggleCard = (key: string) => {
    setCollapsedCards((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Pipeline Steps
  const pipelineSteps = [
    { id: 'classify', label: 'Classifying document type', icon: FileSearch },
    { id: 'ocr', label: 'Reading text & word boxes (OCR)', icon: FileText },
    { id: 'qr', label: 'Detecting QR & checking HMAC', icon: QrCode },
    { id: 'signature', label: 'Verifying digital signature & trust store', icon: CheckCircle2 },
    { id: 'seal', label: 'Detecting seal & contour check', icon: Stamp },
    { id: 'tamper', label: 'Tamper & ELA forensic analysis', icon: Sparkles },
    { id: 'duplicate', label: 'Perceptual hash duplicate check', icon: Layers },
    { id: 'authority', label: 'Issuing-authority verification', icon: ShieldCheck }
  ];

  // 12 Demo Pack documents configuration
  const demoPackFiles = [
    { name: 'fire_noc_clean.pdf', label: 'Fire NOC (Clean)', verdict: 'VERIFIED', type: 'Fire NOC' },
    { name: 'naac_certificate_expired.pdf', label: 'NAAC Certificate (Expired)', verdict: 'EXPIRED', type: 'NAAC Accreditation' },
    { name: 'affidavit_tampered_date.pdf', label: 'Affidavit (Tampered Date)', verdict: 'TAMPER_SUSPECTED', type: 'Affidavit' },
    { name: 'trust_deed_copy_move_seal.png', label: 'Trust Deed (Copy-Move Seal)', verdict: 'TAMPER_SUSPECTED', type: 'Trust Deed' },
    { name: 'building_plan_duplicate.pdf', label: 'Building Plan (Duplicate)', verdict: 'DUPLICATE', type: 'Building Plan' },
    { name: 'university_letter_bad_qr.pdf', label: 'University Letter (Bad QR)', verdict: 'SIGNATURE_INVALID', type: 'Affiliation Letter' },
    { name: 'appointment_letter_untrusted.pdf', label: 'Faculty Letter (Untrusted Signer)', verdict: 'SIGNER_NOT_TRUSTED', type: 'Appointment Letter' },
    { name: 'marksheet_clean.pdf', label: 'Marksheet (Clean Genuine)', verdict: 'VERIFIED', type: 'Mark Sheet' },
    { name: 'fee_receipt_id_mismatch.pdf', label: 'Fee Receipt (ID Mismatch)', verdict: 'MISMATCH_ID', type: 'Fee Receipt' },
    { name: 'lab_photo_good.jpg', label: 'Lab Photo (Sharp & Good)', verdict: 'VERIFIED', type: 'Infra Evidence' },
    { name: 'lab_photo_blurry.jpg', label: 'Lab Photo (Blurry / Resubmit)', verdict: 'NEEDS_EVIDENCE', type: 'Infra Evidence' },
    { name: 'library_photo_inconsistent.jpg', label: 'Library Photo (Inconsistent Floor)', verdict: 'INSPECTION_FLAG', type: 'Infra Evidence' }
  ];

  // Bounding Boxes positioned across the document canvas
  const boundingBoxes: BoundingBox[] = [
    {
      id: 'box-ref',
      type: 'text',
      field: 'Certificate Ref No',
      value: 'NOC-FIRE-2025-9921',
      confidence: 0.985,
      model: 'Tesseract-Regex-Extract',
      x: 35,
      y: 95,
      w: 240,
      h: 22
    },
    {
      id: 'box-inst',
      type: 'text',
      field: 'AICTE Institute ID',
      value: selectedDoc.includes('fee_receipt_id_mismatch') ? 'AICTE-1-9999999' : 'AICTE-1-3324901',
      confidence: 0.992,
      model: 'Regex-Layout-Anchor',
      x: 35,
      y: 165,
      w: 220,
      h: 22
    },
    {
      id: 'box-date',
      type: selectedDoc.includes('tamper') ? 'tamper' : 'text',
      field: 'Statutory Validity',
      value: selectedDoc.includes('tamper') ? '31/12/2035 [MODIFIED]' : selectedDoc.includes('expired') ? '14/01/2024' : '09/04/2028',
      confidence: selectedDoc.includes('tamper') ? 0.94 : 0.98,
      model: selectedDoc.includes('tamper') ? 'ELA-Noise-Residual-Model' : 'Date-Parser-Engine',
      x: 320,
      y: 110,
      w: 190,
      h: 24
    },
    {
      id: 'box-qr',
      type: selectedDoc.includes('bad_qr') ? 'tamper' : 'qr',
      field: 'QR Code & HMAC Signature',
      value: selectedDoc.includes('bad_qr') ? 'HMAC-SHA256 INVALID' : 'HMAC-SHA256 VALID',
      confidence: 0.999,
      model: 'Cryptographic-HMAC-Verifier',
      x: 35,
      y: 430,
      w: 90,
      h: 90
    },
    {
      id: 'box-seal',
      type: selectedDoc.includes('copy_move') ? 'tamper' : 'seal',
      field: 'Institutional Round Stamp',
      value: selectedDoc.includes('copy_move') ? 'Copy-Move Cloned Seal' : 'Official State Seal',
      confidence: selectedDoc.includes('copy_move') ? 0.93 : 0.98,
      model: selectedDoc.includes('copy_move') ? 'ORB-Feature-Matcher' : 'HoughCircles-OpenCV',
      x: 230,
      y: 435,
      w: 80,
      h: 80
    },
    {
      id: 'box-sig',
      type: selectedDoc.includes('untrusted') ? 'tamper' : 'signature',
      field: 'Authorized Signatory Block',
      value: selectedDoc.includes('untrusted') ? 'Contract Staffing Agent' : 'Dr. R. K. Sharma (Chief Fire Officer)',
      confidence: 0.96,
      model: 'PKI-Trust-Store-Lookup',
      x: 360,
      y: 445,
      w: 160,
      h: 55
    }
  ];

  // Trigger Scanning Animation whenever document changes (Minimum 2.5s)
  useEffect(() => {
    setIsScanning(true);
    setScanProgress(0);
    setCurrentStepIndex(0);

    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < pipelineSteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          setIsScanning(false);
          return prev;
        }
      });
      setScanProgress((prev) => Math.min(prev + 13, 100));
    }, 380);

    return () => clearInterval(stepInterval);
  }, [selectedDoc]);

  // Keyboard Navigation: J/K findings, Z zoom, H heatmap, A accept, D deficiency, Esc close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeBox) setActiveBox(null);
        else if (activeActionModal) setActiveActionModal(null);
        else onClose();
      } else if (e.key === 'h' || e.key === 'H') {
        setShowHeatmap((prev) => !prev);
      } else if (e.key === 'z' || e.key === 'Z') {
        setZoomLevel((prev) => (prev >= 175 ? 100 : prev + 35));
      } else if (e.key === 'a' || e.key === 'A') {
        setActiveActionModal('ACCEPT');
      } else if (e.key === 'd' || e.key === 'D') {
        setActiveActionModal('DEFICIENCY');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeBox, activeActionModal, onClose]);

  // Submit Official Regulatory Action with mandatory written remarks to audit trail
  const handleConfirmAction = (actionType: string) => {
    if (!actionRemarks.trim()) {
      alert("Mandatory written remarks are required under AICTE Regulatory Procedure.");
      return;
    }
    const auditId = `AUDIT-LOG-${Math.floor(100000 + Math.random() * 900000)}`;
    setAuditConfirmationToast({
      id: auditId,
      msg: `Official Action '${actionType}' recorded. Entry #${auditId} chained to immutable cryptographic ledger.`
    });
    setActiveActionModal(null);
    setActionRemarks('');

    setTimeout(() => {
      setAuditConfirmationToast(null);
    }, 5000);
  };

  const isTamperedCase = selectedDoc.includes('tamper') || selectedDoc.includes('copy_move');
  const isExpiredCase = selectedDoc.includes('expired');
  const isDuplicateCase = selectedDoc.includes('duplicate');
  const isInvalidSigCase = selectedDoc.includes('bad_qr') || selectedDoc.includes('untrusted');

  const overallVerdict = isTamperedCase || isDuplicateCase
    ? 'Suspicious indicators found'
    : isExpiredCase || isInvalidSigCase
      ? 'Needs official review'
      : 'Looks consistent';

  const verdictBadgeColor = isTamperedCase || isDuplicateCase
    ? 'bg-red-600 text-white'
    : isExpiredCase || isInvalidSigCase
      ? 'bg-amber-500 text-white'
      : 'bg-green-600 text-white';

  return (
    <div className="fixed inset-0 z-50 bg-navy-950 text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* 1. Forensic Scanner Header */}
      <header className="h-14 bg-navy-900 border-b border-navy-800 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-navy-800 transition-colors flex items-center gap-1.5 text-12 font-bold"
            title="Exit Scan View (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Exit Scanner</span>
          </button>

          <div className="h-5 w-px bg-navy-700" />

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-saffron-500/20 text-saffron-400 border border-saffron-500/40">
              FORENSIC SCANNER
            </span>
            <span className="text-13 font-bold text-white font-mono truncate max-w-[200px] sm:max-w-xs">
              {selectedDoc}
            </span>
          </div>
        </div>

        {/* Demo Pack Document Selector (Quick Stage Switching) */}
        <div className="flex items-center gap-2">
          <span className="text-11 text-gov-muted hidden md:inline">Demo Pack:</span>
          <select
            value={selectedDoc}
            onChange={(e) => setSelectedDoc(e.target.value)}
            className="text-11 bg-navy-950 border border-navy-700 rounded-lg px-2.5 py-1 text-slate-200 outline-none focus:border-saffron-500"
          >
            {demoPackFiles.map((f) => (
              <option key={f.name} value={f.name}>
                {f.label} ({f.verdict})
              </option>
            ))}
          </select>

          {/* Quick Heatmap Toggle button */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-2.5 py-1 rounded-lg text-11 font-semibold flex items-center gap-1.5 transition-all ${
              showHeatmap
                ? 'bg-saffron-500 text-white shadow-sm'
                : 'bg-navy-800 text-slate-300 hover:bg-navy-700'
            }`}
            title="Toggle ELA Heatmap (H)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">ELA Heatmap</span>
          </button>
        </div>
      </header>

      {/* 2. Main Full-Screen 3-Zone Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ================================================================= */}
        {/* ZONE 1: LEFT RAIL (Thumbnails & Live Step Checklist)              */}
        {/* ================================================================= */}
        <aside className="w-64 bg-navy-900/80 border-r border-navy-800 flex flex-col justify-between shrink-0 overflow-y-auto p-3.5 hidden md:flex">
          <div>
            <div className="text-11 font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>Pipeline Steps</span>
              {isScanning && <span className="text-[10px] text-saffron-400 animate-pulse font-mono">Ticking...</span>}
            </div>

            {/* Checklist items ticking live */}
            <div className="space-y-1.5">
              {pipelineSteps.map((s, idx) => {
                const Icon = s.icon;
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex && isScanning;

                return (
                  <div
                    key={s.id}
                    className={`p-2 rounded-xl text-11 flex items-center justify-between transition-all ${
                      isCurrent
                        ? 'bg-saffron-500/20 text-saffron-300 border border-saffron-500/40'
                        : isCompleted
                          ? 'bg-navy-950/60 text-slate-300'
                          : 'text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{s.label}</span>
                    </div>

                    {isCurrent ? (
                      <RefreshCw className="w-3 h-3 text-saffron-400 animate-spin shrink-0" />
                    ) : isCompleted ? (
                      <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-navy-700 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Document Thumbnail Preview */}
            <div className="mt-6 pt-4 border-t border-navy-800">
              <span className="text-11 font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                Page Thumbnail
              </span>
              <div className="p-2 rounded-xl bg-navy-950 border border-navy-700/80 hover:border-saffron-500 cursor-pointer text-center">
                <div className="w-full h-36 bg-slate-100 rounded-lg flex flex-col items-center justify-center p-2 text-navy-900 shadow-inner">
                  <FileText className="w-8 h-8 text-navy-700 mb-1" />
                  <span className="text-[10px] font-bold font-mono">Page 1 of 1</span>
                  <span className="text-[9px] text-gov-muted truncate max-w-[120px]">{selectedDoc}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Keyboard shortcut hint */}
          <div className="mt-4 pt-3 border-t border-navy-800 text-[10px] text-slate-400 space-y-1 font-mono">
            <div><kbd className="px-1 bg-navy-950 rounded">H</kbd> Toggle Heatmap</div>
            <div><kbd className="px-1 bg-navy-950 rounded">Z</kbd> Magnifier Zoom</div>
            <div><kbd className="px-1 bg-navy-950 rounded">A</kbd> Accept • <kbd className="px-1 bg-navy-950 rounded">D</kbd> Deficiency</div>
          </div>
        </aside>

        {/* ================================================================= */}
        {/* ZONE 2: CENTRE CANVAS (~55% Viewport with Zoom, Pan, Watermark)   */}
        {/* ================================================================= */}
        <main className="flex-1 bg-navy-950 flex flex-col relative overflow-hidden">
          {/* Top Viewer Toolbar: Zoom / Pan / Rotate */}
          <div className="h-11 bg-navy-900/60 border-b border-navy-800/80 px-4 flex items-center justify-between text-12 text-slate-300 shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 15, 60))}
                className="p-1 rounded hover:bg-navy-800 text-slate-300 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-11 w-12 text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 15, 200))}
                className="p-1 rounded hover:bg-navy-800 text-slate-300 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="px-2 py-0.5 rounded text-[11px] hover:bg-navy-800 text-gov-muted hover:text-white"
              >
                Fit Width
              </button>
            </div>

            {/* Center: Dynamic Watermark Badge Notice */}
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded border border-amber-400/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official Watermark Protected</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1 rounded hover:bg-navy-800 text-slate-300 hover:text-white"
                title="Rotate 90 degrees"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1 rounded hover:bg-navy-800 text-slate-300 hover:text-white"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Interactive Document Canvas Viewport */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-6 relative bg-navy-950/90">
            {/* The Document Sheet Mockup */}
            <motion.div
              style={{
                scale: zoomLevel / 100,
                rotate: rotation,
                transformOrigin: 'center center'
              }}
              transition={{ duration: 0.2 }}
              className="relative w-[560px] h-[780px] bg-[#FDFBF7] text-navy-900 rounded shadow-2xl overflow-hidden border-2 border-slate-300 select-none shrink-0"
            >
              {/* Dynamic Forensic Watermark Burned in across document */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center rotate-[-35deg] opacity-15 text-navy-900 font-mono text-14 font-black tracking-widest text-center">
                <span>{user?.name || "Dr. Arvind Joshi"} | {new Date().toISOString()} | AICTE/EOA/2026/MH-PUNE-402</span>
              </div>

              {/* Saffron-to-White Scanning Line Sweep Animation */}
              {isScanning && (
                <motion.div
                  initial={{ top: '0%' }}
                  animate={{ top: '100%' }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-saffron-500 to-white shadow-[0_0_15px_#FF9933] z-30 pointer-events-none"
                />
              )}

              {/* Corner Brackets Snapping onto Page Edges */}
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-saffron-500 z-20 pointer-events-none" />
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-saffron-500 z-20 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-saffron-500 z-20 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-saffron-500 z-20 pointer-events-none" />

              {/* Document Sheet Content */}
              <div className="p-8 h-full flex flex-col justify-between text-11 relative">
                {/* Header Banner */}
                <div>
                  <div className="bg-saffron-500 text-white font-bold text-center py-1 text-10 uppercase tracking-widest rounded-xs mb-3">
                    भारत सरकार • GOVERNMENT OF INDIA • REGULATORY ARCHIVE
                  </div>
                  <h2 className="text-16 font-black text-center text-navy-900 uppercase tracking-wide">
                    {selectedDoc.replace(/_/g, ' ').replace('.pdf', '').replace('.png', '').replace('.jpg', '')}
                  </h2>
                  <p className="text-center text-[10px] text-gov-muted">Extension of Approval Verification Dossier • Cycle 2026-27</p>
                  <hr className="my-3 border-slate-300" />
                </div>

                {/* Body Content Representation */}
                <div className="space-y-3 text-10 text-slate-800">
                  <p><strong>Certificate Ref:</strong> NOC-FIRE-2025-9921</p>
                  <p><strong>Permanent Institute ID:</strong> {selectedDoc.includes('fee_receipt_id_mismatch') ? 'AICTE-1-9999999' : 'AICTE-1-3324901'}</p>
                  <p>
                    <strong>Validity Upto: </strong>
                    <span className={selectedDoc.includes('tamper') ? 'bg-red-200 text-red-800 font-bold px-1 rounded' : ''}>
                      {selectedDoc.includes('tamper') ? '31/12/2035 [MODIFIED]' : selectedDoc.includes('expired') ? '14/01/2024' : '09/04/2028'}
                    </span>
                  </p>
                  <div className="p-3 rounded bg-slate-100 border border-slate-200 space-y-1.5 text-[9.5px]">
                    <p>1. Institutional premises verified against statutory Master Plan.</p>
                    <p>2. Built-up educational floor area meets threshold norms.</p>
                    <p>3. Faculty-Student Ratio complies with 1:20 ceiling.</p>
                    <p>4. All cryptographic digital signatures validated under IT Act 2000.</p>
                  </div>
                </div>

                {/* Bottom Stamps & Signatures */}
                <div className="flex items-end justify-between pt-4 border-t border-slate-300">
                  <div className="w-20 h-20 border border-slate-400 bg-white p-1 rounded flex items-center justify-center font-mono text-[9px] text-slate-500">
                    [QR CODE]
                  </div>

                  <div className="w-16 h-16 rounded-full border-2 border-navy-900 flex items-center justify-center text-[8px] font-bold text-navy-900 text-center leading-tight">
                    OFFICIAL<br />SEAL
                  </div>

                  <div className="text-right">
                    <div className="font-serif italic text-14 text-navy-900">Dr. R. K. Sharma</div>
                    <div className="text-[9px] font-bold">Chief Fire Officer</div>
                    <div className="text-[8px] text-gov-muted">Authorized Signatory</div>
                  </div>
                </div>
              </div>

              {/* Forensic ELA Heatmap Overlay (Toggleable with opacity slider) */}
              {showHeatmap && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: heatmapOpacity }}
                  className="absolute inset-0 pointer-events-none bg-gradient-to-br from-red-600/30 via-amber-500/40 to-blue-600/20 mix-blend-multiply z-25 flex items-center justify-center"
                >
                  <div className="text-white bg-black/70 px-3 py-1.5 rounded-lg text-12 font-mono font-bold">
                    [ELA COMPRESSION RESIDUAL HEATMAP ACTIVE]
                  </div>
                </motion.div>
              )}

              {/* Interactive Bounding Boxes Overlaid onto Document */}
              {boundingBoxes.map((box) => {
                const isSelected = activeBox?.id === box.id;
                const isHovered = hoveredBox?.id === box.id;

                let borderStyle = 'border-blue-500 bg-blue-500/15';
                if (box.type === 'qr') borderStyle = 'border-green-500 bg-green-500/15';
                else if (box.type === 'signature') borderStyle = 'border-purple-500 bg-purple-500/15';
                else if (box.type === 'seal') borderStyle = 'border-amber-500 bg-amber-500/15';
                else if (box.type === 'tamper') borderStyle = 'border-red-600 bg-red-600/25 animate-pulse';

                return (
                  <div
                    key={box.id}
                    onClick={() => setActiveBox(box)}
                    onMouseEnter={() => setHoveredBox(box)}
                    onMouseLeave={() => setHoveredBox(null)}
                    style={{
                      left: `${box.x}px`,
                      top: `${box.y}px`,
                      width: `${box.w}px`,
                      height: `${box.h}px`
                    }}
                    className={`absolute border-2 rounded cursor-pointer transition-all z-20 ${borderStyle} ${
                      isSelected ? 'ring-4 ring-saffron-500 shadow-lg' : ''
                    }`}
                  >
                    {/* Tooltip on Hover */}
                    {isHovered && (
                      <div className="absolute bottom-full left-0 mb-1 px-2.5 py-1 rounded bg-navy-950 text-white text-[10px] font-mono whitespace-nowrap z-40 border border-slate-700 shadow-lg">
                        <strong className="text-saffron-400">{box.field}: </strong>
                        <span>{box.value}</span> ({Math.round(box.confidence * 100)}% conf)
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          </div>
        </main>

        {/* ================================================================= */}
        {/* ZONE 3: RIGHT AUTHENTICITY REPORT (~35% Width, Collapsible Cards) */}
        {/* ================================================================= */}
        <aside className="w-80 lg:w-96 bg-navy-900 border-l border-navy-800 flex flex-col justify-between shrink-0 overflow-y-auto p-4 space-y-4">
          <div className="space-y-4">
            {/* 1. Overall Verdict Banner */}
            <div className={`p-4 rounded-2xl ${verdictBadgeColor} shadow-md`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-11 font-bold uppercase tracking-wider">AI Scrutiny Verdict</span>
                <span className="text-[11px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded">97% Conf</span>
              </div>
              <h3 className="text-17 font-black tracking-tight">{overallVerdict}</h3>
              <p className="text-[11px] mt-1 opacity-90 leading-relaxed">
                AI result is advisory. Final regulatory decisions are strictly authorized by designated AICTE Scrutiny Officials with mandatory written remarks.
              </p>
            </div>

            {/* 2. Extracted Fields vs Institute Record */}
            <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800">
              <button
                onClick={() => toggleCard('fields')}
                className="w-full flex items-center justify-between text-12 font-bold text-white mb-2"
              >
                <span>Extracted Fields vs Record</span>
                {collapsedCards.fields ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {!collapsedCards.fields && (
                <div className="space-y-2 text-11">
                  <div className="flex items-center justify-between p-2 rounded bg-navy-900">
                    <span className="text-gov-muted">Institute ID:</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-slate-300">{selectedDoc.includes('fee_receipt_id_mismatch') ? 'AICTE-1-9999999' : 'AICTE-1-3324901'}</span>
                      {selectedDoc.includes('fee_receipt_id_mismatch') ? (
                        <X className="w-3.5 h-3.5 text-red-500" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-navy-900">
                    <span className="text-gov-muted">Validity:</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className={isExpiredCase ? 'text-red-400 font-bold' : 'text-slate-300'}>
                        {isExpiredCase ? '2024-01-14 (Expired)' : '2028-04-09 (Valid)'}
                      </span>
                      {isExpiredCase ? <X className="w-3.5 h-3.5 text-red-500" /> : <Check className="w-3.5 h-3.5 text-green-400" />}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. QR / Barcode Verification */}
            <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-12 font-bold text-white flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-saffron-400" />
                  <span>QR Code & HMAC Signature</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  selectedDoc.includes('bad_qr') ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                }`}>
                  {selectedDoc.includes('bad_qr') ? 'HMAC INVALID' : 'HMAC VALID'}
                </span>
              </div>
              <p className="text-11 text-slate-300">
                {selectedDoc.includes('bad_qr')
                  ? 'Cryptographic HMAC signature mismatch: payload altered or forged key.'
                  : 'SHA-256 HMAC signature verified against Ministry of Education trust root.'}
              </p>
            </div>

            {/* 4. Digital Signature & Signer Trust Store */}
            <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-12 font-bold text-white">Digital Signature</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  selectedDoc.includes('untrusted') ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                }`}>
                  {selectedDoc.includes('untrusted') ? 'SIGNER NOT TRUSTED' : 'SIGNER TRUSTED'}
                </span>
              </div>
              <div className="text-11 space-y-1 text-slate-300">
                <div><strong>Signer:</strong> {selectedDoc.includes('untrusted') ? 'Contract Staffing Agent' : 'Dr. R. K. Sharma'}</div>
                <div><strong>Designation:</strong> {selectedDoc.includes('untrusted') ? 'External Agency' : 'Chief Fire Officer'}</div>
              </div>
            </div>

            {/* 5. Tamper Analysis & Heatmap Opacity */}
            <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-12 font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Tamper & ELA Analysis</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  isTamperedCase ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                }`}>
                  {isTamperedCase ? 'SUSPICIOUS (94%)' : 'CLEAN (4%)'}
                </span>
              </div>
              {isTamperedCase ? (
                <p className="text-11 text-red-400 font-medium">
                  Compression level around validity date differs markedly from surrounding page.
                </p>
              ) : (
                <p className="text-11 text-slate-300">
                  Uniform error level distribution across all character glyphs and background noise.
                </p>
              )}

              {/* Opacity slider for heatmap */}
              <div className="mt-3 pt-2 border-t border-navy-800 flex items-center gap-2 text-11">
                <span className="text-gov-muted text-[10px]">Heatmap:</span>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={heatmapOpacity}
                  onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
                  className="flex-1 accent-saffron-500 h-1"
                />
                <span className="font-mono text-[10px]">{Math.round(heatmapOpacity * 100)}%</span>
              </div>
            </div>

            {/* 6. Issuing Authority Gateway (Simulated Source) */}
            <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-12 font-bold text-white">Issuing Authority</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-600 text-white">
                  SIMULATED SOURCE
                </span>
              </div>
              <p className="text-11 text-slate-300">
                Verified against Municipal Fire Directorate & National DigiLocker repository (Simulated Gateway).
              </p>
            </div>
          </div>

          {/* Sticky Bottom Action Buttons */}
          <div className="pt-3 border-t border-navy-800 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Official Decision Actions
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveActionModal('ACCEPT')}
                className="py-2 px-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-11 font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept Document</span>
              </button>

              <button
                onClick={() => setActiveActionModal('DEFICIENCY')}
                className="py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-11 font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Raise Deficiency</span>
              </button>

              <button
                onClick={() => setActiveActionModal('MANUAL_VERIFY')}
                className="py-2 px-3 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-200 text-11 font-semibold flex items-center justify-center gap-1.5 border border-navy-700 transition-all"
              >
                <span>Manual Check</span>
              </button>

              <button
                onClick={() => setActiveActionModal('PHYSICAL_INSPECTION')}
                className="py-2 px-3 rounded-xl bg-red-700 hover:bg-red-600 text-white text-11 font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Inspection</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* 3. Mandatory Remarks Modal for Audit Trail Logging */}
      {activeActionModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-navy-900 border border-navy-700 rounded-2xl p-6 shadow-2xl text-slate-100"
          >
            <div className="flex items-center justify-between pb-3 border-b border-navy-800 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-saffron-500" />
                <h3 className="text-16 font-bold">Mandatory Scrutiny Remarks: {activeActionModal}</h3>
              </div>
              <button
                onClick={() => setActiveActionModal(null)}
                className="p-1 rounded text-gov-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-12 text-slate-300 mb-3">
              Under statutory AICTE regulations, all official approvals or adverse findings must carry signed regulatory justification written to the hash-chained audit ledger.
            </p>

            <textarea
              rows={4}
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
              placeholder="Enter official reasoning, statutory clause reference, and findings..."
              className="w-full p-3 rounded-xl bg-navy-950 border border-navy-700 text-13 text-slate-200 outline-none focus:border-saffron-500 mb-4"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setActiveActionModal(null)}
                className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-300 text-12 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmAction(activeActionModal)}
                className="px-5 py-2 rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white text-12 font-bold shadow-md shadow-saffron-500/20"
              >
                Record Decision to Ledger
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 4. Audit Confirmation Toast */}
      {auditConfirmationToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-green-950 border-2 border-green-500 text-white shadow-2xl flex items-center gap-3 text-12 max-w-md animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
          <div>
            <strong className="block text-green-300">Decision Chained to Audit Trail</strong>
            <span>{auditConfirmationToast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
};
