import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Building2, 
  Search, 
  Filter, 
  ArrowRight, 
  FileCheck2, 
  AlertCircle, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  ShieldAlert 
} from 'lucide-react';
import { AdvisoryBanner, VerificationStatusBadge } from '../components/StatusBadges';

interface DashboardProps {
  currentRole: string;
  onSelectApplication: (id: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentRole, onSelectApplication }) => {
  const { t } = useTranslation();
  const [filterQuery, setFilterQuery] = useState('');

  // Sample EoA applications representing the Grand Finale Demo Scenarios
  const applications = [
    {
      id: 1,
      application_number: "AICTE/EOA/2026/MH-PUNE-402",
      institute_name: "Saraswati Institute of Technology",
      aicte_id: "AICTE-1-3324901",
      district: "Pune, Maharashtra",
      academic_year: "2026-2027",
      application_type: "Extension of Approval (EoA)",
      status: "SUBMITTED",
      risk_level: "LOW",
      composite_risk_score: 4.5,
      doc_count: 8,
      key_findings: "All norms verified genuine. Land area 3.25 acres (> 2.50 required). Zero duplicate faculty.",
      demo_scenario: "Clean Genuine Application (Green Path)"
    },
    {
      id: 2,
      application_number: "AICTE/EOA/2026/MH-NSK-108",
      institute_name: "Sahyadri College of Engineering",
      aicte_id: "AICTE-1-8891023",
      district: "Nashik, Maharashtra",
      academic_year: "2026-2027",
      application_type: "Extension of Approval (EoA)",
      status: "UNDER_SCRUTINY",
      risk_level: "HIGH",
      composite_risk_score: 78.2,
      doc_count: 7,
      key_findings: "Deficit land (1.40 acres vs 2.50 required), Expired Fire NOC, Duplicate Faculty detected.",
      demo_scenario: "Multi-Deficiency & Anomaly Scenario (Red Path)"
    }
  ];

  // Principle 4: Authorized Access Only - Institute Admin sees only their institution
  const visibleApplications = currentRole === 'INSTITUTE_ADMIN' 
    ? applications.filter(a => a.id === 1)
    : applications;

  const filtered = visibleApplications.filter(a => 
    a.institute_name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    a.application_number.toLowerCase().includes(filterQuery.toLowerCase()) ||
    a.aicte_id.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Principle 1 Mandated Banner */}
      <AdvisoryBanner />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Scrutiny Applications
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900">{visibleApplications.length}</span>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Cycle 2026-27
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Low Risk (Fast-Track Advisory)
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-emerald-600">1</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Ready for Scrutiny
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            High Risk / Deficiency Flagged
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-rose-600">
              {currentRole === 'INSTITUTE_ADMIN' ? '0' : '1'}
            </span>
            <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
              Action Required
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active APH Checklist Rules
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900">5 Active</span>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
              v1.0 Configured
            </span>
          </div>
        </div>
      </div>

      {/* Roster Controls */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Institution, AICTE ID, or Application No..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Active Mode:</span>
          <span className="text-xs font-bold px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded">
            DEMO_MODE=TRUE (Deterministic Grand Finale Pack)
          </span>
        </div>
      </div>

      {/* Applications Roster Cards */}
      <div className="space-y-3">
        {filtered.map((app) => (
          <div
            key={app.id}
            className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs hover:border-blue-400 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {app.application_number}
                </span>
                <span className="text-xs text-slate-500">
                  AICTE ID: <strong className="text-slate-700">{app.aicte_id}</strong>
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {app.demo_scenario}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900">
                {app.institute_name}
              </h3>
              <p className="text-xs text-slate-500">
                {app.district} • Academic Year {app.academic_year} • {app.application_type}
              </p>

              <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 mt-2">
                <strong>Preliminary Advisory Note:</strong> {app.key_findings}
              </p>
            </div>

            <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Advisory Risk Index</span>
                <span className={`text-sm font-black ${
                  app.risk_level === 'LOW' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {app.risk_level} ({app.composite_risk_score}/100)
                </span>
              </div>

              <button
                onClick={() => onSelectApplication(app.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-bold bg-[#1B365D] hover:bg-[#0F2342] text-white shadow-xs transition-colors cursor-pointer"
              >
                Open Scrutiny Desk <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
