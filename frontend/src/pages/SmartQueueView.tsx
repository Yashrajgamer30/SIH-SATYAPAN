import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ListFilter, ShieldAlert, Clock, ArrowRight, UserCheck, AlertTriangle,
  CheckCircle2, Search, Zap, Layers, RefreshCw, X, ChevronRight, Info
} from 'lucide-react';
import { AdvisoryBanner } from '../components/StatusBadges';

const API_BASE = 'http://localhost:8000';

interface QueueItem {
  id: string;
  application_no: string;
  institute_id: string;
  institute_name: string;
  state: string;
  district: string;
  category: string;
  academic_year: string;
  status: string;
  risk_score: number;
  risk_band: 'HIGH' | 'MEDIUM' | 'LOW';
  fast_track: boolean;
  priority_score: number;
  sla_due_at: string | null;
  sla_days_left: number;
  sla_status: 'ON_TRACK' | 'URGENT' | 'OVERDUE';
  assigned_official_id: string | null;
  assigned_officer_name: string;
  top_risk_reasons: string[];
  created_at: string;
}

interface Officer {
  id: string;
  name: string;
  role: string;
  email: string;
}

export const SmartQueueView: React.FC = () => {
  const navigate = useNavigate();

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [savedView, setSavedView] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState<string>('');
  const [bulkRemarks, setBulkRemarks] = useState<string>('Assigned via Smart Queue workbench');
  const [assigning, setAssigning] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Hover Popover State for 'Why this score'
  const [hoveredAppId, setHoveredAppId] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (savedView && savedView !== 'all') params.append('saved_view', savedView);
      if (stateFilter) params.append('state', stateFilter);
      if (riskFilter) params.append('risk_band', riskFilter);
      if (statusFilter) params.append('status_filter', statusFilter);
      if (assigneeFilter) params.append('assignee', assigneeFilter);

      const res = await fetch(`${API_BASE}/official/queue?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: QueueItem[] = await res.json();
      setQueue(data);
    } catch (err) {
      setError(`Failed to fetch scrutiny queue: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [savedView, stateFilter, riskFilter, statusFilter, assigneeFilter]);

  const fetchOfficers = async () => {
    try {
      const res = await fetch(`${API_BASE}/official/officers`);
      if (res.ok) {
        const data = await res.json();
        setOfficers(data);
        if (data.length > 0) setSelectedOfficer(data[0].id);
      }
    } catch {
      // Graceful fallback
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchOfficers();
  }, [fetchQueue]);

  // Client-side search filtering
  const filteredQueue = useMemo(() => {
    if (!searchQuery.trim()) return queue;
    const q = searchQuery.toLowerCase();
    return queue.filter(
      item =>
        item.application_no.toLowerCase().includes(q) ||
        item.institute_name.toLowerCase().includes(q) ||
        item.district.toLowerCase().includes(q) ||
        item.state.toLowerCase().includes(q)
    );
  }, [queue, searchQuery]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredQueue.map(i => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkAssign = async () => {
    if (!selectedOfficer || selectedIds.size === 0) return;
    setAssigning(true);
    try {
      const res = await fetch(`${API_BASE}/official/queue/bulk-assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_ids: Array.from(selectedIds),
          officer_id: selectedOfficer,
          remarks: bulkRemarks
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      setSuccessToast(result.message);
      setSelectedIds(new Set());
      setAssignModalOpen(false);
      fetchQueue();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      alert(`Assignment failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setAssigning(false);
    }
  };

  // Distinct states for filter
  const statesList = useMemo(() => {
    const s = new Set<string>();
    queue.forEach(i => { if (i.state) s.add(i.state); });
    return Array.from(s).sort();
  }, [queue]);

  return (
    <div className="space-y-4">
      {/* Principle 1 Advisory Banner */}
      <AdvisoryBanner />

      {/* Header & Controls */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-blue-600" />
            Smart Scrutiny Queue
            <span className="text-xs font-normal text-slate-500">(Ranked by AI Risk Score + SLA Urgency)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Applications prioritized dynamically using weighted multi-modal risk scoring (65%) and statutory turnaround SLA (35%).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={() => setAssignModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-xs cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              Assign ({selectedIds.size}) Applications
            </button>
          )}

          <button
            onClick={fetchQueue}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {successToast}
        </div>
      )}

      {/* Saved Views Toolbar */}
      <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
          <Layers className="w-3.5 h-3.5" /> Saved Views:
        </span>
        {[
          { id: 'all', label: 'All Applications' },
          { id: 'critical_risk', label: 'Critical Risk (≥ 50)' },
          { id: 'sla_urgent', label: 'Approaching SLA (≤ 7 Days)' },
          { id: 'deficiency_pending', label: 'Deficiency In-Flight' },
          { id: 'my_assigned', label: 'My Assigned Queue' }
        ].map(view => (
          <button
            key={view.id}
            onClick={() => setSavedView(view.id)}
            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
              savedView === view.id
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by institute name, app no, district..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* State Filter */}
        <select
          value={stateFilter}
          onChange={e => setStateFilter(e.target.value)}
          className="text-xs py-1.5 px-2.5 rounded border border-slate-200 bg-white text-slate-700 focus:outline-none"
        >
          <option value="">All States ({statesList.length})</option>
          {statesList.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Risk Filter */}
        <select
          value={riskFilter}
          onChange={e => setRiskFilter(e.target.value)}
          className="text-xs py-1.5 px-2.5 rounded border border-slate-200 bg-white text-slate-700 focus:outline-none"
        >
          <option value="">All Risk Bands</option>
          <option value="HIGH">High Risk (≥ 60)</option>
          <option value="MEDIUM">Medium Risk (30-59)</option>
          <option value="LOW">Low Risk (&lt; 30)</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-xs py-1.5 px-2.5 rounded border border-slate-200 bg-white text-slate-700 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_SCRUTINY">Under Scrutiny</option>
          <option value="DEFICIENCY_RAISED">Deficiency Raised</option>
          <option value="AWAITING_SENIOR_CONFIRMATION">Awaiting Senior Confirmation</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>

        {/* Assignee Filter */}
        <select
          value={assigneeFilter}
          onChange={e => setAssigneeFilter(e.target.value)}
          className="text-xs py-1.5 px-2.5 rounded border border-slate-200 bg-white text-slate-700 focus:outline-none"
        >
          <option value="">All Assignees</option>
          {officers.map(o => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>

        {(stateFilter || riskFilter || statusFilter || assigneeFilter || searchQuery) && (
          <button
            onClick={() => {
              setStateFilter('');
              setRiskFilter('');
              setStatusFilter('');
              setAssigneeFilter('');
              setSearchQuery('');
            }}
            className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600" />
            <p>Evaluating AI risk scores and ranking scrutiny queue...</p>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No applications match the current filter selection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredQueue.length && filteredQueue.length > 0}
                      onChange={e => handleSelectAll(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="py-2.5 px-3">Rank / App No</th>
                  <th className="py-2.5 px-3">Institute &amp; Location</th>
                  <th className="py-2.5 px-3">Smart Priority</th>
                  <th className="py-2.5 px-3">AI Risk Score</th>
                  <th className="py-2.5 px-3">SLA Turnaround</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Assignee</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredQueue.map((item, idx) => {
                  const isSelected = selectedIds.has(item.id);
                  const isHovered = hoveredAppId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-blue-50/40 transition-colors ${isSelected ? 'bg-blue-50/60' : ''}`}
                    >
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(item.id)}
                          className="rounded border-slate-300 cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-400 w-5">#{idx + 1}</span>
                          <div>
                            <span className="font-mono text-[13px] tabular-nums font-bold text-navy-900 block">
                              {item.application_no}
                            </span>
                            <span className="text-[10px] text-slate-500">{item.category}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 max-w-[240px] truncate" title={item.institute_name}>
                          {item.institute_name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.district}, {item.state}
                        </div>
                      </td>

                      {/* Smart Combined Priority Score */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-13 font-bold font-mono tabular-nums text-slate-900">
                            {item.priority_score.toFixed(1)}
                          </span>
                          {item.fast_track && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800" title="Fast Track: Low Risk &lt; 25">
                              <Zap className="w-2.5 h-2.5" /> FAST
                            </span>
                          )}
                        </div>
                      </td>

                      {/* AI Risk Score with Hover Popover */}
                      <td className="py-3 px-3 relative">
                        <div
                          className="inline-block cursor-help"
                          onMouseEnter={() => setHoveredAppId(item.id)}
                          onMouseLeave={() => setHoveredAppId(null)}
                        >
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
                              item.risk_band === 'HIGH'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : item.risk_band === 'MEDIUM'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            <ShieldAlert className="w-3 h-3" />
                            <span className="font-mono tabular-nums">{item.risk_score.toFixed(0)}</span>
                            <span className="text-[10px]">({item.risk_band})</span>
                          </span>

                          {/* Hover Popover: 'Why this score' */}
                          {isHovered && (
                            <div className="absolute z-30 left-0 top-full mt-1 w-72 p-3 bg-slate-900 text-white rounded-lg shadow-xl text-left border border-slate-700">
                              <div className="text-[10px] font-bold text-saffron-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <Info className="w-3 h-3" /> Why this score (Top 3 reasons):
                              </div>
                              <ul className="space-y-1 text-[11px] text-slate-200">
                                {item.top_risk_reasons.map((r, rIdx) => (
                                  <li key={rIdx} className="flex items-start gap-1.5">
                                    <span className="text-blue-400 font-bold shrink-0">•</span>
                                    <span>{r}</span>
                                  </li>
                                ))}
                              </ul>
                              <div className="mt-2 pt-1.5 border-t border-slate-800 text-[9px] text-slate-400 flex items-center justify-between">
                                <span>Advisory Risk Engine v2.0</span>
                                <span>Click to inspect dossier</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* SLA Turnaround */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <Clock className={`w-3.5 h-3.5 ${
                            item.sla_status === 'OVERDUE'
                              ? 'text-rose-600'
                              : item.sla_status === 'URGENT'
                              ? 'text-amber-500'
                              : 'text-emerald-600'
                          }`} />
                          <span className={`font-mono text-[12px] font-semibold tabular-nums ${
                            item.sla_status === 'OVERDUE'
                              ? 'text-rose-700 font-bold'
                              : item.sla_status === 'URGENT'
                              ? 'text-amber-700 font-bold'
                              : 'text-slate-700'
                          }`}>
                            {item.sla_days_left}d left
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          item.status === 'AWAITING_SENIOR_CONFIRMATION'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : item.status === 'DEFICIENCY_RAISED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : item.status === 'UNDER_SCRUTINY'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Assignee */}
                      <td className="py-3 px-3">
                        <span className="text-[11px] text-slate-700">
                          {item.assigned_officer_name}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => navigate(`/official/applications/${item.id}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded cursor-pointer transition-colors"
                        >
                          Review <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Assign Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Assign {selectedIds.size} Selected Applications
              </h3>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assign To Scrutiny Officer:
                </label>
                <select
                  value={selectedOfficer}
                  onChange={e => setSelectedOfficer(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {officers.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.role.replace(/_/g, ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assignment Justification / Remarks:
                </label>
                <textarea
                  rows={3}
                  value={bulkRemarks}
                  onChange={e => setBulkRemarks(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setAssignModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAssign}
                disabled={assigning}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {assigning ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
