import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../context/authStore';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText, CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert,
  ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, Eye, EyeOff,
  Sliders, Download, Check, X, ArrowLeft, ArrowRight, CornerDownRight,
  QrCode, Stamp, FileCheck, Layers, Sparkles, AlertCircle, Clock,
  ChevronDown, ChevronRight, ChevronUp, User, Building, HelpCircle, FileSearch, RefreshCw,
  Sun, Moon, Globe, Compass
} from 'lucide-react';

export interface ScanViewProps {
  onClose?: () => void;
  documentId?: string;
  initialFileName?: string;
}

export interface BoundingBox {
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

import { API_BASE } from '../config/api';

export const ScanView: React.FC<ScanViewProps> = ({
  onClose,
  documentId = 'doc-demo-01',
  initialFileName
}) => {
  const { appId, studentId, docId } = useParams<{ appId?: string; studentId?: string; docId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleExit = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/official/dashboard');
    }
  };

  const defaultDoc = docId 
    ? (docId.endsWith('.pdf') ? docId : `${docId}.pdf`) 
    : (initialFileName || 'fire_noc_clean.pdf');

  const { theme, setTheme, language, setLanguage } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  // Presenter mode state: Shift+D or ?presenter=1
  const isPresenterFromQuery = searchParams.get('presenter') === '1';
  const [isPresenterKeyActive, setIsPresenterKeyActive] = useState<boolean>(false);
  const showDemoPack = isPresenterFromQuery || isPresenterKeyActive;

