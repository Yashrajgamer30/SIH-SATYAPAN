import React, { useState, useEffect, useCallback } from 'react';
import { Sliders, Save, Edit2, Shield, Check, RefreshCw, AlertTriangle, ToggleLeft, ToggleRight, ChevronDown, ChevronRight } from 'lucide-react';
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

const CATEGORY_COLOURS: Record<string, string> = {
  LAND_OWNERSHIP:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  FIRE_NOC:           'bg-orange-50 text-orange-700 border-orange-200',
  FACULTY_APPOINTMENT:'bg-blue-50 text-blue-700 border-blue-200',
  FINANCIAL_SECURITY: 'bg-violet-50 text-violet-700 border-violet-200',
  BUILDING_SAFETY:    'bg-amber-50 text-amber-700 border-amber-200',
  STATUTORY_DOCUMENTS:'bg-rose-50 text-rose-700 border-rose-200',
};

function categoryBadge(cat: string) {
  const cls = CATEGORY_COLOURS[cat] ?? 'bg-slate-50 text-slate-700 border-slate-200';
  return `text-[10px] font-semibold px-2 py-0.5 rounded border ${cls}`;
}

export const AdminRuleBuilder: React.FC = () => {
  const [rules, setRules]           = useState<RuleItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editingJson, setEditingJson] = useState<string>('');
  const [jsonError, setJsonError]   = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [resetting, setResetting]   = useState(false);
  const [collapsed, setCollapsed]   = useState<Set<string>>(new Set());

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/official/rules`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: RuleItem[] = await res.json();
      setRules(data);
    } catch (e) {
      setError(`Failed to load rules from backend: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRules(); }, [loadRules]);

  const flashSuccess = (msg: string) => {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  const handleStartEdit = (rule: RuleItem) => {
    setEditingCode(rule.rule_code);
    setEditingJson(JSON.stringify(rule.rule_json, null, 2));
    setJsonError(null);
  };

  const handleSaveEdit = async (rule: RuleItem) => {
    setJsonError(null);
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(editingJson);
    } catch {
      setJsonError('Invalid JSON — please fix syntax before saving.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/official/rules/${rule.rule_code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule_json: parsed, is_active: rule.is_active, remarks: 'Updated via Admin UI' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setRules(prev => prev.map(r =>
        r.rule_code === rule.rule_code
          ? { ...r, rule_json: parsed, version: updated.version }
          : r
      ));
      setEditingCode(null);
      flashSuccess(`Rule ${rule.rule_code} saved — now Version ${updated.version}.0`);
    } catch (e) {
      setJsonError(`Save failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (rule: RuleItem) => {
    const newActive = !rule.is_active;
    try {
      const res = await fetch(`${API_BASE}/official/rules/${rule.rule_code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule_json: rule.rule_json, is_active: newActive, remarks: newActive ? 'Activated via Admin UI' : 'Deactivated via Admin UI' }),
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

  const handleReset = async () => {
    if (!window.confirm('Restore all rules to AICTE APH 2026-27 statutory defaults? This cannot be undone.')) return;
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
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            Configurable APH Checklist &amp; Rule Engine&nbsp;
            <span className="text-xs font-normal text-slate-500">(Principle 3)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            All regulatory checklists and verification thresholds are persisted as versioned JSON in the database. Zero hard-coded rules.
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
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded cursor-pointer disabled:opacity-50"
          >
            <Shield className="w-3.5 h-3.5" />
            {resetting ? 'Resetting…' : 'Reset to APH Defaults'}
          </button>
        </div>
      </div>

      {/* Success toast */}
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" /> {saveSuccess}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto text-rose-500 hover:text-rose-700 cursor-pointer">✕</button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Rules list */}
      {!loading && (
        <div className="space-y-3">
          {rules.map(rule => {
            const isEditing  = editingCode === rule.rule_code;
            const isCollapsed = collapsed.has(rule.rule_code);
            return (
              <div
                key={rule.rule_code}
                className={`bg-white border rounded-lg shadow-xs transition-all ${rule.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}
              >
                {/* Card header */}
                <div className="flex flex-wrap items-center gap-2 p-4 pb-2">
                  {/* Collapse toggle */}
                  <button
                    onClick={() => toggleCollapse(rule.rule_code)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="Toggle"
                  >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {/* rule_code badge */}
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded">
                    {rule.rule_code}
                  </span>

                  {/* version badge */}
                  <span className="text-xs font-semibold px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200">
                    v{rule.version}.0
                  </span>

                  {/* category badge */}
                  <span className={categoryBadge(rule.category)}>
                    {rule.category.replace(/_/g, ' ')}
                  </span>

                  {/* updated_at */}
                  {rule.updated_at && (
                    <span className="text-[10px] text-slate-400 ml-auto">
                      Last updated {new Date(rule.updated_at).toLocaleString()}
                    </span>
                  )}

                  {/* active/inactive toggle */}
                  <button
                    onClick={() => handleToggleActive(rule)}
                    className="flex items-center gap-1 text-xs cursor-pointer ml-auto"
                    title={rule.is_active ? 'Click to deactivate' : 'Click to activate'}
                  >
                    {rule.is_active
                      ? <><ToggleRight className="w-5 h-5 text-emerald-600" /><span className="font-semibold text-emerald-700">Active</span></>
                      : <><ToggleLeft className="w-5 h-5 text-slate-400" /><span className="font-semibold text-slate-500">Inactive</span></>
                    }
                  </button>

                  {/* edit button */}
                  {!isEditing && !isCollapsed && (
                    <button
                      onClick={() => handleStartEdit(rule)}
                      className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2.5 py-1 rounded cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                </div>

                {/* Card body */}
                {!isCollapsed && (
                  <div className="px-4 pb-4">
                    <h3 className="text-sm font-bold text-slate-900 mb-0.5">{rule.title}</h3>
                    <p className="text-xs text-slate-500 mb-3">{rule.description}</p>

                    {isEditing ? (
                      <div className="space-y-2">
                        <label className="block text-xs font-mono text-slate-700 font-bold">
                          Rule JSON (edit thresholds below):
                        </label>
                        <textarea
                          rows={8}
                          value={editingJson}
                          onChange={e => { setEditingJson(e.target.value); setJsonError(null); }}
                          className="w-full text-xs font-mono bg-slate-900 text-emerald-400 p-3 rounded border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          spellCheck={false}
                        />
                        {jsonError && (
                          <p className="text-xs text-rose-600 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> {jsonError}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveEdit(rule)}
                            disabled={saving}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Save className="w-3.5 h-3.5" />
                            {saving ? 'Saving…' : 'Save New Version'}
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
                      <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs font-mono text-slate-800 max-h-48 overflow-auto">
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

      {!loading && rules.length === 0 && !error && (
        <p className="text-sm text-slate-500 text-center py-8">No rules found. Click "Reset to APH Defaults" to seed the rule engine.</p>
      )}
    </div>
  );
};
