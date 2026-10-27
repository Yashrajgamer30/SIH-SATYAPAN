import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Eye, 
  Send, 
  ArrowLeft, 
  ShieldAlert, 
  ZoomIn, 
  RefreshCw 
} from 'lucide-react';
import { AdvisoryBanner, SimulatedSourceBadge, VerificationStatusBadge } from '../components/StatusBadges';

export const ScrutinyDetail: React.FC<{ appId: number; onBack: () => void }> = ({ appId, onBack }) => {
  const { t } = useTranslation();
  
  // Selected finding for evidence viewer
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(0);
  const [officialAction, setOfficialAction] = useState<string>('RECOMMEND_EOA');
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  // Curated demo pack data matching the Demo Pack specification
  const applicationData = {
    application_number: appId === 1 ? "AICTE/EOA/2026/MH-PUNE-402" : "AICTE/EOA/2026/MH-NSK-108",
    academic_year: "2026-2027",
    institute_name: appId === 1 ? "Saraswati Institute of Technology" : "Sahyadri College of Engineering",
    aicte_id: appId === 1 ? "AICTE-1-3324901" : "AICTE-1-8891023",
    district: appId === 1 ? "Pune (Urban)" : "Nashik (Urban)",
    composite_risk_score: appId === 1 ? 4.5 : 78.2,
    risk_level: appId === 1 ? "LOW" : "HIGH",
    findings: appId === 1 ? [
      {
        rule_code: "LAND_AREA_COMPLIANCE",
        status: "VERIFIED" as const,
        confidence: 0.99,
        model_name: "OCR_EXTRACTION_AND_LAND_REGISTRY_CROSSCHECK",
        reason: "Institutional contiguous land of 3.25 Acres verified against State Revenue records. Clear, unencumbered educational title.",
        evidence: {
          document: "7_12_Extract_Survey_402.pdf",
          page: 1,
          field: "Total Land Area",
          extracted_value: "3.25 Acres",
          regulatory_threshold: ">= 2.50 Acres",
          authority_reference: "Mahabhumi Survey No. SRV-PUNE-402",
          bbox: { x: 12, y: 35, w: 42, h: 10 }
        },
        is_simulated_source: true,
        simulated_source_name: "Mahabhumi Land Records"
      },
      {
        rule_code: "FIRE_NOC_VALIDITY",
        status: "VERIFIED" as const,
        confidence: 0.99,
        model_name: "DIGILOCKER_AUTHENTICATION_SERVICE",
        reason: "Valid Fire Safety NOC verified against State Fire Services registry. Covers Academic Block A, B and Central Workshop.",
        evidence: {
          document: "Fire_Safety_Certificate_2024.pdf",
          page: 1,
          field: "Validity Period",
          extracted_value: "Valid up to 14-03-2027",
          authority_reference: "DigiLocker Doc ID: FIRE_NOC_MH_2024_001",
          bbox: { x: 25, y: 52, w: 50, h: 10 }
        },
        is_simulated_source: true,
        simulated_source_name: "National DigiLocker Authority"
      },
      {
        rule_code: "FACULTY_CADRE_RATIO",
        status: "VERIFIED" as const,
        confidence: 0.98,
        model_name: "FACULTY_RATIO_ANALYZER",
        reason: "Student-to-Faculty Ratio is 1:18.2 (well within maximum allowed 1:20). Zero duplicate faculty detected across national database.",
        evidence: {
          document: "Faculty_Cadre_Roster_2026.pdf",
          page: 1,
          field: "Cadre Breakdown",
          extracted_value: "Prof: 4, Assoc: 8, Asst: 26 (Total: 38)",
          bbox: { x: 10, y: 25, w: 75, h: 18 }
        },
        is_simulated_source: true,
        simulated_source_name: "AICTE Faculty Portal"
      }
    ] : [
      {
        rule_code: "LAND_AREA_COMPLIANCE",
        status: "MISMATCH_DETECTED" as const,
        confidence: 0.98,
        model_name: "OCR_EXTRACTION_AND_LAND_REGISTRY_CROSSCHECK",
        reason: "Institutional land area found to be 1.40 Acres. AICTE APH Chapter 1 requires a minimum of 2.50 Acres for an Urban Engineering College.",
        evidence: {
          document: "Deed_Land_Survey_108.pdf",
          page: 1,
          field: "Total Land Area",
          extracted_value: "1.40 Acres",
          regulatory_threshold: ">= 2.50 Acres (Deficit: 1.10 Acres)",
          authority_reference: "Mahabhumi Survey No. SRV-NASHIK-108",
          bbox: { x: 15, y: 38, w: 45, h: 10 }
        },
        is_simulated_source: true,
        simulated_source_name: "Mahabhumi Land Records"
      },
      {
        rule_code: "FIRE_NOC_VALIDITY",
        status: "EXPIRED" as const,
        confidence: 0.99,
        model_name: "DIGILOCKER_AUTHENTICATION_SERVICE",
        reason: "Fire Department NOC expired on 09-Jan-2024. Active fire safety certificate is mandatory under Section 4.3 of APH.",
        evidence: {
          document: "Fire_NOC_Expired_2021.pdf",
          page: 1,
          field: "Validity Period",
          extracted_value: "Expired on 09-01-2024",
          authority_reference: "DigiLocker Doc ID: FIRE_NOC_MH_EXPIRED",
          bbox: { x: 30, y: 55, w: 45, h: 10 }
        },
        is_simulated_source: true,
        simulated_source_name: "National DigiLocker Authority"
      },
      {
        rule_code: "FACULTY_CADRE_RATIO",
        status: "MANUAL_REVIEW_REQUIRED" as const,
        confidence: 0.94,
        model_name: "CROSS_INSTITUTE_DUPLICATE_DETECTOR",
        reason: "Duplicate faculty registration alert: Dr. Ramesh V. Kulkarni is concurrently listed as full-time Professor at Institute AICTE-1-4928191.",
        evidence: {
          document: "Faculty_Roster_Sahyadri.pdf",
          page: 2,
          field: "Faculty Identity & Aadhaar Hash",
          extracted_value: "Dr. Ramesh V. Kulkarni (Comp Engg)",
          authority_reference: "Conflict with Vidya Pratishthan (AICTE-1-4928191)",
          bbox: { x: 8, y: 45, w: 80, h: 10 }
        },
        is_simulated_source: true,
        simulated_source_name: "National Academic Faculty Registry"
      }
    ]
  };

  const activeFinding = applicationData.findings[selectedResultIndex];

  const handleSubmitDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedMessage(`Decision '${officialAction}' and remarks logged to regulatory audit trail.`);
    }, 600);
  };

  return (
    <div className="space-y-4">
      {/* Back button and title */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Application Roster
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500">
            Application: <strong className="text-slate-900">{applicationData.application_number}</strong>
          </span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
            applicationData.risk_level === 'LOW' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}>
            Advisory Risk: {applicationData.risk_level} ({applicationData.composite_risk_score}/100)
          </span>
        </div>
      </div>

      {/* Mandated Principle 1 Advisory Banner */}
      <AdvisoryBanner />

      {/* Main Split-Screen Scrutiny Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Col (5 cols): Automated Findings & Checklist Breakdown */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                AI Scrutiny Findings ({applicationData.findings.length})
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">APH 2026-27</span>
            </div>

            <div className="space-y-2.5">
              {applicationData.findings.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedResultIndex(idx)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    selectedResultIndex === idx
                      ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {item.rule_code}
                    </span>
                    <VerificationStatusBadge status={item.status} />
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2">
                    {item.reason}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Doc: {item.evidence.document}</span>
                    <span className="font-semibold text-slate-700">Confidence: {(item.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Principle 1: Official Scrutiny Action & Human Remarks Drawer */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Official Scrutiny Action (Human Mandate)
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              In accordance with AICTE Scrutiny Guidelines, every adverse or approving action requires an explicit official rationale.
            </p>

            {submittedMessage ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-medium">
                {submittedMessage}
              </div>
            ) : (
              <form onSubmit={handleSubmitDecision} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Regulatory Scrutiny Decision
                  </label>
                  <select
                    value={officialAction}
                    onChange={(e) => setOfficialAction(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="RECOMMEND_EOA">Recommend Extension of Approval (EoA)</option>
                    <option value="ISSUE_DEFICIENCY">Issue Deficiency Communication (Deficiency Memo)</option>
                    <option value="REJECT">Reject / Refer to Appellate Hearing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Remarks & Legal Justification <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter formal observations, referencing specific document pages and handbook clauses..."
                    className="w-full text-xs border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    {t('labels.remarksRequired')}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !remarks.trim()}
                  className="w-full py-2 px-4 rounded text-xs font-bold bg-[#1B365D] hover:bg-[#0F2342] text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Recording Decision...' : t('actions.submitRemarks')}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Col (7 cols): Document Evidence & Explainable Bounding Box Viewer */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-blue-900 block">
                  Document Evidence & Visual Explainability
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {activeFinding.evidence.document} (Page {activeFinding.evidence.page})
                </span>
              </div>
              <SimulatedSourceBadge sourceName={activeFinding.simulated_source_name} />
            </div>

            {/* Simulated Document Viewer with Bounding Box Overlay */}
            <div className="relative border border-slate-300 rounded bg-slate-100 p-6 sm:p-10 min-h-[360px] flex flex-col justify-between overflow-hidden shadow-inner">
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                <span className="text-6xl font-black rotate-[-25deg] text-slate-900">
                  AICTE VERIFICATION
                </span>
              </div>

              {/* Simulated Certificate Header */}
              <div className="border-b-2 border-slate-300 pb-3 mb-4 text-center">
                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  Government of Maharashtra • Regulatory Authority
                </p>
                <h4 className="text-sm font-bold text-slate-900 uppercase">
                  {activeFinding.rule_code.replace(/_/g, ' ')} CERTIFICATION RECORD
                </h4>
                <p className="text-[10px] text-slate-500">
                  Issued to: {applicationData.institute_name} ({applicationData.aicte_id})
                </p>
              </div>

              {/* Simulated Certificate Body with Dynamic Highlight Bounding Box */}
              <div className="relative space-y-3 text-xs text-slate-700 leading-relaxed font-serif">
                <p>
                  This is to certify that the premises and records registered under Survey reference <strong>{activeFinding.evidence.authority_reference}</strong> located at {applicationData.district} have been inspected.
                </p>

                {/* Highlighted Evidence Area with Bounding Box Style */}
                <div className="relative p-3 bg-amber-100/60 border-2 border-dashed border-amber-600 rounded">
                  <div className="absolute -top-2.5 right-2 px-1.5 py-0.5 bg-amber-600 text-white text-[9px] font-sans font-bold uppercase rounded">
                    AI Highlighted Evidence
                  </div>
                  <p className="font-sans font-bold text-slate-900">
                    Field: {activeFinding.evidence.field}
                  </p>
                  <p className="font-mono text-sm font-black text-blue-900">
                    Extracted: {activeFinding.evidence.extracted_value}
                  </p>
                  {activeFinding.evidence.regulatory_threshold && (
                    <p className="text-xs text-slate-600 font-sans mt-1">
                      Required APH Threshold: <strong>{activeFinding.evidence.regulatory_threshold}</strong>
                    </p>
                  )}
                </div>

                <p className="text-[11px] text-slate-500">
                  Digitally authenticated via PKCS#7 token. Cross-checked with official simulated registry: <em>{activeFinding.simulated_source_name}</em>.
                </p>
              </div>

              {/* Document Footer */}
              <div className="mt-6 pt-3 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500">
                <span>Verification Engine: {activeFinding.model_name}</span>
                <span className="font-mono">Timestamp: 2026-10-27T15:10:00Z</span>
              </div>
            </div>

            {/* Explainability Breakdown Card */}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Detailed AI Rationale:</span>
                <span className="text-blue-700 font-semibold font-mono">Confidence: {(activeFinding.confidence * 100).toFixed(0)}%</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {activeFinding.reason}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
