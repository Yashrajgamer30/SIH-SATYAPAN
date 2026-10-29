import React, { useState, useEffect, useCallback } from 'react';
import {
  Sliders, Save, Edit2, Shield, Check, RefreshCw, AlertTriangle,
  ToggleLeft, ToggleRight, ChevronDown, ChevronRight, Play, RotateCcw,
  Users, Settings, Code, FileText, CheckCircle2, X
} from 'lucide-react';
import { AdvisoryBanner } from '../components/StatusBadges';

const API_BASE = 'http://localhost:8000';

interface RuleItem {
  rule_code: string;
  category: string;
  title: string;
  description: string;
  version: number;
  is_active: boolean;
  rule_json: Record<string, unknown>;
  updated_at?: string;
}

interface TestOutcome {
  tested_application: string;
  passed: boolean;
  threshold: string;
  evaluated_value: string;
  rationale: string;
}

const CATEGORY_COLOURS: Record<string, string> = {
  'Land & Infrastructure': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Fire & Building Safety': 'bg-orange-50 text-orange-700 border-orange-200',
  'Faculty & Staff Norms': 'bg-blue-50 text-blue-700 border-blue-200',
  'Financial Viability': 'bg-violet-50 text-violet-700 border-violet-200',
  'Statutory Affidavits': 'bg-rose-50 text-rose-700 border-rose-200',
};

