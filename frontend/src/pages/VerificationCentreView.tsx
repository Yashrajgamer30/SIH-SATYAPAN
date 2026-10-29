import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  ExternalLink, Search, Filter, ShieldAlert, Check, X, Database
} from 'lucide-react';
import { AdvisoryBanner } from '../components/StatusBadges';
import { API_BASE } from '../config/api';

interface VerificationStats {
  VERIFIED: number;
  MISMATCH_DETECTED: number;
  EXPIRED: number;
  VERIFICATION_PENDING: number;
  SOURCE_UNAVAILABLE: number;
  MANUAL_REVIEW_REQUIRED: number;
  TOTAL: number;
}

interface VerificationItem {
  id: string;
  application_id: string;
  application_no: string;
  institute_name: string;
  document_name: string;
  document_id: string;
  authority_code: string;
  reference_no: string;
  status: 'VERIFIED' | 'MISMATCH_DETECTED' | 'EXPIRED' | 'VERIFICATION_PENDING' | 'SOURCE_UNAVAILABLE' | 'MANUAL_REVIEW_REQUIRED';
  source_name: string;
  latency_ms: number;
  checked_at: string | null;
  is_simulated: boolean;
  response_json: Record<string, unknown>;
}

const STATUS_CONFIGS: Record<string, { label: string; badgeCls: string; dotCls: string }> = {
  VERIFIED: {
    label: 'Verified',
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotCls: 'bg-emerald-500'
  },
  MISMATCH_DETECTED: {
    label: 'Mismatch Detected',
    badgeCls: 'bg-rose-50 text-rose-700 border-rose-200',
    dotCls: 'bg-rose-500'
  },
  EXPIRED: {
    label: 'Expired',
    badgeCls: 'bg-amber-50 text-amber-700 border-amber-200',
    dotCls: 'bg-amber-500'
  },
  VERIFICATION_PENDING: {
    label: 'Verification Pending',
    badgeCls: 'bg-blue-50 text-blue-700 border-blue-200',
    dotCls: 'bg-blue-500'
  },
  SOURCE_UNAVAILABLE: {
    label: 'Source Unavailable',
    badgeCls: 'bg-purple-50 text-purple-700 border-purple-200',
    dotCls: 'bg-purple-500'
  },
  MANUAL_REVIEW_REQUIRED: {
    label: 'Manual Review Required',
    badgeCls: 'bg-orange-50 text-orange-700 border-orange-200',
    dotCls: 'bg-orange-500'
  }
};

