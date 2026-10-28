import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../context/authStore';
import {
  ShieldAlert, Clock, CheckCircle2, AlertTriangle, Activity,
  Filter, ArrowRight, Download, RefreshCw, Zap, MapPin, Eye,
  Search, ShieldCheck, FileText, Database, Sparkles, TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

interface OfficialDashboardData {
  advisory_banner: string;
  kpis: {
    total_applications: number;
    pending_scrutiny: number;
    high_risk_applications: number;
    fast_track_eligible: number;
    total_institutes: number;
    avg_risk_score: number;
  };
  risk_distribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  status_distribution: Record<string, number>;
  findings_by_severity: Record<string, number>;
  monthly_disposal_trend: Array<{ month: string; disposals: number }>;
  scrutiny_queue: Array<{
    id: number;
    application_no: string;
    institute_name: string;
    state: string;
    status: string;
    risk_score: number;
    fast_track: boolean;
    created_at: string;
  }>;
}

interface OfficialsDashboardProps {
  onSelectApplication?: (id: number) => void;
}

export const OfficialsDashboard: React.FC<OfficialsDashboardProps> = ({ onSelectApplication }) => {
  const { theme, language } = useTheme();
  const { token } = useAuthStore();

  const [data, setData] = useState<OfficialDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // SSE Live Alert Ticker state
  const [sseAlerts, setSseAlerts] = useState<string[]>([
    "HIGH ANOMALY: Fire NOC expired on Sahyadri College (Nashik, MH) — Flagged by Rule R-FIRE-04",
    "SOURCE UNAVAILABLE: DigiLocker State Land Registry timeout — Fallback to manual verification queue",
    "SLA BREACH ALERT: Saraswati Institute EoA dossier nearing 72h scrutiny window threshold"
  ]);

  const [selectedState, setSelectedState] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('http://localhost:8000/official/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!resp.ok) {
        throw new Error(`Failed to load scrutiny workbench (${resp.status})`);
      }
      const json = await resp.json();
      setData(json);
    } catch (err: any) {
      console.warn('Real endpoint fallback to curated seed:', err);
      setData({
        advisory_banner: "AI RESULT IS ADVISORY. Scrutiny and approval decisions rest strictly with authorized AICTE Officials.",
        kpis: {
          total_applications: 14,
          pending_scrutiny: 6,
          high_risk_applications: 3,
          fast_track_eligible: 5,
          total_institutes: 12,
          avg_risk_score: 34.2
        },
        risk_distribution: {
          LOW: 6,
          MEDIUM: 4,
          HIGH: 3,
          CRITICAL: 1
        },
        status_distribution: {
          SUBMITTED: 4,
          UNDER_SCRUTINY: 3,
          DEFICIENCY_RAISED: 2,
          APPROVED: 4,
          REJECTED: 1
        },
        findings_by_severity: {
          LOW: 8,
          MEDIUM: 5,
          HIGH: 4,
          CRITICAL: 2
        },
        monthly_disposal_trend: [
          { month: "May 2025", disposals: 12 },
          { month: "Jun 2025", disposals: 28 },
          { month: "Jul 2025", disposals: 45 },
          { month: "Aug 2025", disposals: 64 },
          { month: "Sep 2025", disposals: 82 },
          { month: "Oct 2025", disposals: 98 }
        ],
        scrutiny_queue: [
          {
            id: 2,
            application_no: "AICTE/EOA/2026/MH-NSK-108",
            institute_name: "Sahyadri College of Engineering",
            state: "Maharashtra",
            status: "UNDER_SCRUTINY",
            risk_score: 78.2,
            fast_track: false,
            created_at: "2026-02-19T14:20:00Z"
          },
          {
            id: 1,
            application_no: "AICTE/EOA/2026/MH-PUNE-402",
            institute_name: "Saraswati Institute of Technology",
            state: "Maharashtra",
            status: "SUBMITTED",
            risk_score: 4.5,
            fast_track: true,
            created_at: "2026-02-18T10:30:00Z"
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Connect SSE Stream for real-time alert ticker
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('http://localhost:8000/events');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.message || payload.alert) {
            setSseAlerts((prev) => [payload.message || payload.alert, ...prev.slice(0, 4)]);
          }
        } catch {
          // ignore heartbeats
        }
      };
    } catch {
      // SSE fallback
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [token]);

  // Heatmap State Data for India
  const indiaStateHeatmap = [
    { state: 'Maharashtra', code: 'MH', pending: 8, highRisk: 2, level: 'high' },
    { state: 'Karnataka', code: 'KA', pending: 5, highRisk: 1, level: 'medium' },
    { state: 'Tamil Nadu', code: 'TN', pending: 6, highRisk: 1, level: 'medium' },
    { state: 'Gujarat', code: 'GJ', pending: 4, highRisk: 0, level: 'low' },
    { state: 'Uttar Pradesh', code: 'UP', pending: 9, highRisk: 3, level: 'critical' },
    { state: 'Madhya Pradesh', code: 'MP', pending: 3, highRisk: 0, level: 'low' },
    { state: 'Delhi NCR', code: 'DL', pending: 4, highRisk: 1, level: 'medium' },
    { state: 'Andhra Pradesh', code: 'AP', pending: 5, highRisk: 1, level: 'medium' }
  ];

  // Recharts Datasets
  const flagsByTypeData = [
    { type: 'Land & Building', count: 14, fill: '#FF9933' },
    { type: 'Fire NOC Expiry', count: 9, fill: '#C62828' },
    { type: 'Faculty Duplication', count: 6, fill: '#7B1FA2' },
    { type: 'Affiliation Letter', count: 5, fill: '#1F3A93' },
    { type: 'TER Fee Anomaly', count: 2, fill: '#138808' }
  ];

  const riskBandDonut = [
    { name: 'Low Risk (Fast-track)', value: data?.risk_distribution.LOW || 6, color: '#138808' },
    { name: 'Medium Deficiency', value: data?.risk_distribution.MEDIUM || 4, color: '#FF9933' },
    { name: 'High Deficiency', value: data?.risk_distribution.HIGH || 3, color: '#E65100' },
    { name: 'Critical Anomaly', value: data?.risk_distribution.CRITICAL || 1, color: '#C62828' }
  ];

  const dailyIntakeDisposal = [
    { day: 'Mon', intake: 18, disposal: 15 },
    { day: 'Tue', intake: 24, disposal: 22 },
    { day: 'Wed', intake: 31, disposal: 29 },
    { day: 'Thu', intake: 22, disposal: 25 },
    { day: 'Fri', intake: 28, disposal: 26 },
    { day: 'Sat', intake: 14, disposal: 19 }
  ];

  const slaAgeingStackedData = [
    { region: 'Western (MH/GJ)', within3d: 14, fourTo7d: 8, eightTo14d: 4, breached: 1 },
    { region: 'Northern (UP/DL)', within3d: 11, fourTo7d: 9, eightTo14d: 5, breached: 2 },
    { region: 'Southern (TN/KA)', within3d: 16, fourTo7d: 6, eightTo14d: 2, breached: 0 },
    { region: 'Central (MP/CG)', within3d: 9, fourTo7d: 4, eightTo14d: 1, breached: 0 },
    { region: 'Eastern (WB/OR)', within3d: 8, fourTo7d: 5, eightTo14d: 3, breached: 1 }
  ];

  const slaAgeing = [
    { bucket: '< 3 Days', count: 18, color: '#138808' },
    { bucket: '4 - 7 Days', count: 9, color: '#FF9933' },
    { bucket: '8 - 14 Days', count: 4, color: '#E65100' },
    { bucket: '> 14 Days (Breached)', count: 2, color: '#C62828' }
  ];

  const top10Deficiencies = [
    { reason: 'Land Lease Expiry < 15 Yrs', occurrences: 12 },
    { reason: 'Fire NOC Not Countersigned', occurrences: 10 },
    { reason: 'Principal Qualification Gap', occurrences: 8 },
    { reason: 'Built-up Area Discrepancy > 10%', occurrences: 7 },
    { reason: 'Duplicate Faculty PAN Across Inst.', occurrences: 6 },
    { reason: 'Digital Signature Expired', occurrences: 5 }
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-slate-200 dark:bg-navy-800 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-navy-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-slate-200 dark:bg-navy-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Live Alert Ticker Fed by SSE */}
      <div className="relative overflow-hidden rounded-xl bg-navy-900 border border-navy-700 p-2.5 flex items-center gap-3 text-white shadow-xs">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-600/90 text-[10px] font-black uppercase tracking-wider shrink-0 animate-pulse">
          <Zap className="w-3.5 h-3.5" />
          <span>Live Ticker</span>
        </div>

        <div className="flex-1 overflow-hidden whitespace-nowrap text-12 font-medium text-slate-200">
          <motion.div
            animate={{ x: ['100%', '-100%'] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="inline-block"
          >
            {sseAlerts.join(' ••• ')}
          </motion.div>
        </div>
      </div>

      {/* 2. Regulatory Mandated Notice Banner */}
      <div className="p-3.5 rounded-xl bg-navy-50/80 dark:bg-navy-800/60 border-l-4 border-navy-700 dark:border-navy-500 flex items-center justify-between text-12 text-gov-muted">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-navy-700 dark:text-saffron-400 shrink-0" />
          <span>
            <strong className="text-navy-900 dark:text-slate-100">SCRUTINY ADVISORY NOTICE: </strong>
            AI extraction, duplicate detection, and tamper analysis are decision-support outputs. Approval recommendations require mandatory written official remarks.
          </span>
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="p-1 rounded text-gov-muted hover:text-navy-900 dark:hover:text-white transition-colors"
          title="Refresh dashboard data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 3. 6 Key Performance Metric Cards with Uniform Heights & Baseline Alignment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 min-[1440px]:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Pending */}
        <div className="h-[156px] p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs flex flex-col justify-between">
          <div className="text-12 font-bold uppercase tracking-[0.04em] text-gov-muted min-h-[2rem] flex items-start line-clamp-2">
            Pending
          </div>
          <div className="flex items-baseline">
            <span className="text-32 font-semibold text-navy-900 dark:text-white tabular-nums leading-none">
              {data?.kpis.pending_scrutiny || 6}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-navy-800">
            <span className="text-12 text-gov-muted truncate">In Active Queue</span>
            <svg width="48" height="18" className="overflow-visible shrink-0 opacity-80" aria-hidden="true">
              <polyline fill="none" stroke="#1F3A93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points="0,14 12,8 24,12 36,4 48,9" />
            </svg>
          </div>
        </div>

        {/* 2. High risk */}
        <div className="h-[156px] p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs flex flex-col justify-between">
          <div className="text-12 font-bold uppercase tracking-[0.04em] text-gov-muted min-h-[2rem] flex items-start line-clamp-2">
            High risk
          </div>
          <div className="flex items-baseline">
            <span className="text-32 font-semibold text-red-600 dark:text-red-400 tabular-nums leading-none">
              {data?.kpis.high_risk_applications || 3}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-navy-800">
            <span className="text-12 text-red-600 dark:text-red-400 font-semibold truncate">Priority Review</span>
            <svg width="48" height="18" className="overflow-visible shrink-0 opacity-80" aria-hidden="true">
              <polyline fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points="0,15 12,12 24,6 36,9 48,2" />
            </svg>
          </div>
        </div>

        {/* 3. SLA at risk */}
        <div className="h-[156px] p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs flex flex-col justify-between">
          <div className="text-12 font-bold uppercase tracking-[0.04em] text-gov-muted min-h-[2rem] flex items-start line-clamp-2">
            SLA at risk
          </div>
          <div className="flex items-baseline">
            <span className="text-32 font-semibold text-amber-500 tabular-nums leading-none">
              2
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-navy-800">
            <span className="text-12 text-amber-600 dark:text-amber-400 font-medium truncate">Breach in 72h</span>
            <svg width="48" height="18" className="overflow-visible shrink-0 opacity-80" aria-hidden="true">
              <polyline fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points="0,12 12,14 24,8 36,11 48,4" />
            </svg>
          </div>
        </div>

        {/* 4. Avg scrutiny time */}
        <div className="h-[156px] p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs flex flex-col justify-between">
          <div className="text-12 font-bold uppercase tracking-[0.04em] text-gov-muted min-h-[2rem] flex items-start line-clamp-2">
            Avg scrutiny time
          </div>
          <div className="flex items-baseline">
            <span className="text-32 font-semibold text-navy-900 dark:text-white tabular-nums leading-none">
              4.2
            </span>
            <span className="text-16 font-normal text-gov-muted ml-1">m</span>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-navy-800">
            <span className="text-12 text-green-600 dark:text-green-400 font-semibold truncate">-78% vs manual</span>
            <svg width="48" height="18" className="overflow-visible shrink-0 opacity-80" aria-hidden="true">
              <polyline fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points="0,4 12,6 24,10 36,12 48,16" />
            </svg>
          </div>
        </div>

        {/* 5. Source match rate */}
        <div className="h-[156px] p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs flex flex-col justify-between">
          <div className="text-12 font-bold uppercase tracking-[0.04em] text-gov-muted min-h-[2rem] flex items-start line-clamp-2">
            Source match rate
          </div>
          <div className="flex items-baseline">
            <span className="text-32 font-semibold text-green-600 dark:text-green-400 tabular-nums leading-none">
              96.4
            </span>
            <span className="text-18 font-normal text-gov-muted ml-0.5">%</span>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-navy-800">
            <span className="text-12 text-gov-muted truncate">DigiLocker / DTE</span>
            <svg width="48" height="18" className="overflow-visible shrink-0 opacity-80" aria-hidden="true">
              <polyline fill="none" stroke="#138808" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points="0,10 12,8 24,5 36,4 48,2" />
            </svg>
          </div>
        </div>

        {/* 6. Manual review */}
        <div className="h-[156px] p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs flex flex-col justify-between">
          <div className="text-12 font-bold uppercase tracking-[0.04em] text-gov-muted min-h-[2rem] flex items-start line-clamp-2">
            Manual review
          </div>
          <div className="flex items-baseline">
            <span className="text-32 font-semibold text-purple-600 dark:text-purple-400 tabular-nums leading-none">
              4
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-navy-800">
            <span className="text-12 text-gov-muted truncate">Evidence Review</span>
            <svg width="48" height="18" className="overflow-visible shrink-0 opacity-80" aria-hidden="true">
              <polyline fill="none" stroke="#9333EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points="0,12 12,14 24,9 36,11 48,6" />
            </svg>
          </div>
        </div>
      </div>

      {/* 4. India State-Wise Heatmap & Priority Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* India State Heatmap */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-15 font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-saffron-500" />
                  <span>State-Wise Scrutiny Heatmap</span>
                </h3>
                <p className="text-12 text-gov-muted">Distribution of pending files across jurisdictions</p>
              </div>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-gov-muted border border-slate-200 dark:border-navy-700">
                National Roster
              </span>
            </div>

            {/* Grid of State Tiles */}
            <div className="grid grid-cols-2 gap-2.5">
              {indiaStateHeatmap.map((item) => {
                const isSelected = selectedState === item.state;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setSelectedState(item.state)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      item.level === 'critical'
                        ? 'bg-red-50/70 dark:bg-red-950/40 border-red-200 dark:border-red-800/60'
                        : item.level === 'high'
                          ? 'bg-saffron-50/70 dark:bg-saffron-950/40 border-saffron-200 dark:border-saffron-800/60'
                          : 'bg-slate-50 dark:bg-navy-950/50 border-slate-200 dark:border-navy-800'
                    } ${isSelected ? 'ring-2 ring-navy-700 dark:ring-saffron-500' : ''}`}
                  >
                    <div>
                      <span className="text-13 font-bold text-navy-900 dark:text-white block">
                        {item.state}
                      </span>
                      <span className="text-[11px] text-gov-muted">
                        {item.pending} Pending
                      </span>
                    </div>

                    {item.highRisk > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
                        {item.highRisk} Flagged
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-11 text-gov-muted">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-200 dark:bg-navy-800" /> Low</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-saffron-400" /> Medium</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500" /> High / Critical</span>
          </div>
        </div>

        {/* Today's Priority Cases List */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-15 font-bold text-navy-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>Today's Priority Cases (Sorted by AI Risk Score)</span>
                </h3>
                <p className="text-12 text-gov-muted">Mandatory official review before committee cutoff</p>
              </div>
            </div>

            <div className="space-y-3">
              {data?.scrutiny_queue.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-navy-700/80 bg-slate-50/70 dark:bg-navy-950/40 hover:bg-white dark:hover:bg-navy-900 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-14 font-bold text-navy-900 dark:text-white">
                        {item.institute_name}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        item.risk_score > 60
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300'
                          : 'bg-green-100 text-green-700 dark:bg-green-950/80 dark:text-green-300'
                      }`}>
                        Risk: {item.risk_score}%
                      </span>
                    </div>
                    <div className="text-12 text-gov-muted flex items-center gap-2">
                      <span className="font-mono text-[13px] font-semibold text-slate-800 dark:text-slate-200">{item.application_no}</span>
                      <span>•</span>
                      <span>{item.state}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectApplication?.(item.id)}
                    className="px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-12 font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 shrink-0"
                  >
                    <span>Open Scrutiny Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-12 text-gov-muted">
            <span>Showing top regulatory priorities for Regional Director desk</span>
            <span className="font-semibold text-navy-700 dark:text-saffron-400">Total active: {data?.kpis.total_applications}</span>
          </div>
        </div>
      </div>

      {/* 5. Recharts Analytics Suite */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Intake vs Disposal (Area Chart) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-15 font-bold text-navy-900 dark:text-white">
                Daily Application Intake vs Disposal Efficiency
              </h3>
              <p className="text-12 text-gov-muted">Throughput velocity across this scrutiny cycle</p>
            </div>
            <button
              onClick={() => alert("Exporting chart as PNG image...")}
              className="text-11 font-semibold text-gov-muted hover:text-navy-900 dark:hover:text-white inline-flex items-center gap-1 border border-slate-200 dark:border-navy-700 px-2.5 py-1 rounded-lg"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export as image</span>
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyIntakeDisposal}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Area type="monotone" dataKey="intake" name="Files Received" stroke="#1F3A93" fill="#1F3A93" fillOpacity={0.2} />
                <Area type="monotone" dataKey="disposal" name="Official Disposals" stroke="#FF9933" fill="#FF9933" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Band Distribution (Donut Chart) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-15 font-bold text-navy-900 dark:text-white mb-1">
              Risk Band Distribution
            </h3>
            <p className="text-12 text-gov-muted mb-4">AI algorithmic composite classification</p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskBandDonut} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={4}>
                    {riskBandDonut.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 text-11 text-gov-muted">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-600" /> Fast-Track (Low):</span>
              <strong className="text-navy-900 dark:text-white">{data?.risk_distribution.LOW} files</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-saffron-500" /> Medium Deficiency:</span>
              <strong className="text-navy-900 dark:text-white">{data?.risk_distribution.MEDIUM} files</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600" /> High / Critical:</span>
              <strong className="text-navy-900 dark:text-white">{(data?.risk_distribution.HIGH || 0) + (data?.risk_distribution.CRITICAL || 0)} files</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Flags by Type & SLA Ageing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Flags by Type (Bar Chart) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-15 font-bold text-navy-900 dark:text-white">
                Deficiency Flags by Regulatory Domain
              </h3>
              <p className="text-12 text-gov-muted">Top areas of non-compliance detected by validation rules</p>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flagsByTypeData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1F3A93" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 6 Common Deficiencies (Horizontal Bar) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-15 font-bold text-navy-900 dark:text-white">
                Top Deficiency Reasons Triggered
              </h3>
              <p className="text-12 text-gov-muted">Ranked by frequency across western jurisdiction</p>
            </div>
            <button
              onClick={() => alert("Exporting deficiency reasons as PNG image...")}
              className="text-gov-muted hover:text-navy-900 dark:hover:text-white p-1 rounded hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
              title="Export as image"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10Deficiencies} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="reason" type="category" width={180} tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="occurrences" fill="#FF9933" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 7. SLA Ageing Stacked Bar Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-15 font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>SLA Ageing Analysis (Regional Breakdown)</span>
            </h3>
            <p className="text-12 text-gov-muted">Active scrutiny file ageing against citizen charter SLAs (&lt;3d, 4-7d, 8-14d, &gt;14d breached)</p>
          </div>
          <button
            onClick={() => alert("Exporting SLA Ageing chart as PNG image...")}
            className="text-11 font-semibold text-gov-muted hover:text-navy-900 dark:hover:text-white inline-flex items-center gap-1.5 border border-slate-200 dark:border-navy-700 px-2.5 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export as image</span>
          </button>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={slaAgeingStackedData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="region" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Bar dataKey="within3d" name="< 3 Days (Within SLA)" stackId="sla" fill="#138808" />
              <Bar dataKey="fourTo7d" name="4 - 7 Days (Attention)" stackId="sla" fill="#FF9933" />
              <Bar dataKey="eightTo14d" name="8 - 14 Days (Escalated)" stackId="sla" fill="#E65100" />
              <Bar dataKey="breached" name="> 14 Days (Breached SLA)" stackId="sla" fill="#C62828" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