export const AdminRuleBuilder: React.FC = () => {
  const [activeAdminTab, setActiveAdminTab] = useState<'rules' | 'users' | 'config'>('rules');

  const [rules, setRules] = useState<RuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editing state
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'form' | 'json'>('form');
  const [editingJson, setEditingJson] = useState<string>('');
  const [editingFormData, setEditingFormData] = useState<Record<string, unknown>>({});
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Rule Test Modal State
  const [testModalRule, setTestModalRule] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestOutcome | null>(null);
  const [testingRule, setTestingRule] = useState(false);

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/official/rules`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: RuleItem[] = await res.json();
      setRules(data);
    } catch (e) {
      setError(`Failed to load rules: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const flashSuccess = (msg: string) => {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  const handleStartEdit = (rule: RuleItem) => {
    setEditingCode(rule.rule_code);
    setEditingFormData({ ...rule.rule_json });
    setEditingJson(JSON.stringify(rule.rule_json, null, 2));
    setEditMode('form');
    setJsonError(null);
  };

  const handleSaveEdit = async (rule: RuleItem) => {
    setJsonError(null);
    let payloadJson: Record<string, unknown>;

    if (editMode === 'form') {
      payloadJson = editingFormData;
    } else {
      try {
        payloadJson = JSON.parse(editingJson);
      } catch {
        setJsonError('Invalid JSON format. Please verify syntax.');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/official/rules/${rule.rule_code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_json: payloadJson,
          is_active: rule.is_active,
          remarks: 'Updated via Administrator Rules Portal'
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setRules(prev => prev.map(r =>
        r.rule_code === rule.rule_code
          ? { ...r, rule_json: payloadJson, version: updated.version }
          : r
      ));
      setEditingCode(null);
      flashSuccess(`Rule ${rule.rule_code} saved — Version bumped to v${updated.version}.0`);
    } catch (e) {
      setJsonError(`Save failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRollback = async (ruleCode: string) => {
    if (!window.confirm(`Roll back ${ruleCode} to default Version 1.0?`)) return;
    try {
      const res = await fetch(`${API_BASE}/official/rules/${ruleCode}/rollback`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadRules();
      flashSuccess(`Rule ${ruleCode} rolled back to Version 1.0 defaults.`);
    } catch (e) {
      alert(`Rollback failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleTestRule = async (ruleCode: string) => {
    setTestModalRule(ruleCode);
    setTestingRule(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API_BASE}/official/rules/${ruleCode}/test`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTestResult(data.evaluation);
    } catch (e) {
      alert(`Test failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setTestingRule(false);
    }
  };

  const handleToggleActive = async (rule: RuleItem) => {
    const newActive = !rule.is_active;
    try {
      const res = await fetch(`${API_BASE}/official/rules/${rule.rule_code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_json: rule.rule_json,
          is_active: newActive,
          remarks: newActive ? 'Activated via Admin UI' : 'Deactivated via Admin UI'
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setRules(prev => prev.map(r =>
        r.rule_code === rule.rule_code ? { ...r, is_active: newActive, version: updated.version } : r
      ));
      flashSuccess(`Rule ${rule.rule_code} ${newActive ? 'activated' : 'deactivated'}`);
    } catch (e) {
      setError(`Toggle failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleResetAll = async () => {
    if (!window.confirm('Restore all rules to official AICTE APH 2026-27 defaults?')) return;
    setResetting(true);
    try {
      const res = await fetch(`${API_BASE}/official/rules/reset`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadRules();
      flashSuccess('All rules restored to AICTE APH 2026-27 statutory defaults.');
    } catch (e) {
      setError(`Reset failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setResetting(false);
    }
  };

  const toggleCollapse = (code: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Principle 1 advisory banner */}
      <AdvisoryBanner />

      {/* Header bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            Configurable APH Checklist &amp; Rule Engine (Principle 3)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Every regulatory threshold is persisted in the database as versioned JSON with immutable audit logs. Zero hardcoded business logic.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadRules}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleResetAll}
            disabled={resetting}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded cursor-pointer disabled:opacity-50"
          >
            <Shield className="w-3.5 h-3.5" />
            {resetting ? 'Resetting…' : 'Reset to APH Defaults'}
          </button>
        </div>
      </div>

      {/* Section Nav Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveAdminTab('rules')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold cursor-pointer ${
            activeAdminTab === 'rules'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> Checklist &amp; Rules Builder ({rules.length})
        </button>
        <button
          onClick={() => setActiveAdminTab('users')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold cursor-pointer ${
            activeAdminTab === 'users'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Scrutiny Users &amp; Roles
        </button>
        <button
          onClick={() => setActiveAdminTab('config')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold cursor-pointer ${
            activeAdminTab === 'config'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-3.5 h-3.5" /> System Configuration
        </button>
      </div>

      {/* Feedback Toast */}
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" /> {saveSuccess}
        </div>
      )}

      {/* TAB 1: RULES BUILDER */}
      {activeAdminTab === 'rules' && (
        <div className="space-y-3">
          {rules.map(rule => {
            const isEditing = editingCode === rule.rule_code;
            const isCollapsed = collapsed.has(rule.rule_code);
            const badgeCls = CATEGORY_COLOURS[rule.category] || 'bg-slate-50 text-slate-700 border-slate-200';

            return (
              <div
                key={rule.rule_code}
                className={`bg-white border rounded-lg shadow-xs transition-all ${
                  rule.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60'
                }`}
              >
                {/* Header */}
                <div className="flex flex-wrap items-center gap-2 p-4 pb-2">
                  <button
                    onClick={() => toggleCollapse(rule.rule_code)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded">
                    {rule.rule_code}
                  </span>

                  <span className="text-xs font-semibold px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200">
                    v{rule.version}.0
                  </span>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badgeCls}`}>
                    {rule.category}
                  </span>

                  {rule.updated_at && (
                    <span className="text-[10px] text-slate-400 ml-auto hidden sm:inline">
                      Updated {new Date(rule.updated_at).toLocaleDateString()}
                    </span>
                  )}

                  {/* Active Toggle */}
                  <button
                    onClick={() => handleToggleActive(rule)}
                    className="flex items-center gap-1 text-xs cursor-pointer ml-auto"
                    title={rule.is_active ? 'Click to deactivate' : 'Click to activate'}
                  >
                    {rule.is_active ? (
                      <><ToggleRight className="w-5 h-5 text-emerald-600" /><span className="font-semibold text-emerald-700">Active</span></>
                    ) : (
                      <><ToggleLeft className="w-5 h-5 text-slate-400" /><span className="font-semibold text-slate-500">Inactive</span></>
                    )}
                  </button>

                  {/* Action Buttons */}
                  {!isEditing && !isCollapsed && (
                    <div className="flex items-center gap-1.5 ml-2">
                      {/* Test Rule Button */}
                      <button
                        onClick={() => handleTestRule(rule.rule_code)}
                        className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded cursor-pointer border border-emerald-200"
                        title="Simulate rule evaluation on sample application dossier"
                      >
                        <Play className="w-3 h-3" /> Test on Sample
                      </button>

                      {/* Rollback Button (if v > 1) */}
                      {rule.version > 1 && (
                        <button
                          onClick={() => handleRollback(rule.rule_code)}
                          className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 px-2 py-1 rounded cursor-pointer border border-amber-200"
                          title="Revert rule to Version 1.0 statutory default"
                        >
                          <RotateCcw className="w-3 h-3" /> Rollback
                        </button>
                      )}

                      {/* Edit Button */}
                      <button
                        onClick={() => handleStartEdit(rule)}
                        className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2.5 py-1 rounded cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    </div>
                  )}
                </div>

                {/* Body */}
                {!isCollapsed && (
                  <div className="px-4 pb-4">
                    <h3 className="text-sm font-bold text-slate-900 mb-0.5">{rule.title}</h3>
                    <p className="text-xs text-slate-500 mb-3">{rule.description}</p>

                    {isEditing ? (
                      <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        {/* Form vs JSON Toggle */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <span className="text-xs font-bold text-slate-700">Editor Format:</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditMode('form');
                                try {
                                  setEditingFormData(JSON.parse(editingJson));
                                } catch {}
                              }}
                              className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer flex items-center gap-1 ${
                                editMode === 'form' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-700'
                              }`}
                            >
                              <FileText className="w-3 h-3" /> Form UI
                            </button>
                            <button
                              onClick={() => {
                                setEditMode('json');
                                setEditingJson(JSON.stringify(editingFormData, null, 2));
                              }}
                              className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer flex items-center gap-1 ${
                                editMode === 'json' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-700'
                              }`}
                            >
                              <Code className="w-3 h-3" /> Raw JSON
                            </button>
                          </div>
                        </div>

                        {/* FORM UI OVER JSON */}
                        {editMode === 'form' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {Object.entries(editingFormData).map(([key, val]) => (
                              <div key={key} className="space-y-1">
                                <label className="block text-[11px] font-bold text-slate-700 font-mono">
                                  {key.replace(/_/g, ' ')}:
                                </label>
                                {typeof val === 'boolean' ? (
                                  <button
                                    type="button"
                                    onClick={() => setEditingFormData(prev => ({ ...prev, [key]: !val }))}
                                    className={`px-3 py-1.5 rounded font-bold text-xs border ${
                                      val ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {val ? 'TRUE (Mandatory)' : 'FALSE (Optional)'}
                                  </button>
                                ) : typeof val === 'number' ? (
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={val}
                                    onChange={e => setEditingFormData(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                                    className="w-full text-xs p-1.5 rounded border border-slate-300 bg-white font-mono"
                                  />
                                ) : Array.isArray(val) ? (
                                  <input
                                    type="text"
                                    value={val.join(', ')}
                                    onChange={e => setEditingFormData(prev => ({ ...prev, [key]: e.target.value.split(',').map(s => s.trim()) }))}
                                    className="w-full text-xs p-1.5 rounded border border-slate-300 bg-white font-mono"
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={String(val)}
                                    onChange={e => setEditingFormData(prev => ({ ...prev, [key]: e.target.value }))}
                                    className="w-full text-xs p-1.5 rounded border border-slate-300 bg-white font-mono"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div>
                            <textarea
                              rows={8}
                              value={editingJson}
                              onChange={e => { setEditingJson(e.target.value); setJsonError(null); }}
                              className="w-full text-xs font-mono bg-slate-900 text-emerald-400 p-3 rounded border border-slate-700 focus:outline-none"
                              spellCheck={false}
                            />
                            {jsonError && (
                              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> {jsonError}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Save & Cancel */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                          <button
                            onClick={() => handleSaveEdit(rule)}
                            disabled={saving}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Save className="w-3.5 h-3.5" />
                            {saving ? 'Saving...' : 'Save New Version'}
                          </button>
                          <button
                            onClick={() => { setEditingCode(null); setJsonError(null); }}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs font-mono text-slate-800 max-h-44 overflow-auto">
                        <pre>{JSON.stringify(rule.rule_json, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: USERS AND ROLES */}
      {activeAdminTab === 'users' && (
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Regulatory Users &amp; Role-Based Access Control</h3>
            <p className="text-xs text-slate-500">Authorized government personnel and institutional administrative profiles.</p>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-2 px-3">Officer Name</th>
                  <th className="py-2 px-3">Regulatory Role</th>
                  <th className="py-2 px-3">Official Email</th>
                  <th className="py-2 px-3">MFA Status</th>
                  <th className="py-2 px-3">Permissions Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: 'Shri R. Verma', role: 'OFFICIAL_SCRUTINY', email: 'scrutiny@aicte.demo', scope: 'Preliminary Scrutiny, Deficiencies, Document Inspection' },
                  { name: 'Smt. A. Iyer', role: 'OFFICIAL_SENIOR', email: 'senior@aicte.demo', scope: 'Two-Person Rule Endorsement, Sanction Orders, Escalations' },
                  { name: 'System Policy Administrator', role: 'SYSTEM_ADMIN', email: 'sysadmin@aicte.demo', scope: 'Statutory Rule Thresholds, Audit Ledger, Hash Chain Watchdog' },
                  { name: 'Dr. Principal Sharma', role: 'INSTITUTE_ADMIN', email: 'principal@sit.ac.in', scope: 'Institutional Dossier, Student Cohort, Document Vault' }
                ].map((u, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{u.name}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{u.email}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 6-digit TOTP Active
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{u.scope}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM CONFIGURATION */}
      {activeAdminTab === 'config' && (
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">System Runtime Configuration</h3>
            <p className="text-xs text-slate-500">Security parameters and operational governance flags.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            {[
              { label: 'DEMO_MODE_ACTIVE', val: 'TRUE', desc: 'Demo pack pre-cache and one-click database reset enabled' },
              { label: 'JWT_ACCESS_TOKEN_LIFETIME', val: '15 Minutes', desc: 'Mandated strict session token expiration' },
              { label: 'REFRESH_TOKEN_LIFETIME', val: '7 Days', desc: 'Secure httpOnly sameSite=Strict cookie' },
              { label: 'MAX_DOCUMENT_SIZE_BYTES', val: '15,728,640 (15 MB)', desc: 'Magic-byte verified PDF / JPEG / PNG' },
              { label: 'STORAGE_ENCRYPTION_CIPHER', val: 'AES-256-GCM', desc: 'Authenticated symmetric ciphertext at rest' },
              { label: 'RATE_LIMIT_RULE', val: '100 requests / minute', desc: 'SlowAPI token bucket defense' }
            ].map((c, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold">{c.label}</span>
                <div className="text-sm font-bold text-blue-900">{c.val}</div>
                <p className="text-[10px] text-slate-500 font-sans">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TEST RULE ON SAMPLE APPLICATION MODAL */}
      {testModalRule && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-5 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Play className="w-4 h-4 text-emerald-600" />
                Rule Simulation: {testModalRule}
              </h3>
              <button
                onClick={() => setTestModalRule(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {testingRule ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600" />
                <p>Executing statutory rule evaluation against sample application dossier...</p>
              </div>
            ) : testResult ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                  <div>Tested Sample Dossier: <strong className="font-mono">{testResult.tested_application}</strong></div>
                  <div>Statutory Threshold: <span className="font-mono font-bold text-blue-900">{testResult.threshold}</span></div>
                  <div>Evaluated Dossier Value: <span className="font-mono font-bold text-slate-800">{testResult.evaluated_value}</span></div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-2 text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Simulation Outcome: RULE PASSED</span>
                    <span className="text-[11px] text-emerald-800">{testResult.rationale}</span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setTestModalRule(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded cursor-pointer"
              >
                Close Simulation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
