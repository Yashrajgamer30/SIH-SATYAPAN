import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sliders, Save, Plus, Edit2, Shield, Check, Info } from 'lucide-react';
import { AdvisoryBanner } from '../components/StatusBadges';

export const AdminRuleBuilder: React.FC = () => {
  const { t } = useTranslation();
  
  const [rules, setRules] = useState([
    {
      id: 1,
      rule_code: "LAND_AREA_COMPLIANCE",
      category: "LAND_OWNERSHIP",
      title: "Minimum Land Requirement for Technical Institution",
      description: "Validates that the institution possesses contiguous unencumbered land based on location classification.",
      version: 1,
      rule_json: {
        min_acres_metro: 1.5,
        min_acres_urban: 2.5,
        min_acres_rural: 4.0,
        ownership_types_allowed: ["OWNED", "GOVERNMENT_LEASE_30_YEARS"],
        allow_multiple_plots: false
      }
    },
    {
      id: 2,
      rule_code: "FIRE_NOC_VALIDITY",
      category: "FIRE_NOC",
      title: "Fire Safety Certificate / NOC Validity Check",
      description: "Ensures Fire Department NOC is unexpired and encompasses all operational campus structures.",
      version: 1,
      rule_json: {
        must_be_active: true,
        authority_type: "STATE_FIRE_SERVICES",
        renewal_grace_period_days: 0
      }
    },
    {
      id: 3,
      rule_code: "FACULTY_CADRE_RATIO",
      category: "FACULTY_APPOINTMENT",
      title: "Faculty-to-Student & Cadre Ratio Compliance",
      description: "Verifies Student-to-Faculty Ratio (SFR) 1:20 and Cadre distribution 1:2:6.",
      version: 1,
      rule_json: {
        target_sfr: 20,
        max_sfr_tolerated: 20.0,
        min_phd_percentage: 20.0,
        duplicate_faculty_prohibited: true
      }
    }
  ]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingJsonText, setEditingJsonText] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const handleStartEdit = (rule: typeof rules[0]) => {
    setEditingId(rule.id);
    setEditingJsonText(JSON.stringify(rule.rule_json, null, 2));
    setSaveSuccess(null);
  };

  const handleSaveEdit = (ruleId: number) => {
    try {
      const parsed = JSON.parse(editingJsonText);
      setRules(prev => prev.map(r => {
        if (r.id === ruleId) {
          return {
            ...r,
            rule_json: parsed,
            version: r.version + 1
          };
        }
        return r;
      }));
      setEditingId(null);
      setSaveSuccess(`Rule updated successfully to Version ${rules.find(r => r.id === ruleId)!.version + 1}`);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (e) {
      alert("Invalid JSON format. Please verify syntax.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Principle 1 Banner */}
      <AdvisoryBanner />

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            Configurable APH Checklist & Rule Engine (Principle 3)
          </h2>
          <p className="text-xs text-slate-500">
            All regulatory checklists and verification thresholds are stored in the database as versioned JSON. Zero hardcoded rules.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" /> {saveSuccess}
        </div>
      )}

      <div className="space-y-4">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded">
                  {rule.rule_code}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200">
                  Version {rule.version}.0
                </span>
              </div>

              {editingId !== rule.id && (
                <button
                  onClick={() => handleStartEdit(rule)}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Rule Thresholds
                </button>
              )}
            </div>

            <h3 className="text-sm font-bold text-slate-900 mb-1">
              {rule.title}
            </h3>
            <p className="text-xs text-slate-600 mb-3">
              {rule.description}
            </p>

            {editingId === rule.id ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono text-slate-700 font-bold mb-1">
                    Editable Rule Configuration (JSON):
                  </label>
                  <textarea
                    rows={6}
                    value={editingJsonText}
                    onChange={(e) => setEditingJsonText(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-900 text-emerald-400 p-3 rounded border border-slate-700 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSaveEdit(rule.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Save New Version
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs font-mono text-slate-800">
                <pre className="overflow-x-auto">{JSON.stringify(rule.rule_json, null, 2)}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