export const VerificationCentreView: React.FC = () => {
  const [stats, setStats] = useState<VerificationStats>({
    VERIFIED: 0,
    MISMATCH_DETECTED: 0,
    EXPIRED: 0,
    VERIFICATION_PENDING: 0,
    SOURCE_UNAVAILABLE: 0,
    MANUAL_REVIEW_REQUIRED: 0,
    TOTAL: 0
  });
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Bulk Retry State
  const [retrying, setRetrying] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual Confirmation Modal State
  const [confirmModalItem, setConfirmModalItem] = useState<VerificationItem | null>(null);
  const [manualStatus, setManualStatus] = useState<string>('VERIFIED');
  const [manualRemarks, setManualRemarks] = useState<string>('');
  const [physicalRef, setPhysicalRef] = useState<string>('');
  const [submittingManual, setSubmittingManual] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = activeFilter && activeFilter !== 'ALL'
        ? `${API_BASE}/official/verifications?status_filter=${activeFilter}`
        : `${API_BASE}/official/verifications`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStats(data.stats);
      setItems(data.items);
    } catch (err) {
      setError(`Failed to fetch cross-verification records: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleBulkRetry = async () => {
    setRetrying(true);
    try {
      const res = await fetch(`${API_BASE}/official/verifications/retry-unavailable`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      setToastMessage(result.message);
      await fetchRecords();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      alert(`Bulk retry failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRetrying(false);
    }
  };

  const handleManualConfirmSubmit = async () => {
    if (!confirmModalItem) return;
    if (!manualRemarks.trim() || !physicalRef.trim()) {
      alert('Mandatory justification remarks and physical reference number required.');
      return;
    }
    setSubmittingManual(true);
    try {
      const res = await fetch(`${API_BASE}/official/verifications/${confirmModalItem.id}/manual-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: manualStatus,
          remarks: manualRemarks.trim(),
          physical_ref: physicalRef.trim()
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      setToastMessage(result.message);
      setConfirmModalItem(null);
      setManualRemarks('');
      setPhysicalRef('');
      await fetchRecords();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      alert(`Manual confirmation failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSubmittingManual(false);
    }
  };

  // Client-side search filtering
  const filteredItems = items.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.application_no.toLowerCase().includes(q) ||
      item.institute_name.toLowerCase().includes(q) ||
      item.authority_code.toLowerCase().includes(q) ||
      item.reference_no.toLowerCase().includes(q) ||
      item.document_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Principle 1 Advisory Banner */}
      <AdvisoryBanner />

      {/* Header Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            External Authority Cross-Verification Centre
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time validation against DigiLocker, Mahabhumi Land Records, State Fire Services, MCA Corporate Registries, and SBI Core Banking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {stats.SOURCE_UNAVAILABLE > 0 && (
            <button
              onClick={handleBulkRetry}
              disabled={retrying}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
              Bulk Retry SOURCE_UNAVAILABLE ({stats.SOURCE_UNAVAILABLE})
            </button>
          )}

          <button
            onClick={fetchRecords}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {toastMessage}
        </div>
      )}

      {/* 6 Exact Status Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          { key: 'VERIFIED', label: 'Verified', count: stats.VERIFIED, color: 'emerald' },
          { key: 'MISMATCH_DETECTED', label: 'Mismatch Detected', count: stats.MISMATCH_DETECTED, color: 'rose' },
          { key: 'EXPIRED', label: 'Expired', count: stats.EXPIRED, color: 'amber' },
          { key: 'VERIFICATION_PENDING', label: 'Verification Pending', count: stats.VERIFICATION_PENDING, color: 'blue' },
          { key: 'SOURCE_UNAVAILABLE', label: 'Source Unavailable', count: stats.SOURCE_UNAVAILABLE, color: 'purple' },
          { key: 'MANUAL_REVIEW_REQUIRED', label: 'Manual Review', count: stats.MANUAL_REVIEW_REQUIRED, color: 'orange' },
        ].map(st => {
          const isActive = activeFilter === st.key;
          return (
            <button
              key={st.key}
              onClick={() => setActiveFilter(isActive ? 'ALL' : st.key)}
              className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                isActive
                  ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-500'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">{st.label}</span>
                <span className={`w-2 h-2 rounded-full ${STATUS_CONFIGS[st.key]?.dotCls || 'bg-slate-400'}`} />
              </div>
              <div className="text-18 font-mono font-bold tabular-nums text-slate-900 mt-1">
                {st.count}
              </div>
              <span className="text-[9px] text-slate-400 block mt-0.5">Click to filter</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
            {activeFilter === 'ALL' ? 'Showing All Records' : STATUS_CONFIGS[activeFilter]?.label}
          </span>
          {activeFilter !== 'ALL' && (
            <button
              onClick={() => setActiveFilter('ALL')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="w-full sm:w-72 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search authority, reference, doc..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Verification Records Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600" />
            <p>Querying authority gateway adapters...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No verification records match the current filter selection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Authority / Source</th>
                  <th className="py-2.5 px-3">Reference No</th>
                  <th className="py-2.5 px-3">Application &amp; Institute</th>
                  <th className="py-2.5 px-3">Document</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Latency</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => {
                  const cfg = STATUS_CONFIGS[item.status] || {
                    label: item.status,
                    badgeCls: 'bg-slate-100 text-slate-700 border-slate-200'
                  };

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-slate-900 block">{item.authority_code}</span>
                        <span className="text-[10px] text-slate-500">{item.source_name}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono text-[12px] font-semibold text-slate-800 tabular-nums">
                          {item.reference_no}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono text-[12px] tabular-nums font-bold text-navy-900 block">
                          {item.application_no}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate max-w-[200px] block" title={item.institute_name}>
                          {item.institute_name}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-slate-800 font-semibold truncate max-w-[180px] block" title={item.document_name}>
                          {item.document_name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.checked_at ? new Date(item.checked_at).toLocaleTimeString() : 'Recent'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border inline-block ${cfg.badgeCls}`}>
                          {cfg.label}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600 tabular-nums">
                        {item.latency_ms} ms
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {(item.status === 'MANUAL_REVIEW_REQUIRED' || item.status === 'MISMATCH_DETECTED' || item.status === 'EXPIRED') && (
                            <button
                              onClick={() => {
                                setConfirmModalItem(item);
                                setManualStatus('VERIFIED');
                              }}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded cursor-pointer"
                            >
                              Manual Resolve
                            </button>
                          )}

                          {item.status === 'SOURCE_UNAVAILABLE' && (
                            <button
                              onClick={handleBulkRetry}
                              disabled={retrying}
                              className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded cursor-pointer"
                            >
                              Retry
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Confirmation Workflow Modal */}
      {confirmModalItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-5 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-600" />
                Manual Cross-Verification Determination
              </h3>
              <button
                onClick={() => setConfirmModalItem(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                <div>Authority: <strong>{confirmModalItem.authority_code}</strong></div>
                <div>Reference No: <span className="font-mono">{confirmModalItem.reference_no}</span></div>
                <div>Document: <strong>{confirmModalItem.document_name}</strong></div>
                <div>Current Flag: <span className="text-rose-700 font-bold">{confirmModalItem.status}</span></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Verification Determination:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`p-2.5 rounded border text-center cursor-pointer font-bold ${
                    manualStatus === 'VERIFIED' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="mstatus"
                      value="VERIFIED"
                      checked={manualStatus === 'VERIFIED'}
                      onChange={() => setManualStatus('VERIFIED')}
                      className="sr-only"
                    />
                    Mark as Verified
                  </label>
                  <label className={`p-2.5 rounded border text-center cursor-pointer font-bold ${
                    manualStatus === 'DEFICIENCY_RAISED' ? 'border-rose-600 bg-rose-50 text-rose-800' : 'border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="mstatus"
                      value="DEFICIENCY_RAISED"
                      checked={manualStatus === 'DEFICIENCY_RAISED'}
                      onChange={() => setManualStatus('DEFICIENCY_RAISED')}
                      className="sr-only"
                    />
                    Raise Deficiency
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Physical Register / Dispatch Tracking Reference:
                </label>
                <input
                  type="text"
                  placeholder="e.g. DISPATCH/MH/REV/2026/8841"
                  value={physicalRef}
                  onChange={e => setPhysicalRef(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Manual Audit Justification Remarks:
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide explicit rationale for manual override..."
                  value={manualRemarks}
                  onChange={e => setManualRemarks(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setConfirmModalItem(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleManualConfirmSubmit}
                disabled={submittingManual || !manualRemarks.trim() || !physicalRef.trim()}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded cursor-pointer disabled:opacity-50"
              >
                {submittingManual ? 'Recording...' : 'Commit Determination'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

