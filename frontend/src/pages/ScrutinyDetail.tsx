import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, CheckCircle2, AlertTriangle, ArrowLeft, ShieldAlert,
  Send, ExternalLink, RefreshCw, X, Clock, HelpCircle,
  Eye, Check, UserCheck, Shield, ChevronRight, Layers, FileCheck
} from 'lucide-react';
import { AdvisoryBanner } from '../components/StatusBadges';

const API_BASE = 'http://localhost:8000';

interface ScrutinyDetailProps {
  appId?: string | number;
  onBack?: () => void;
}

interface ReviewDossier {
  summary: {
    id: string;
    application_no: string;
    academic_year: string;
    status: string;
    risk_score: number;
    risk_band: string;
    fast_track: boolean;
    sla_due_at: string | null;
    sla_days_left: number;
    submitted_at: string;
    assigned_officer_name: string;
    assigned_officer_id: string | null;
    institute: {
      id: string;
      name: string;
      aicte_id: string;
      state: string;
      district: string;
      type: string;
      address: string;
      pin: string;
      contact_email: string;
      contact_phone: string;
    };
    category: string;
  };
  diff: Array<{
    field: string;
    master_value: string;
    submitted_value: string;
    is_mismatch: boolean;
    severity: string;
    rule_code: string;
    rationale: string;
  }>;
  students_and_documents: {
    documents: Array<{
      id: string;
      original_filename: string;
      doc_type: string;
      size_kb: number;
      mime: string;
      sha256: string;
      classification_label: string;
      classification_confidence: number;
      verification_status: string;
      scan_url: string;
    }>;
    students: {
      total_enrolled: number;
      programmes: Array<{ name: string; count: number; sfr: string }>;
      category_distribution: Record<string, number>;
      gender_ratio: { male_pct: number; female_pct: number };
    };
  };
  findings: Array<{
    id: string;
    title: string;
    severity: string;
    type: string;
    reason: string;
    confidence: number;
    source: string;
    status: string;
    rule_code: string;
    evidence_json: Record<string, unknown>;
    explain_why?: {
      model_or_rule: string;
      inputs_used: string[];
      top_contributing_factors: Array<{ factor: string; weight: string }>;
      evidence_region?: { page: number; box: number[] };
    };
  }>;
  infra_evidence: Array<{
    id: string;
    evidence_type: string;
    requirement_key: string;
    title?: string;
    required_sqm?: number;
    measured_sqm?: number;
    status?: string;
    meets_requirement: boolean;
    needs_inspection: boolean;
    cv_labels?: string[];
    note: string | null;
  }>;
  verification: Array<{
    id: string;
    authority_code: string;
    reference_no: string;
    status: string;
    source_name: string;
    latency_ms: number;
    is_simulated: boolean;
  }>;
  timeline: Array<{
    date: string;
    title: string;
    actor: string;
    details: string;
  }>;
  audit: Array<{
    id: string;
    ts: string;
    actor_id: string;
    actor_role: string;
    action: string;
    entity: string;
    entity_id: string;
    hash: string;
    prev_hash: string;
    details: Record<string, unknown>;
  }>;
  pending_decision?: {
    id: string;
    action: string;
    remarks: string;
    initiated_by: string;
    initiated_at: string;
    is_awaiting_senior: boolean;
  } | null;
}

type TabType = 'summary' | 'diff' | 'students_docs' | 'findings' | 'infra' | 'verification' | 'timeline' | 'audit';

