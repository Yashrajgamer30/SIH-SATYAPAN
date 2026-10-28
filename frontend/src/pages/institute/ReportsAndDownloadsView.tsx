import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../context/authStore';
import {
  DownloadCloud, FileSpreadsheet, FileText, Download,
  GitCompare, ArrowRight, TrendingUp, CheckCircle2,
  Building, Users, RefreshCw
} from 'lucide-react';

interface ComparisonData {
  academic_years: { previous: string; current: string };
  approved_intake: Array<{
    programme: string;
    previous: number;
    current: number;
    difference: number;
    status: string;
  }>;
  faculty_strength: Array<{
    cadre: string;
    previous: number;
    current: number;
    difference: number;
    status: string;
  }>;
  infrastructure: Array<{
    facility: string;
    previous: number;
    current: number;
    difference: number;
    status: string;
  }>;
}

export const ReportsAndDownloadsView: React.FC = () => {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'downloads' | 'compare'>('downloads');
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loadingCompare, setLoadingCompare] = useState(false);

  const fetchComparison = async () => {
    setLoadingCompare(true);
    try {
      const resp = await fetch('http://localhost:8000/institute/compare-previous', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const json = await resp.json();
        setComparison(json);
      }
    } catch (e) {
      console.warn('Failed to load year comparison:', e);
    } finally {
      setLoadingCompare(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'compare' && !comparison) {
      fetchComparison();
    }
  }, [activeTab]);

  const handleExport = (resource: string, format: 'xlsx' | 'csv') => {
    window.open(`http://localhost:8000/institute/export/${resource}?format=${format}`, '_blank');
  };

  const reportCards = [
    {
      title: 'Enrolled Student Register',
      description: 'Complete student roster with category breakdown, gender proportions, and document submission verification.',
      resource: 'students',
      formats: ['xlsx', 'csv'] as const
    },
    {
      title: 'Cadre-Wise Faculty Roster',
      description: 'Endorsed faculty roster with designations, qualifications, masked PAN numbers, and AICTE cadre compliance status.',
      resource: 'faculty',
      formats: ['xlsx', 'csv'] as const
    },
    {
      title: 'Regulatory Approval Applications',
      description: 'Historical archive of submitted and draft applications with readiness metrics, tamper hash, and submission receipts.',
      resource: 'applications',
      formats: ['xlsx', 'csv'] as const
    },
    {
      title: 'Missing & Expiring Documents List',
      description: 'Consolidated statutory compliance audit sheet listing missing certificates, upcoming expirations, and readiness penalties.',
      resource: 'missing-documents',
      formats: ['xlsx', 'csv'] as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-24 font-bold text-navy-950 dark:text-white flex items-center gap-2.5">
            <DownloadCloud className="w-6 h-6 text-saffron-500" />
            <span>Reports, Exports & Year-on-Year Comparison</span>
          </h1>
          <p className="text-13 text-gov-muted mt-1">
            Generate certified reports across Excel (.xlsx), CSV, and view side-by-side growth analytics.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 p-1 shadow-2xs">
          <button
            onClick={() => setActiveTab('downloads')}
            className={`px-3.5 py-1.5 rounded-lg text-12 font-bold transition-colors ${
              activeTab === 'downloads'
                ? 'bg-saffron-500 text-white'
                : 'text-gov-text hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            Regulatory Reports
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`px-3.5 py-1.5 rounded-lg text-12 font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'compare'
                ? 'bg-saffron-500 text-white'
                : 'text-gov-text hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Compare with Last Year</span>
          </button>
        </div>
      </div>

      {/* 2. Regulatory Downloads Tab (Prompt C4.4) */}
      {activeTab === 'downloads' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportCards.map((rc) => (
            <div
              key={rc.resource}
              className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-saffron-600 dark:text-saffron-400 mb-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  <span className="text-11 font-bold uppercase tracking-wider">AICTE Certified Report</span>
                </div>
                <h3 className="text-16 font-bold text-navy-950 dark:text-white">
                  {rc.title}
                </h3>
                <p className="text-12 text-gov-muted mt-2 leading-relaxed">
                  {rc.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between">
                <span className="text-11 text-gov-muted font-medium">Export Formats:</span>
                <div className="flex items-center gap-2">
                  {rc.formats.map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => handleExport(rc.resource, fmt)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 hover:bg-saffron-50 dark:hover:bg-navy-700 text-gov-text text-12 font-bold uppercase transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Download className="w-3 h-3 text-saffron-500" />
                      <span>{fmt}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => alert(`Generating certified PDF for ${rc.title}...`)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 hover:bg-slate-100 text-gov-text text-12 font-bold uppercase transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <FileText className="w-3 h-3 text-red-500" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Compare with Last Year Tab (Prompt C4.5) */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          {loadingCompare && (
            <div className="p-12 text-center text-gov-muted">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-saffron-500 mb-2" />
              <span>Fetching side-by-side year-on-year AICTE data...</span>
            </div>
          )}

          {comparison && (
            <div className="space-y-6">
              {/* Year Summary Header */}
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GitCompare className="w-5 h-5 text-blue-600" />
                  <span className="text-13 font-bold text-blue-950 dark:text-blue-200">
                    Comparing Academic Year {comparison.academic_years.previous} vs Current {comparison.academic_years.current}
                  </span>
                </div>
                <span className="text-11 font-bold text-blue-800 dark:text-blue-300">
                  Highlighted Differentials
                </span>
              </div>

              {/* 1. Approved Intake Comparison */}
              <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs space-y-3">
                <h3 className="text-15 font-bold text-navy-950 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-saffron-500" />
                  <span>Approved Programmes & Seat Intake</span>
                </h3>

                <table className="w-full text-left border-collapse text-13">
                  <thead className="bg-slate-50 dark:bg-navy-800/80 text-11 font-bold text-gov-muted uppercase border-b border-slate-200 dark:border-navy-700">
                    <tr>
                      <th className="py-2.5 px-3">Programme</th>
                      <th className="py-2.5 px-3">Previous ({comparison.academic_years.previous})</th>
                      <th className="py-2.5 px-3">Current ({comparison.academic_years.current})</th>
                      <th className="py-2.5 px-3">Difference</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                    {comparison.approved_intake.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/30">
                        <td className="py-2.5 px-3 font-semibold text-navy-950 dark:text-white">{row.programme}</td>
                        <td className="py-2.5 px-3 font-mono">{row.previous} seats</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-navy-900 dark:text-white">{row.current} seats</td>
                        <td className="py-2.5 px-3 font-mono">
                          <span className={row.difference > 0 ? 'text-emerald-600 font-bold' : 'text-gov-muted'}>
                            {row.difference > 0 ? `+${row.difference}` : row.difference}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-10 font-bold ${
                            row.status === 'EXPANSION' || row.status === 'NET_INCREASE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 2. Faculty Strength Comparison */}
              <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs space-y-3">
                <h3 className="text-15 font-bold text-navy-950 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-saffron-500" />
                  <span>Cadre-Wise Faculty Appointments</span>
                </h3>

                <table className="w-full text-left border-collapse text-13">
                  <thead className="bg-slate-50 dark:bg-navy-800/80 text-11 font-bold text-gov-muted uppercase border-b border-slate-200 dark:border-navy-700">
                    <tr>
                      <th className="py-2.5 px-3">Faculty Cadre</th>
                      <th className="py-2.5 px-3">Previous Strength</th>
                      <th className="py-2.5 px-3">Current Strength</th>
                      <th className="py-2.5 px-3">Differential</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                    {comparison.faculty_strength.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/30">
                        <td className="py-2.5 px-3 font-semibold text-navy-950 dark:text-white">{row.cadre}</td>
                        <td className="py-2.5 px-3 font-mono">{row.previous}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-navy-900 dark:text-white">{row.current}</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-600 font-bold">
                          +{row.difference}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 3. Physical Infrastructure Expansion */}
              <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs space-y-3">
                <h3 className="text-15 font-bold text-navy-950 dark:text-white flex items-center gap-2">
                  <Building className="w-4 h-4 text-saffron-500" />
                  <span>Physical Infrastructure & Laboratories</span>
                </h3>

                <table className="w-full text-left border-collapse text-13">
                  <thead className="bg-slate-50 dark:bg-navy-800/80 text-11 font-bold text-gov-muted uppercase border-b border-slate-200 dark:border-navy-700">
                    <tr>
                      <th className="py-2.5 px-3">Facility Item</th>
                      <th className="py-2.5 px-3">Previous Year</th>
                      <th className="py-2.5 px-3">Current Year</th>
                      <th className="py-2.5 px-3">Net Gain</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                    {comparison.infrastructure.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/30">
                        <td className="py-2.5 px-3 font-semibold text-navy-950 dark:text-white">{row.facility}</td>
                        <td className="py-2.5 px-3 font-mono">{row.previous.toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-navy-900 dark:text-white">{row.current.toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-600 font-bold">
                          +{row.difference.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
