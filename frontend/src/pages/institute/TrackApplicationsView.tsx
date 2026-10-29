import { API_BASE } from '../../config/api';
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../context/authStore';
import {
  FileSearch, Clock, CheckCircle2, AlertTriangle, ChevronRight,
  UploadCloud, Send, MessageSquare, ArrowRight, ShieldCheck,
  Calendar, RefreshCw, X, AlertOctagon, HelpCircle
} from 'lucide-react';

interface TimelineStep {
  step: string;
  timestamp: string | null;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'ACTIVE' | 'PENDING';
  actor: string;
}

interface DeficiencyItem {
  id: string;
  code: string;
  title: string;
  message: string;
  due_date: string;
  days_left: number;
  status: string;
  current_reply: string | null;
}

interface TrackingData {
  application_no: string;
  academic_year: string;
  status: string;
  sla_indicator: {
    days_remaining: number;
    target_date: string;
    status: string;
  };
  panels: {
    students_remaining: number;
    documents_pending: number;
    open_deficiencies_count: number;
  };
  timeline: TimelineStep[];
  deficiencies: DeficiencyItem[];
}

export const TrackApplicationsView: React.FC = () => {
  const { token } = useAuthStore();
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);

  // Deficiency Fix-it Wizard State
  const [activeDeficiencyIndex, setActiveDeficiencyIndex] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyFile, setReplyFile] = useState<string | null>(null);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replySuccessMsg, setReplySuccessMsg] = useState<string | null>(null);

  const fetchTracking = async () => {
    setLoading(true);
    try {
      // Fetch tracking for default or current application
      const resp = await fetch(`${API_BASE}/institute/applications/app-default/tracking`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const json = await resp.json();
        setData(json);
      }
    } catch (e) {
      console.warn('Failed to load tracking data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
  }, [token]);

  const handleOpenFixItWizard = (index: number) => {
    setActiveDeficiencyIndex(index);
    setReplyText('');
    setReplyFile(null);
    setReplySuccessMsg(null);
  };

  const handleSendReply = async (defId: string) => {
    if (!replyText.trim() || replyText.trim().length < 10) {
      alert('Please provide a substantive compliance reply (at least 10 characters).');
      return;
    }

    setSubmittingReply(true);
    try {
      const resp = await fetch(`${API_BASE}/institute/deficiencies/${defId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          remarks: replyText.trim(),
          corrected_document_name: replyFile || 'Renewed_Document_2026.pdf'
        })
      });
      if (resp.ok) {
        setReplySuccessMsg('Compliance response recorded and queued for scrutiny review.');
        setTimeout(() => {
          setActiveDeficiencyIndex(null);
          fetchTracking();
        }, 1200);
      }
    } catch (e) {
      console.error('Failed to submit reply:', e);
    } finally {
      setSubmittingReply(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-12 text-center text-gov-muted">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-saffron-500 mb-2" />
        <span>Loading institutional application tracking status...</span>
      </div>
    );
  }

  const activeDeficiency = activeDeficiencyIndex !== null && data?.deficiencies ? data.deficiencies[activeDeficiencyIndex] : null;

  return (
    <div className="space-y-6">
      {/* 1. Header & Application Overview */}
      <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-11 font-bold text-saffron-600 dark:text-saffron-400 uppercase tracking-wider mb-1">
            <span>Application Status Dashboard</span>
            <span>•</span>
            <span className="text-gov-muted">Academic Year {data?.academic_year || '2026-2027'}</span>
          </div>
          <h1 className="text-22 font-bold text-navy-950 dark:text-white flex items-center gap-2.5">
            <FileSearch className="w-6 h-6 text-saffron-500" />
            <span className="font-mono text-[13px] tabular-nums font-bold">{data?.application_no || 'AICTE/EOA/2026/MH-402'}</span>
          </h1>
        </div>

        {/* SLA Indicator */}
        {data?.sla_indicator && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 flex items-center gap-3">
            <Clock className="w-5 h-5 text-saffron-500 shrink-0" />
            <div>
              <div className="text-11 font-bold text-gov-muted uppercase">Statutory SLA Window</div>
              <div className="text-13 font-bold text-navy-950 dark:text-white mt-0.5">
                {data.sla_indicator.days_remaining} Days Remaining{' '}
                <span className="text-11 font-normal text-gov-muted">(Target: {data.sla_indicator.target_date})</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Three Metric Status Panels */}
      {data?.panels && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs">
            <div className="text-11 font-bold text-gov-muted uppercase tracking-wider">Students Remaining</div>
            <div className="text-24 font-bold text-navy-950 dark:text-white mt-1">
              {data.panels.students_remaining} Pending
            </div>
            <div className="text-12 text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>All student batches attached</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs">
            <div className="text-11 font-bold text-gov-muted uppercase tracking-wider">Documents Pending</div>
            <div className="text-24 font-bold text-amber-600 dark:text-amber-400 mt-1">
              {data.panels.documents_pending} Certificates
            </div>
            <div className="text-12 text-gov-muted mt-1">
              Awaiting renewal endorsement
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs">
            <div className="text-11 font-bold text-gov-muted uppercase tracking-wider">Open Deficiencies</div>
            <div className="text-24 font-bold text-red-600 dark:text-red-400 mt-1">
              {data.panels.open_deficiencies_count} Action Items
            </div>
            <div className="text-12 text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Requires compliance reply</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Visual Timeline with Timestamps & Actors */}
      {data?.timeline && (
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs">
          <h2 className="text-16 font-bold text-navy-950 dark:text-white mb-6">
            Scrutiny & Governance Progress Timeline
          </h2>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-navy-700">
            {data.timeline.map((item, idx) => {
              const isCompleted = item.status === 'COMPLETED';
              const isInProgress = item.status === 'IN_PROGRESS';
              const isActive = item.status === 'ACTIVE';
              return (
                <div key={idx} className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  {/* Dot */}
                  <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white dark:border-navy-900 ${
                    isCompleted
                      ? 'bg-emerald-500'
                      : isActive
                      ? 'bg-red-500 ring-4 ring-red-500/20'
                      : isInProgress
                      ? 'bg-saffron-500 ring-4 ring-saffron-500/20'
                      : 'bg-slate-300 dark:bg-navy-700'
                  }`} />

                  <div>
                    <div className="text-14 font-bold text-navy-950 dark:text-white flex items-center gap-2">
                      <span>{item.step}</span>
                      <span className={`px-2 py-0.5 rounded text-10 font-bold ${
                        isCompleted ? 'bg-emerald-100 text-emerald-800' :
                        isActive ? 'bg-red-100 text-red-800 animate-pulse' :
                        isInProgress ? 'bg-saffron-100 text-saffron-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="text-12 text-gov-muted mt-0.5">
                      Responsible Actor: <span className="font-semibold">{item.actor}</span>
                    </div>
                  </div>

                  {item.timestamp && (
                    <div className="text-11 font-mono text-gov-muted sm:text-right">
                      {item.timestamp}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Open Deficiencies & Fix-it Wizard Section */}
      {data?.deficiencies && data.deficiencies.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-16 font-bold text-navy-950 dark:text-white flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-500" />
                <span>Open Deficiencies Communicated by Scrutiny Desk</span>
              </h2>
              <p className="text-12 text-gov-muted mt-0.5">
                Respond with explanation and updated statutory documents before SLA deadline.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {data.deficiencies.map((def, idx) => (
              <div
                key={def.id}
                className="p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-11 font-bold text-red-600 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded">
                      {def.code}
                    </span>
                    <span className="font-bold text-13 text-navy-950 dark:text-white">
                      {def.title}
                    </span>
                  </div>
                  <p className="text-12 text-gov-muted max-w-2xl">
                    {def.message}
                  </p>
                  <div className="text-11 text-red-600 dark:text-red-400 font-semibold">
                    Due Date: {def.due_date} ({def.days_left} days remaining)
                  </div>
                </div>

                <button
                  onClick={() => handleOpenFixItWizard(idx)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-12 whitespace-nowrap shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Fix-It Wizard</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Deficiency Fix-It Modal */}
      {activeDeficiency && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setActiveDeficiencyIndex(null)}
          />

          <div className="relative w-full max-w-xl bg-white dark:bg-navy-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-navy-700 overflow-hidden z-10 flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between">
              <div>
                <span className="text-10 font-mono font-bold text-red-600 uppercase">
                  Deficiency Fix-It Wizard ({activeDeficiency.code})
                </span>
                <h3 className="text-16 font-bold text-navy-950 dark:text-white mt-0.5">
                  {activeDeficiency.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveDeficiencyIndex(null)}
                className="p-1.5 rounded-lg text-gov-muted hover:text-navy-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {replySuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-12 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{replySuccessMsg}</span>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200 dark:border-navy-700 text-12 text-gov-muted">
                <strong>Deficiency Note:</strong> {activeDeficiency.message}
              </div>

              <div>
                <label className="block text-12 font-bold text-gov-text mb-1.5">
                  Institutional Clarification / Compliance Remarks *
                </label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="State the corrective measures taken and reference the enclosed documents..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
                />
              </div>

              {/* Upload corrected document */}
              <div>
                <label className="block text-12 font-bold text-gov-text mb-1.5">
                  Attach Corrected / Renewed Statutory Document
                </label>
                <div
                  onClick={() => setReplyFile('Renewed_Fire_NOC_Challan_2026.pdf')}
                  className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-navy-600 hover:border-saffron-400 bg-slate-50/50 dark:bg-navy-800/30 cursor-pointer text-center text-12"
                >
                  {replyFile ? (
                    <div className="font-bold text-emerald-600 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{replyFile}</span>
                    </div>
                  ) : (
                    <div className="text-gov-muted flex items-center justify-center gap-2">
                      <UploadCloud className="w-4 h-4 text-saffron-500" />
                      <span>Click to simulate attaching corrected PDF</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-navy-800 flex items-center justify-end gap-2.5 bg-slate-50/60 dark:bg-navy-800/40">
              <button
                type="button"
                onClick={() => setActiveDeficiencyIndex(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-navy-700 text-gov-text text-13 font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSendReply(activeDeficiency.id)}
                disabled={submittingReply}
                className="px-5 py-2 rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white text-13 font-bold flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submittingReply ? 'Submitting...' : 'Submit Compliance'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