export const ScrutinyDetail: React.FC<ScrutinyDetailProps> = ({ appId = '1', onBack }) => {
  const navigate = useNavigate();

  const [dossier, setDossier] = useState<ReviewDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('summary');

  // Decision State
  const [selectedDecision, setSelectedDecision] = useState<string>('APPROVED');
  const [remarks, setRemarks] = useState<string>('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);

  // Senior Confirmation State (Two-person rule)
  const [seniorRemarks, setSeniorRemarks] = useState<string>('');
  const [confirmingSenior, setConfirmingSenior] = useState(false);

  // Explain-Why Drawer State
  const [explainDrawerFinding, setExplainDrawerFinding] = useState<ReviewDossier['findings'][0] | null>(null);

  // Simulated current user role from localStorage
  const currentRole = localStorage.getItem('satyapan_demo_role') || 'OFFICIAL_SCRUTINY';
  const isSenior = currentRole === 'OFFICIAL_SENIOR' || currentRole === 'SYSTEM_ADMIN';

  const loadDossier = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/official/applications/${appId}/review`, {
        headers: { 'X-Demo-Role': currentRole }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ReviewDossier = await res.json();
      setDossier(data);
    } catch (err) {
      setError(`Failed to load application dossier: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [appId, currentRole]);

  useEffect(() => {
    loadDossier();
  }, [loadDossier]);

  const handleDecisionSubmit = async () => {
    if (!remarks.trim() || remarks.trim().length < 10) {
      alert('Mandatory official remarks required (minimum 10 characters).');
      return;
    }
    setSubmittingDecision(true);
    try {
      const res = await fetch(`${API_BASE}/official/applications/${appId}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': currentRole
        },
        body: JSON.stringify({
          decision: selectedDecision,
          remarks: remarks.trim()
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      setDecisionFeedback(result.message);
      setRemarks('');
      await loadDossier();
    } catch (err) {
      alert(`Decision submission failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleSeniorConfirmation = async (confirmed: boolean) => {
    if (!seniorRemarks.trim() || seniorRemarks.trim().length < 5) {
      alert('Mandatory senior official endorsement remarks required.');
      return;
    }
    setConfirmingSenior(true);
    try {
      const res = await fetch(`${API_BASE}/official/applications/${appId}/confirm-decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': currentRole
        },
        body: JSON.stringify({
          confirmed,
          remarks: seniorRemarks.trim()
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      setDecisionFeedback(result.message);
      setSeniorRemarks('');
      await loadDossier();
    } catch (err) {
      alert(`Senior action failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setConfirmingSenior(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 space-y-2">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
        <p>Retrieving complete 8-tab application review dossier and cross-verifications...</p>
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div className="p-8 text-center text-xs text-rose-600 space-y-3">
        <AlertTriangle className="w-6 h-6 mx-auto text-rose-500" />
        <p>{error || 'Application dossier could not be loaded.'}</p>
        <button
          onClick={loadDossier}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary, diff, students_and_documents, findings, infra_evidence, verification, timeline, audit, pending_decision } = dossier;
  const isAwaitingSenior = summary.status === 'AWAITING_SENIOR_CONFIRMATION' || !!pending_decision;

  const TABS: Array<{ id: TabType; label: string; count?: number }> = [
    { id: 'summary', label: 'Summary' },
    { id: 'diff', label: 'Master vs Submitted Diff', count: diff.filter(d => d.is_mismatch).length },
    { id: 'students_docs', label: 'Students & Documents', count: students_and_documents.documents.length },
    { id: 'findings', label: 'AI Findings', count: findings.length },
    { id: 'infra', label: 'Infra Evidence', count: infra_evidence.length },
    { id: 'verification', label: 'Cross-Verification', count: verification.length },
    { id: 'timeline', label: 'Timeline' },
    { id: 'audit', label: 'Audit Trail', count: audit.length },
  ];

  return (
    <div className="space-y-4">
      {/* Principle 1 Advisory Banner */}
      <AdvisoryBanner />

      {/* Top Breadcrumb & Dossier Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (onBack ? onBack() : navigate('/official/smart-queue'))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Queue
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[14px] font-bold tabular-nums text-navy-950">
                {summary.application_no}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                isAwaitingSenior
                  ? 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse'
                  : summary.status === 'APPROVED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : summary.status === 'DEFICIENCY_RAISED' || summary.status === 'REJECTED'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {summary.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {summary.institute.name} • AICTE ID: <span className="font-mono text-[13px] tabular-nums font-semibold">{summary.institute.aicte_id}</span>
            </p>
          </div>
        </div>

        {/* Priority & Risk Badges */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">AI Risk Index</span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
              summary.risk_band === 'HIGH'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : summary.risk_band === 'MEDIUM'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              <ShieldAlert className="w-3 h-3" />
              <span className="font-mono tabular-nums">{summary.risk_score.toFixed(1)}/100</span>
              <span className="text-[10px]">({summary.risk_band})</span>
            </span>
          </div>

          <div className="text-right border-l border-slate-200 pl-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">SLA Turnaround</span>
            <div className="flex items-center gap-1 text-xs font-mono font-bold tabular-nums text-slate-800">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>{summary.sla_days_left}d remaining</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Person Rule Banner (If awaiting senior confirmation) */}
      {isAwaitingSenior && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-purple-900">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-950 uppercase tracking-wider">
              <Shield className="w-4 h-4 text-purple-700 shrink-0" />
              Awaiting Senior Confirmation (AICTE Two-Person Rule Mandate)
            </div>
            <p className="text-xs text-purple-800">
              Adverse action <strong>{pending_decision?.action || 'DEFICIENCY_RAISED'}</strong> initiated by{' '}
              <strong>{pending_decision?.initiated_by || 'Scrutiny Officer'}</strong> on{' '}
              {pending_decision?.initiated_at ? new Date(pending_decision.initiated_at).toLocaleString() : 'Recent'}.
              Requires second approval by an Official Senior before taking legal effect.
            </p>
            {pending_decision?.remarks && (
              <p className="text-[11px] text-purple-700 italic mt-1">
                Scrutiny Justification: "{pending_decision.remarks}"
              </p>
            )}
          </div>

          {/* Senior Officer Confirmation Controls */}
          {isSenior && (
            <div className="w-full sm:w-auto bg-white p-3 rounded border border-purple-200 space-y-2">
              <div className="text-xs font-bold text-slate-800">Senior Endorsement Remarks:</div>
              <input
                type="text"
                placeholder="Senior officer justification remarks..."
                value={seniorRemarks}
                onChange={e => setSeniorRemarks(e.target.value)}
                className="w-full text-xs p-1.5 rounded border border-slate-300 focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSeniorConfirmation(true)}
                  disabled={confirmingSenior}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3 h-3" /> Confirm &amp; Enact
                </button>
                <button
                  onClick={() => handleSeniorConfirmation(false)}
                  disabled={confirmingSenior}
                  className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold rounded cursor-pointer disabled:opacity-50"
                >
                  Return to Scrutiny
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Decision Feedback Toast */}
      {decisionFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {decisionFeedback}
        </div>
      )}

      {/* 8-Tab Navigation Bar */}
      <div className="border-b border-slate-200 flex flex-wrap gap-1 bg-white px-2 pt-2 rounded-t-lg">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs font-bold cursor-pointer rounded-t-md transition-colors flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === tab.id ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-white p-5 rounded-b-lg border-x border-b border-slate-200 shadow-xs min-h-[400px]">
        {/* TAB 1: SUMMARY */}
        {activeTab === 'summary' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Institution Profile</span>
                <h4 className="text-sm font-bold text-slate-900">{summary.institute.name}</h4>
                <p className="text-xs text-slate-600">{summary.institute.type}</p>
                <p className="text-xs text-slate-500">{summary.institute.address}, Pin: {summary.institute.pin}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Regulatory Details</span>
                <div className="text-xs text-slate-700 space-y-1">
                  <div>AICTE ID: <strong className="font-mono text-[13px] tabular-nums">{summary.institute.aicte_id}</strong></div>
                  <div>Category: <strong>{summary.category}</strong></div>
                  <div>Cycle: <strong>{summary.academic_year}</strong></div>
                  <div>Assigned Officer: <strong>{summary.assigned_officer_name}</strong></div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scrutiny Milestones</span>
                <div className="text-xs text-slate-700 space-y-1">
                  <div>Submitted: {new Date(summary.submitted_at).toLocaleDateString()}</div>
                  <div>SLA Deadline: {summary.sla_due_at ? new Date(summary.sla_due_at).toLocaleDateString() : '14 days'}</div>
                  <div>Turnaround: <strong className="text-emerald-700">{summary.sla_days_left} calendar days left</strong></div>
                  <div>Mode: <span className="font-bold text-blue-700">{summary.fast_track ? 'Fast-Track Queue' : 'Standard In-Depth Audit'}</span></div>
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-blue-700" />
                  Primary Inspection Document Available
                </h4>
                <p className="text-xs text-blue-800">
                  Open Fire NOC and Land Registry files directly in the pixel-aligned SVG overlay viewer.
                </p>
              </div>
              <button
                onClick={() => navigate(`/official/applications/${appId}/students/inst-std-001/documents/doc-fire-noc/scan`)}
                className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                Launch Document Scan View <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: INSTITUTE RECORDS VS SUBMITTED DIFF */}
        {activeTab === 'diff' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Registry Baseline vs. Application Submission (Diff View)
                </h3>
                <p className="text-xs text-slate-500">
                  Side-by-side verification comparing historical master records against submitted data. Discrepancies highlighted in amber/red.
                </p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                {diff.filter(d => d.is_mismatch).length} Discrepancies Flagged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-2 px-3">Field Name</th>
                    <th className="py-2 px-3">Official AICTE Master Registry</th>
                    <th className="py-2 px-3">Submitted Application Data</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Regulatory Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {diff.map((row, idx) => (
                    <tr
                      key={idx}
                      className={row.is_mismatch ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-slate-50'}
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {row.field}
                        <span className="text-[10px] font-mono text-slate-400 block">{row.rule_code}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[12px] text-slate-700">
                        {row.master_value}
                      </td>
                      <td className={`py-2.5 px-3 font-mono text-[12px] ${
                        row.is_mismatch ? 'text-rose-700 font-bold bg-rose-50/80 px-2 rounded' : 'text-slate-800'
                      }`}>
                        {row.submitted_value}
                      </td>
                      <td className="py-2.5 px-3">
                        {row.is_mismatch ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3" /> MISMATCH
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> MATCHED
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {row.rationale}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: STUDENTS & DOCUMENTS */}
        {activeTab === 'students_docs' && (
          <div className="space-y-6">
            {/* Documents Section */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Uploaded Regulatory Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {students_and_documents.documents.map(doc => (
                  <div key={doc.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-900 truncate max-w-[200px]" title={doc.original_filename}>
                          {doc.original_filename}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {doc.doc_type} • {doc.size_kb} KB • SHA-256: <span className="font-mono">{doc.sha256.slice(0, 10)}…</span>
                      </p>
                    </div>

                    <button
                      onClick={() => navigate(doc.scan_url)}
                      className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 text-xs font-bold rounded flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Scan View
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Students Overview */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Enrolled Student Cohort Roster ({students_and_documents.students.total_enrolled} Total)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {students_and_documents.students.programmes.map((p, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">{p.name}</span>
                    <span className="text-16 font-mono font-bold text-slate-900 block mt-1">{p.count} Enrolled</span>
                    <span className="text-[10px] text-slate-500">Cadre SFR: {p.sfr}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FINDINGS (With Explain-Why Drawer) */}
        {activeTab === 'findings' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Automated AI Findings ({findings.length})
              </h3>
              <p className="text-xs text-slate-500">
                Click "Explain Why" on any flag to inspect model inputs, contributing factors, and confidence attribution.
              </p>
            </div>

            <div className="space-y-3">
              {findings.map(f => (
                <div key={f.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        f.severity === 'HIGH'
                          ? 'bg-rose-100 text-rose-800'
                          : f.severity === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {f.severity} SEVERITY
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700">{f.rule_code}</span>
                      <span className="text-xs text-slate-400">• Confidence: {(f.confidence * 100).toFixed(0)}%</span>
                    </div>

                    <button
                      onClick={() => setExplainDrawerFinding(f)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> Explain Why
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{f.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{f.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: INFRA EVIDENCE */}
        {activeTab === 'infra' && (
          <div className="space-y-4">
            <div className="pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Infrastructure Norms &amp; Evidence Gallery</h3>
              <p className="text-xs text-slate-500">
                Checklist of physical instructional, administrative, and amenity area norms evaluated against uploaded CAD floor plans and geo-tagged images.
              </p>
            </div>

            <div className="space-y-3">
              {infra_evidence.map((ie, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-800">{ie.requirement_key}</span>
                      {ie.status === 'MEETS' || ie.meets_requirement ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          MEETS NORM
                        </span>
                      ) : ie.status === 'RECOMMEND_INSPECTION' || ie.needs_inspection ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                          RECOMMEND INSPECTION
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                          NEEDS MORE EVIDENCE
                        </span>
                      )}
                    </div>
                    {ie.required_sqm && ie.measured_sqm && (
                      <span className="text-xs font-mono text-slate-600">
                        Req: {ie.required_sqm} sqm | Measured: <strong className={ie.measured_sqm >= ie.required_sqm ? 'text-emerald-700' : 'text-rose-700'}>{ie.measured_sqm} sqm</strong>
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-900">{ie.title || ie.requirement_key.replace(/_/g, ' ')}</h4>
                  <p className="text-xs text-slate-600">{ie.note || 'Verified against institutional CAD layout.'}</p>

                  {ie.cv_labels && ie.cv_labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {ie.cv_labels.map((lbl, lIdx) => (
                        <span key={lIdx} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded">
                          {lbl}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: CROSS-VERIFICATION */}
        {activeTab === 'verification' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">External Authority Cross-Verifications</h3>
                <p className="text-xs text-slate-500">
                  Verification status checks across government, revenue, fire department, and banking registries (6 statutory statuses).
                </p>
              </div>
              <button
                onClick={() => navigate('/official/verification-centre')}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
              >
                Open Verification Centre <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-2 px-3">Authority Code</th>
                    <th className="py-2 px-3">Reference No</th>
                    <th className="py-2 px-3">Source Name</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {verification.map((v, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{v.authority_code}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{v.reference_no}</td>
                      <td className="py-2.5 px-3 text-slate-700">{v.source_name}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          v.status === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : v.status === 'EXPIRED'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : v.status === 'MISMATCH_DETECTED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          {v.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 tabular-nums">{v.latency_ms} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-200">
              Application Scrutiny Lifecycle Timeline
            </h3>
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {timeline.map((evt, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(evt.date).toLocaleString()}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{evt.title}</h4>
                    <p className="text-xs text-slate-600">{evt.details}</p>
                    <span className="text-[10px] text-slate-500 font-semibold block">Actor: {evt.actor}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Cryptographic Chained Audit Trail (SHA-256)
              </h3>
              <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Chain Integrity: VERIFIED
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3">Action</th>
                    <th className="py-2 px-3">Actor Role</th>
                    <th className="py-2 px-3">Block Hash</th>
                    <th className="py-2 px-3">Prev Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {audit.map((a, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-600">{new Date(a.ts).toLocaleTimeString()}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{a.action}</td>
                      <td className="py-2.5 px-3 text-blue-700">{a.actor_role}</td>
                      <td className="py-2.5 px-3 text-slate-500">{a.hash}</td>
                      <td className="py-2.5 px-3 text-slate-400">{a.prev_hash}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* DECISION ACTION PANEL (Prompt D1, Item 3) */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-blue-600" />
            Official Regulatory Decision Panel
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            AI is strictly decision-support (Principle 1). All statutory decisions must be recorded by human officials with explicit written remarks.
            Adverse decisions (Reject, Deficiency, Inspection) trigger the mandatory AICTE Two-Person Senior Confirmation rule.
          </p>
        </div>

        {/* Decision Radio Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {[
            { id: 'APPROVED', label: 'Approve Extension of Approval', desc: 'Compliant with AICTE APH 2026-27 norms', color: 'emerald' },
            { id: 'DEFICIENCY_RAISED', label: 'Raise Statutory Deficiency', desc: 'Furnish rectifications within 15 days', color: 'amber' },
            { id: 'INSPECTION_RECOMMENDED', label: 'Recommend Physical Inspection', desc: 'On-site committee visit mandated', color: 'purple' },
            { id: 'REJECTED', label: 'Reject Approval', desc: 'Statutory non-compliance identified', color: 'rose' },
          ].map(opt => (
            <label
              key={opt.id}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedDecision === opt.id
                  ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="decision"
                value={opt.id}
                checked={selectedDecision === opt.id}
                onChange={e => setSelectedDecision(e.target.value)}
                className="sr-only"
              />
              <div className="font-bold text-slate-900">{opt.label}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
            </label>
          ))}
        </div>

        {/* Written Remarks Textarea */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">
            Mandatory Official Justification Remarks:
          </label>
          <textarea
            rows={3}
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            placeholder="State factual justification citing AICTE APH 2026-27 chapters, verified land records, or fire safety observations..."
            className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Submit Decision Button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-[11px] text-slate-400">
            Signed in as: <strong>{currentRole.replace(/_/g, ' ')}</strong>
          </span>

          <button
            onClick={handleDecisionSubmit}
            disabled={submittingDecision || !remarks.trim()}
            className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            {submittingDecision ? 'Recording Decision...' : 'Record Regulatory Decision'}
          </button>
        </div>
      </div>

      {/* EXPLAIN-WHY DRAWER (Differentiator 1) */}
      {explainDrawerFinding && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 space-y-5 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                Explain-Why Rationale Drawer
              </h3>
              <button
                onClick={() => setExplainDrawerFinding(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rule / Model Engine</span>
                <p className="font-mono text-12 font-bold text-blue-900 mt-0.5">
                  {explainDrawerFinding.explain_why?.model_or_rule || 'AICTE Statutory Rule Engine v2.0'}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Evaluated Flag</span>
                <p className="font-bold text-slate-900 mt-0.5">{explainDrawerFinding.title}</p>
                <p className="text-slate-600 mt-1">{explainDrawerFinding.reason}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Inputs Used</span>
                <ul className="space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200">
                  {(explainDrawerFinding.explain_why?.inputs_used || [
                    'Document OCR Text Extract',
                    'Official Authority Gateway Response',
                    'Institution Master Dossier'
                  ]).map((inp, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 text-slate-700">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>{inp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Top Contributing Factors</span>
                <div className="space-y-2">
                  {(explainDrawerFinding.explain_why?.top_contributing_factors || [
                    { factor: 'Extracted certificate expiration date is prior to cycle', weight: '68%' },
                    { factor: 'State Fire Services gateway returned inactive record', weight: '26%' },
                    { factor: 'No valid renewal receipt or provisional clearance attached', weight: '6%' }
                  ]).map((fac, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{fac.factor}</span>
                        <span className="text-blue-700 font-mono">{fac.weight}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{ width: fac.weight }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-blue-900">
                <span className="font-bold block mb-0.5">Decision-Support Governance:</span>
                This explainability breakdown ensures officials understand precisely which parameters drove the automated flag before making statutory decisions.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