  // Selected Demo Pack document for stage evaluation
  const [selectedDoc, setSelectedDoc] = useState<string>(defaultDoc);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageWidth, setPageWidth] = useState<number>(1241);
  const [pageHeight, setPageHeight] = useState<number>(1754);
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([]);
  const [ocrWords, setOcrWords] = useState<any[]>([]);

  // Stage transform state: translate(x, y) scale(s) rotate(deg) acting strictly on .stage
  const [stageScale, setStageScale] = useState<number>(0.5);
  const [stageX, setStageX] = useState<number>(0);
  const [stageY, setStageY] = useState<number>(0);
  const [stageRotate, setStageRotate] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialFitDone, setInitialFitDone] = useState<boolean>(false);

  const viewportRef = useRef<HTMLDivElement>(null);

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
    authority: false
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

  // Fetch document 150 DPI metadata & real detector bounding boxes
  useEffect(() => {
    let isMounted = true;
    async function fetchMetadata() {
      try {
        const resp = await fetch(`${API_BASE}/documents/${selectedDoc}/metadata`);
        if (resp.ok) {
          const data = await resp.json();
          if (isMounted) {
            setPageWidth(data.page_width || 1241);
            setPageHeight(data.page_height || 1754);
            setBoundingBoxes(data.boxes || []);
            setOcrWords(data.ocr_words || []);
          }
        }
      } catch (e) {
        console.warn('Metadata endpoint fallback:', e);
      }
    }
    fetchMetadata();
    return () => { isMounted = false; };
  }, [selectedDoc, currentPage]);

  // Centering & Fit to View (Overview Transform)
  const handleOverview = () => {
    setActiveBox(null);
    setIsAnimating(true);
    if (!viewportRef.current) return;

    const rect = viewportRef.current.getBoundingClientRect();
    const vW = rect.width;
    const vH = rect.height;

    const pad = 48;
    const fitScale = Math.min((vW - pad) / pageWidth, (vH - pad) / pageHeight);
    const clampedScale = Math.max(0.2, Math.min(fitScale, 1.5));

    const tx = (vW - pageWidth * clampedScale) / 2;
    const ty = (vH - pageHeight * clampedScale) / 2;

    setStageScale(clampedScale);
    setStageX(tx);
    setStageY(ty);
    setStageRotate(0);

    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  // Auto-fit overview on initial document load or change
  useEffect(() => {
    const timer = setTimeout(() => {
      handleOverview();
    }, 120);
    return () => clearTimeout(timer);
  }, [selectedDoc, pageWidth, pageHeight]);

  // Click-to-Zoom: Animate stage transform to fit region with 20% padding over 500ms
  const handleZoomToRegion = (box: BoundingBox) => {
    if (!viewportRef.current) return;
    setActiveBox(box);
    setIsAnimating(true);

    const rect = viewportRef.current.getBoundingClientRect();
    const vW = rect.width;
    const vH = rect.height;

    // 20% padding around region (scale factor 1.4)
    const paddedW = Math.max(box.w * 1.4, 180);
    const paddedH = Math.max(box.h * 1.4, 120);

    const targetScale = Math.min(vW / paddedW, vH / paddedH);
    const targetScaleClamped = Math.max(0.6, Math.min(targetScale, 3.2));

    const boxCenterX = box.x + box.w / 2;
    const boxCenterY = box.y + box.h / 2;

    const tx = vW / 2 - targetScaleClamped * boxCenterX;
    const ty = vH / 2 - targetScaleClamped * boxCenterY;

    setStageScale(targetScaleClamped);
    setStageX(tx);
    setStageY(ty);

    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  // Zoom controls acting on .stage
  const handleZoomIn = () => {
    setIsAnimating(true);
    setStageScale((prev) => Math.min(prev * 1.25, 4.0));
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleZoomOut = () => {
    setIsAnimating(true);
    setStageScale((prev) => Math.max(prev / 1.25, 0.2));
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleRotate = () => {
    setIsAnimating(true);
    setStageRotate((prev) => (prev + 90) % 360);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleFitWidth = () => {
    if (!viewportRef.current) return;
    setIsAnimating(true);
    const rect = viewportRef.current.getBoundingClientRect();
    const fitWScale = (rect.width - 32) / pageWidth;
    setStageScale(fitWScale);
    setStageX(16);
    setStageY(24);
    setTimeout(() => setIsAnimating(false), 500);
  };

  // Pan interaction on viewport
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setIsAnimating(false);
    setPanStart({ x: e.clientX - stageX, y: e.clientY - stageY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setStageX(e.clientX - panStart.x);
    setStageY(e.clientY - panStart.y);
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Scanning animation sequence
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setIsPresenterKeyActive((prev) => !prev);
      } else if (e.key === 'Escape' || e.key === 'o' || e.key === 'O') {
        if (activeBox) handleOverview();
        else if (activeActionModal) setActiveActionModal(null);
        else if (e.key === 'Escape') handleExit();
      } else if (e.key === 'h' || e.key === 'H') {
        setShowHeatmap((prev) => !prev);
      } else if (e.key === 'z' || e.key === 'Z') {
        handleZoomIn();
      } else if (e.key === 'a' || e.key === 'A') {
        setActiveActionModal('ACCEPT');
      } else if (e.key === 'd' || e.key === 'D') {
        setActiveActionModal('DEFICIENCY');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeBox, activeActionModal, handleExit, stageScale, pageWidth, pageHeight]);

  // Submit Official Regulatory Action with mandatory written remarks
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

  // Color mapping by rectangle type
  const getBoxColors = (type: string) => {
    switch (type) {
      case 'text':
        return { stroke: '#2563EB', fill: 'rgba(37, 99, 235, 0.12)', name: 'Blue (Text Field)' };
      case 'qr':
        return { stroke: '#16A34A', fill: 'rgba(22, 163, 74, 0.12)', name: 'Green (QR Code)' };
      case 'signature':
        return { stroke: '#9333EA', fill: 'rgba(147, 51, 234, 0.12)', name: 'Purple (Signature)' };
      case 'seal':
        return { stroke: '#EA580C', fill: 'rgba(234, 88, 12, 0.12)', name: 'Orange (Seal)' };
      case 'tamper':
      default:
        return { stroke: '#DC2626', fill: 'rgba(220, 38, 38, 0.12)', name: 'Red (Suspicious)' };
    }
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
    <div className="contents text-slate-100 font-sans select-none">
      {/* =================================================================== */}
      {/* 1. TOP BAR: One row, 56px, no wrapping, strictly unified            */}
      {/* =================================================================== */}
      <header className="h-14 bg-navy-900 border-b border-navy-800 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 shrink-0 shadow-md whitespace-nowrap overflow-x-auto sm:overflow-hidden select-none z-30">
        {/* Left Section: Exit scanner, FORENSIC SCANNER tag, file name */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={handleExit}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-navy-800 transition-colors flex items-center gap-1.5 text-12 font-bold cursor-pointer"
            title="Exit Scanner (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Exit Scanner</span>
          </button>

          <div className="h-5 w-px bg-navy-700" />

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-saffron-500/20 text-saffron-400 border border-saffron-500/40">
              FORENSIC SCANNER
            </span>
            <span
              className="text-13 font-bold text-white font-mono truncate max-w-[150px] sm:max-w-[220px]"
              title={selectedDoc}
            >
              {selectedDoc}
            </span>
          </div>
        </div>

        {/* Center Section: Stage Zoom, Pan, Rotate, Fit, and Overview controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Zoom Controls acting on .stage */}
          <div className="flex items-center gap-1 bg-navy-950/80 border border-navy-700/80 rounded-lg px-2 py-0.5 text-12">
            <button
              onClick={handleZoomOut}
              className="p-1 rounded hover:bg-navy-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[12px] tabular-nums font-semibold text-slate-200 w-12 text-center font-mono">
              {Math.round(stageScale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 rounded hover:bg-navy-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRotate}
              className="p-1 rounded hover:bg-navy-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Rotate 90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleFitWidth}
              className="px-1.5 py-0.5 rounded text-[11px] hover:bg-navy-800 text-slate-400 hover:text-white transition-colors cursor-pointer font-medium"
              title="Fit to Width"
            >
              Fit Width
            </button>
            <button
              onClick={handleOverview}
              className="px-2 py-0.5 rounded text-[11px] bg-navy-800 hover:bg-navy-700 text-saffron-400 font-bold transition-colors cursor-pointer flex items-center gap-1"
              title="Return to Full Overview (O)"
            >
              <Compass className="w-3 h-3" />
              Overview
            </button>
          </div>

          {/* Active Region Zoomed Pill Indicator */}
          {activeBox && (
            <button
              onClick={handleOverview}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-11 font-semibold bg-saffron-500/20 text-saffron-300 border border-saffron-500/50 hover:bg-saffron-500/30 transition-all cursor-pointer animate-pulse"
              title="Click to return to overview"
            >
              <span>Target: {activeBox.field}</span>
              <X className="w-3.5 h-3.5 text-saffron-400" />
            </button>
          )}

          {/* ELA Heatmap Toggle */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-2.5 py-1 rounded-lg text-11 font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showHeatmap
                ? 'bg-saffron-500 text-white shadow-xs'
                : 'bg-navy-800 text-slate-300 hover:bg-navy-700'
            }`}
            title="Toggle ELA Residual Heatmap (H)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden md:inline">ELA Heatmap</span>
          </button>

          {/* Watermark Protected Chip */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-medium text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Watermark protected</span>
          </div>
        </div>

        {/* Right Section: Presenter Mode Demo Pack, Theme & Language Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {showDemoPack && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-saffron-400 font-mono hidden xl:inline">
                Demo Pack:
              </span>
              <select
                value={selectedDoc}
                onChange={(e) => {
                  setSelectedDoc(e.target.value);
                  setActiveBox(null);
                }}
                className="text-11 bg-navy-950 border border-saffron-500/60 rounded-lg px-2 py-1 text-slate-200 outline-none focus:border-saffron-400 max-w-[170px]"
                title="Presenter Mode Document Selector"
              >
                {demoPackFiles.map((f) => (
                  <option key={f.name} value={f.name}>
                    {isScanning ? f.label : `${f.label} (${f.verdict})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-300" />}
          </button>

          <div className="flex items-center bg-navy-950 border border-navy-800 rounded-lg p-0.5 text-[11px]">
            <button
              onClick={() => setLanguage('en')}
              className={`px-1.5 py-0.5 rounded ${language === 'en' ? 'bg-navy-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              title="English"
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-1.5 py-0.5 rounded ${language === 'hi' ? 'bg-navy-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              title="Hindi"
            >
              हिं
            </button>
            <button
              onClick={() => setLanguage('mr')}
              className={`px-1.5 py-0.5 rounded ${language === 'mr' ? 'bg-navy-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              title="Marathi"
            >
              म
            </button>
          </div>
        </div>
      </header>

      {/* =================================================================== */}
      {/* 2. MAIN 3-ZONE WORKSPACE GRID                                       */}
      {/* =================================================================== */}
      <div className="grid grid-cols-[64px_minmax(0,1fr)_340px] xl:grid-cols-[240px_minmax(0,1fr)_400px] w-full h-full overflow-hidden relative">
        {/* ================================================================= */}
        {/* ZONE 1: LEFT RAIL (Pipeline Steps & Thumbnails pinned at bottom)  */}
        {/* ================================================================= */}
        <aside className="min-w-0 bg-navy-900/90 border-r border-navy-800 flex flex-col justify-between overflow-hidden p-2.5 xl:p-3.5">
          {/* Top: Pipeline Checklist */}
          <div className="flex-1 overflow-y-auto min-w-0 pr-1">
            <div className="text-[13px] font-bold uppercase tracking-wider text-slate-100 mb-3 flex items-center justify-between">
              <span className="hidden xl:inline">PIPELINE STEPS</span>
              <span className="xl:hidden text-[11px] text-center w-full">STEPS</span>
              {isScanning && <span className="hidden xl:inline text-[10px] text-saffron-400 animate-pulse font-mono">Running</span>}
            </div>

            <div className="space-y-1.5">
              {pipelineSteps.map((s, idx) => {
                const Icon = s.icon;
                const isCompleted = !isScanning || idx < currentStepIndex;
                const isCurrent = isScanning && idx === currentStepIndex;

                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-2.5 p-2 rounded-xl text-12 transition-all ${
                      isCurrent
                        ? 'bg-saffron-500/15 border border-saffron-500/50 text-white shadow-xs font-semibold'
                        : isCompleted
                          ? 'bg-navy-950/70 text-slate-200 border border-transparent'
                          : 'opacity-40 text-slate-400'
                    }`}
                  >
                    <div className="shrink-0 flex items-center justify-center">
                      {isCurrent ? (
                        <RefreshCw className="w-4 h-4 text-saffron-400 animate-spin" />
                      ) : isCompleted ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Icon className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                    <span className="hidden xl:block leading-tight break-words whitespace-normal font-medium flex-1">
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom: Page Thumbnails pinned at the bottom */}
          <div className="mt-auto border-t border-navy-800 pt-3 shrink-0 overflow-y-auto max-h-48 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 block hidden xl:block">
              Page Thumbnails
            </span>
            <div
              onClick={handleOverview}
              className="p-1.5 rounded-xl bg-navy-950 border border-navy-700/80 hover:border-saffron-500 cursor-pointer text-center transition-colors"
            >
              <div className="w-full h-24 xl:h-28 bg-slate-100 rounded-lg flex flex-col items-center justify-center p-1.5 text-navy-900 shadow-inner overflow-hidden relative">
                <img
                  src={`${API_BASE}/documents/${selectedDoc}/pages/1.png`}
                  alt="Thumb"
                  className="w-full h-full object-contain pointer-events-none"
                  onError={(e) => {
                    // Fallback to icon if image loading
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="absolute bottom-1 right-1 bg-navy-900/80 text-white text-[9px] px-1 rounded font-mono">
                  150 DPI
                </span>
              </div>
            </div>

            {/* Quick Keyboard Hints */}
            <div className="hidden xl:block mt-3 text-[10px] text-slate-400 space-y-0.5 font-mono">
              <div><kbd className="px-1 bg-navy-950 rounded">H</kbd> Heatmap • <kbd className="px-1 bg-navy-950 rounded">Z</kbd> Zoom</div>
              <div><kbd className="px-1 bg-navy-950 rounded">O</kbd> Overview • <kbd className="px-1 bg-navy-950 rounded">A</kbd> Accept</div>
            </div>
          </div>
        </aside>

        {/* ================================================================= */}
        {/* ZONE 2: CENTRE CANVAS (Independent pan/zoom stage viewport)       */}
        {/* Built strictly as: .stage > img.page + svg.overlay               */}
        {/* ================================================================= */}
        <main className="min-w-0 bg-navy-950 flex flex-col relative overflow-hidden h-full">
          {/* Interactive Document Viewport */}
          <div
            ref={viewportRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`flex-1 overflow-hidden flex items-center justify-center relative bg-navy-950/95 select-none ${
              isPanning ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {/* Saffron-to-White Scanning Line Sweep Animation */}
            {isScanning && (
              <motion.div
                initial={{ top: '0%' }}
                animate={{ top: '100%' }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-saffron-500 to-white shadow-[0_0_15px_#FF9933] z-40 pointer-events-none"
              />
            )}

            {/* .stage: transform: translate, scale, rotate, transform-origin 0 0 */}
            <div
              className="stage relative select-none shadow-2xl bg-white shrink-0"
              style={{
                width: `${pageWidth}px`,
                height: `${pageHeight}px`,
                transform: `translate(${stageX}px, ${stageY}px) scale(${stageScale}) rotate(${stageRotate}deg)`,
                transformOrigin: '0 0',
                transition: isAnimating ? 'transform 500ms ease-in-out' : 'none'
              }}
            >
              {/* <img class='page'> */}
              <img
                className="page block w-full h-full pointer-events-none"
                src={`${API_BASE}/documents/${selectedDoc}/pages/${currentPage}.png`}
                alt={`Document Page ${currentPage}`}
                width={pageWidth}
                height={pageHeight}
              />

              {/* Forensic ELA Heatmap Overlay */}
              {showHeatmap && (
                <div
                  style={{ opacity: heatmapOpacity }}
                  className="absolute inset-0 pointer-events-none bg-gradient-to-br from-red-600/35 via-amber-500/35 to-blue-600/25 mix-blend-multiply z-20 flex items-center justify-center"
                >
                  <div className="text-white bg-black/80 px-4 py-2 rounded-lg text-14 font-mono font-bold tracking-wider border border-white/20 shadow-2xl">
                    [ELA COMPRESSION RESIDUAL HEATMAP ACTIVE]
                  </div>
                </div>
              )}

              {/* <svg class='overlay' viewBox='0 0 W H' preserveAspectRatio='none'> */}
              <svg
                className="overlay absolute inset-0 w-full h-full pointer-events-auto z-10"
                viewBox={`0 0 ${pageWidth} ${pageHeight}`}
                preserveAspectRatio="none"
              >
                {boundingBoxes.map((box) => {
                  const isSelected = activeBox?.id === box.id;
                  const isHovered = hoveredBox?.id === box.id;
                  const colors = getBoxColors(box.type);

                  return (
                    <g
                      key={box.id}
                      className="cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleZoomToRegion(box);
                      }}
                      onMouseEnter={() => setHoveredBox(box)}
                      onMouseLeave={() => setHoveredBox(null)}
                    >
                      {/* Region Rectangle: 2px stroke, 12% fill, colour by type */}
                      <rect
                        x={box.x}
                        y={box.y}
                        width={box.w}
                        height={box.h}
                        fill={colors.fill}
                        stroke={isSelected ? '#FF9933' : colors.stroke}
                        strokeWidth={isSelected ? '3.5' : '2'}
                        vectorEffect="non-scaling-stroke"
                        rx="3"
                        className="transition-all duration-150"
                      />

                      {/* Label shows on hover only */}
                      {isHovered && (
                        <g
                          transform={`translate(${box.x}, ${Math.max(28, box.y - 8)})`}
                          className="pointer-events-none"
                        >
                          <rect
                            x="0"
                            y="-24"
                            width={Math.max(160, (box.field.length + box.value.length) * 7.5 + 28)}
                            height="28"
                            fill="#0B132B"
                            stroke="#475569"
                            strokeWidth="1"
                            rx="4"
                            opacity="0.96"
                          />
                          <text
                            x="8"
                            y="-6"
                            fill="#FFFFFF"
                            fontSize="12"
                            fontFamily="'Noto Sans', sans-serif"
                            fontWeight="600"
                          >
                            {box.field}: <tspan fill={colors.stroke}>{box.value.length > 28 ? box.value.slice(0, 28) + '…' : box.value}</tspan> ({Math.round(box.confidence * 100)}%)
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </main>

        {/* ================================================================= */}
        {/* ZONE 3: RIGHT AUTHENTICITY REPORT (Type scale & sticky verdict)   */}
        {/* ================================================================= */}
        <aside className="min-w-0 bg-navy-900 border-l border-navy-800 flex flex-col justify-between overflow-y-auto p-4 space-y-4">
          <div className="space-y-3.5">
            {/* 1. Overall Verdict Banner (Sticky at Top) */}
            <div className={`sticky top-0 z-10 p-4 rounded-xl ${verdictBadgeColor} shadow-md backdrop-blur-xs`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/90">
                  AI Scrutiny Verdict
                </span>
                <span className="text-[11px] font-semibold font-mono bg-white/20 px-2 py-0.5 rounded">
                  98% Conf
                </span>
              </div>
              <h3 className="text-[18px] font-bold tracking-tight text-white leading-tight">
                {overallVerdict}
              </h3>
              <p className="text-[11px] mt-1 opacity-90 leading-relaxed text-white">
                AI output is advisory. Mandatory human official sign-off is required under AICTE Regulatory Procedure.
              </p>
            </div>

            {/* 2. Extracted Fields vs Institute Record */}
            <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800">
              <button
                onClick={() => toggleCard('fields')}
                className="w-full flex items-center justify-between text-[14px] font-semibold text-slate-100 mb-2 cursor-pointer"
              >
                <span>Extracted Fields vs Record</span>
                {collapsedCards.fields ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {!collapsedCards.fields && (
                <div className="space-y-2 pt-1">
                  <div
                    onClick={() => {
                      const b = boundingBoxes.find((x) => x.field.includes('Institute ID'));
                      if (b) handleZoomToRegion(b);
                    }}
                    className="flex items-center justify-between p-2 rounded bg-navy-900 hover:bg-navy-800/80 cursor-pointer transition-colors"
                  >
                    <span className="text-[12px] text-slate-400 font-normal">Institute ID:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-medium text-slate-200 tabular-nums">
                        {selectedDoc.includes('fee_receipt_id_mismatch') ? 'AICTE-1-9999999' : 'AICTE-1-3324901'}
                      </span>
                      {selectedDoc.includes('fee_receipt_id_mismatch') ? (
                        <X className="w-3.5 h-3.5 text-red-500" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      )}
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      const b = boundingBoxes.find((x) => x.field.includes('Validity'));
                      if (b) handleZoomToRegion(b);
                    }}
                    className="flex items-center justify-between p-2 rounded bg-navy-900 hover:bg-navy-800/80 cursor-pointer transition-colors"
                  >
                    <span className="text-[12px] text-slate-400 font-normal">Validity Date:</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[14px] font-medium tabular-nums ${isExpiredCase ? 'text-red-400' : 'text-slate-200'}`}>
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
              <button
                onClick={() => toggleCard('qr')}
                className="w-full flex items-center justify-between text-[14px] font-semibold text-slate-100 mb-2 cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-saffron-400" />
                  <span>QR Code & HMAC Signature</span>
                </div>
                {collapsedCards.qr ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {!collapsedCards.qr && (
                <div
                  onClick={() => {
                    const b = boundingBoxes.find((x) => x.type === 'qr' || x.field.includes('QR'));
                    if (b) handleZoomToRegion(b);
                  }}
                  className="pt-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] text-slate-400 font-normal">Payload Status</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      selectedDoc.includes('bad_qr') ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                    }`}>
                      {selectedDoc.includes('bad_qr') ? 'HMAC INVALID' : 'HMAC VALID'}
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-300 leading-relaxed">
                    {selectedDoc.includes('bad_qr')
                      ? 'Cryptographic HMAC signature mismatch: payload altered or forged key.'
                      : 'SHA-256 HMAC signature verified against Ministry of Education trust root.'}
                  </p>
                </div>
              )}
            </div>

            {/* 4. Digital Signature & Signer Trust Store */}
            <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800">
              <button
                onClick={() => toggleCard('signature')}
                className="w-full flex items-center justify-between text-[14px] font-semibold text-slate-100 mb-2 cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  <span>Signatory Trust Store</span>
                </div>
                {collapsedCards.signature ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {!collapsedCards.signature && (
                <div
                  onClick={() => {
                    const b = boundingBoxes.find((x) => x.type === 'signature' || x.field.includes('Signatory'));
                    if (b) handleZoomToRegion(b);
                  }}
                  className="pt-1 space-y-1.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-400 font-normal">Signer Identity</span>
                    <span className="text-[13px] font-medium text-slate-200">
                      {selectedDoc.includes('untrusted') ? 'Contract Staffing Agent' : 'Dr. R. K. Sharma'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-400 font-normal">Trust Root</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      selectedDoc.includes('untrusted') ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                    }`}>
                      {selectedDoc.includes('untrusted') ? 'NOT IN TRUST STORE' : 'PKI TRUSTED'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Institutional Rubber Stamp / Seal Check */}
            <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800">
              <button
                onClick={() => toggleCard('seal')}
                className="w-full flex items-center justify-between text-[14px] font-semibold text-slate-100 mb-2 cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Stamp className="w-4 h-4 text-amber-500" />
                  <span>Institutional Seal & Contour</span>
                </div>
                {collapsedCards.seal ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {!collapsedCards.seal && (
                <div
                  onClick={() => {
                    const b = boundingBoxes.find((x) => x.type === 'seal' || x.field.includes('Stamp'));
                    if (b) handleZoomToRegion(b);
                  }}
                  className="pt-1 space-y-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-400 font-normal">Hough Circles</span>
                    <span className="text-[12px] font-medium text-green-400">DETECTED (98%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-400 font-normal">Copy-Move Seal Check</span>
                    <span className={`text-[12px] font-bold ${selectedDoc.includes('copy_move') ? 'text-red-400' : 'text-slate-300'}`}>
                      {selectedDoc.includes('copy_move') ? 'DUPLICATE CLONE FOUND' : 'SINGLE UNIQUE SEAL'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Tamper & ELA Forensic Analysis */}
            <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800">
              <button
                onClick={() => toggleCard('tamper')}
                className="w-full flex items-center justify-between text-[14px] font-semibold text-slate-100 mb-2 cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-red-400" />
                  <span>Tamper & Compression Residuals</span>
                </div>
                {collapsedCards.tamper ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {!collapsedCards.tamper && (
                <div className="pt-1 space-y-1 text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Error Level Analysis:</span>
                    <span className={`font-semibold ${isTamperedCase ? 'text-red-400' : 'text-green-400'}`}>
                      {isTamperedCase ? 'HIGH COMPRESSION RESIDUAL' : 'UNIFORM RESIDUAL'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Font Stroke Consistency:</span>
                    <span className={`font-semibold ${selectedDoc.includes('tamper') ? 'text-red-400' : 'text-slate-300'}`}>
                      {selectedDoc.includes('tamper') ? 'MODIFIED GLYPH WEIGHT' : 'MATCHES TEMPLATE'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Modals Button Triggers */}
          <div className="pt-3 border-t border-navy-800 space-y-2 shrink-0">
            <button
              onClick={() => setActiveActionModal('ACCEPT')}
              className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-13 flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Verify & Accept Instrument (A)</span>
            </button>

            <button
              onClick={() => setActiveActionModal('DEFICIENCY')}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-13 flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Issue Regulatory Deficiency (D)</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Confirmation Toast */}
      {auditConfirmationToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy-900 border border-green-500/60 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
          <div className="text-12 font-medium">
            {auditConfirmationToast.msg}
          </div>
        </div>
      )}

      {/* Action Modal with Mandatory Written Remarks */}
      {activeActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-navy-900 border border-navy-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-16 font-bold text-white flex items-center gap-2">
              {activeActionModal === 'ACCEPT' ? <CheckCircle2 className="text-green-400" /> : <AlertTriangle className="text-amber-400" />}
              {activeActionModal === 'ACCEPT' ? 'Confirm Document Verification' : 'Issue Regulatory Deficiency'}
            </h3>
            <p className="text-12 text-slate-300">
              Written remarks are mandatory. Every regulatory decision is recorded with officer credentials and chained to the immutable audit log.
            </p>
            <textarea
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
              placeholder="Enter mandatory official scrutiny remarks..."
              rows={4}
              className="w-full p-3 rounded-xl bg-navy-950 border border-navy-700 text-slate-100 text-13 outline-none focus:border-saffron-500"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveActionModal(null)}
                className="px-4 py-2 rounded-xl text-12 font-semibold text-slate-300 hover:bg-navy-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmAction(activeActionModal)}
                className="px-4 py-2 rounded-xl text-12 font-bold bg-saffron-500 hover:bg-saffron-400 text-white cursor-pointer shadow-md"
              >
                Submit Official Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
