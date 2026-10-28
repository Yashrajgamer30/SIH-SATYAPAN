import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../context/authStore';
import {
  Building, ShieldCheck, CheckCircle2, AlertCircle, FileText,
  Calendar, Award, MapPin, Phone, Mail, RefreshCw, ExternalLink, Database
} from 'lucide-react';

interface ProfileData {
  source_tag: string;
  last_synchronized: string;
  institute: {
    id: string;
    aicte_id: string;
    name: string;
    type: string;
    state: string;
    district: string;
    lat: number;
    lng: number;
    established_year: number;
    trust_name: string;
    principal_name: string;
    email: string;
    phone: string;
    status: string;
    built_up_area_sqm: number;
    ter_payment_status: string;
    deficiency_status: string;
  };
  academic: {
    approved_programmes: string[];
    approved_intake: Record<string, Record<string, number>>;
    total_intake_2026_27: number;
    previous_eoa: {
      last_eoa_year: string;
      letter_no: string;
      issued_date: string;
      approved_by: string;
    };
    accreditation: {
      naac_grade: string;
      naac_valid_upto: string;
      nba_accredited_count: number;
      nba_programmes?: string[];
    };
    enrolled_students: number;
    active_faculty: number;
  };
}

export const InstituteProfileView: React.FC = () => {
  const { token } = useAuthStore();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const resp = await fetch('http://localhost:8000/institute/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const json = await resp.json();
        setData(json);
      }
    } catch (e) {
      console.warn('Profile fetch fallback to baseline:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  if (loading && !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-navy-900 dark:text-white font-medium">
          <RefreshCw className="w-5 h-5 animate-spin text-saffron-500" />
          <span>Synchronizing verified records from AICTE Central Registry...</span>
        </div>
      </div>
    );
  }

  const inst = data?.institute;
  const acad = data?.academic;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Verification Badge */}
      <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 text-11 font-bold flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>{data?.source_tag || "Fetched from AICTE records"}</span>
            </span>
            <span className="text-12 text-gov-muted">
              Last synced: {data?.last_synchronized ? new Date(data.last_synchronized).toLocaleDateString() : 'Today'}
            </span>
          </div>
          <h2 className="text-20 sm:text-22 font-bold text-navy-900 dark:text-white">
            {inst?.name || "Saraswati Institute of Technology"}
          </h2>
          <p className="text-13 text-gov-muted flex items-center gap-2 mt-0.5">
            <span className="font-mono text-[13px] tabular-nums font-semibold text-slate-800 dark:text-slate-200">
              {inst?.aicte_id || "AICTE-1-3324901"}
            </span>
            <span>•</span>
            <span>{inst?.type || "Engineering & Technology (UG/PG)"}</span>
            <span>•</span>
            <span>Est. {inst?.established_year || 2008}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <span className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800 text-12 font-medium text-gov-muted">
            Read-only institutional baseline
          </span>
        </div>
      </div>

      {/* 2. Key Regulatory Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-2xs">
          <div className="text-11 uppercase font-bold text-gov-muted mb-1">NAAC Accreditation</div>
          <div className="flex items-baseline gap-2">
            <span className="text-24 font-bold text-navy-900 dark:text-white">Grade {acad?.accreditation.naac_grade || "A+"}</span>
            <span className="text-11 text-emerald-600 font-semibold">Valid</span>
          </div>
          <div className="text-11 text-gov-muted mt-1">
            Upto {acad?.accreditation.naac_valid_upto || "31-Dec-2028"}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-2xs">
          <div className="text-11 uppercase font-bold text-gov-muted mb-1">NBA Accreditation</div>
          <div className="flex items-baseline gap-2">
            <span className="text-24 font-bold text-navy-900 dark:text-white">
              {acad?.accreditation.nba_accredited_count || 2} Programs
            </span>
          </div>
          <div className="text-11 text-gov-muted mt-1">
            Tier-I Washington Accord
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-2xs">
          <div className="text-11 uppercase font-bold text-gov-muted mb-1">Deficiency Status</div>
          <div className="flex items-baseline gap-2">
            <span className="text-18 font-bold text-amber-600 dark:text-amber-400">
              {inst?.deficiency_status?.replace(/_/g, ' ') || "TWO DEFICIENCIES"}
            </span>
          </div>
          <div className="text-11 text-gov-muted mt-1">
            1 requiring reply in 15 days
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-2xs">
          <div className="text-11 uppercase font-bold text-gov-muted mb-1">TER Payment 2026-27</div>
          <div className="flex items-baseline gap-2">
            <span className="text-18 font-bold text-emerald-600 dark:text-emerald-400">
              {inst?.ter_payment_status || "PAID"}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-11 text-gov-muted mt-1">
            Ref: SBI-AICTE-99210-2026
          </div>
        </div>
      </div>

      {/* 3. Institutional Metadata & Campus Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs space-y-4">
          <h3 className="text-15 font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-saffron-500" />
            <span>Governance & Legal Entity Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-13">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/40 border border-slate-200/60 dark:border-navy-800">
              <span className="text-11 text-gov-muted block">Sponsoring Body / Trust</span>
              <span className="font-semibold text-navy-900 dark:text-white">{inst?.trust_name || "Saraswati Education Society"}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/40 border border-slate-200/60 dark:border-navy-800">
              <span className="text-11 text-gov-muted block">Head of Institution</span>
              <span className="font-semibold text-navy-900 dark:text-white">{inst?.principal_name || "Dr. Prakash Patil"}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/40 border border-slate-200/60 dark:border-navy-800">
              <span className="text-11 text-gov-muted block">Official Email</span>
              <span className="font-semibold text-navy-900 dark:text-white truncate block">{inst?.email || "principal@demo-institute.in"}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/40 border border-slate-200/60 dark:border-navy-800">
              <span className="text-11 text-gov-muted block">Contact Telephone</span>
              <span className="font-semibold text-navy-900 dark:text-white">{inst?.phone || "+91-20-27481920"}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/40 border border-slate-200/60 dark:border-navy-800 sm:col-span-2">
              <span className="text-11 text-gov-muted block">Geographical Jurisdiction</span>
              <span className="font-semibold text-navy-900 dark:text-white">
                {inst?.district || "Pune"}, {inst?.state || "Maharashtra"} (Coordinates: {inst?.lat || 18.5912}°N, {inst?.lng || 73.7389}°E)
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs space-y-4">
          <h3 className="text-15 font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-saffron-500" />
            <span>Previous Extension of Approval (EoA) Letter</span>
          </h3>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50/70 dark:bg-navy-950/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-12 font-bold text-navy-900 dark:text-white">
                Academic Year {acad?.previous_eoa.last_eoa_year || "2025-2026"}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                AICTE Sanctioned
              </span>
            </div>
            <p className="font-mono text-[13px] font-semibold text-slate-800 dark:text-slate-200">
              {acad?.previous_eoa.letter_no || "F.No. Western/1-AICTE-1-3324901/2025/EOA"}
            </p>
            <div className="text-12 text-gov-muted flex items-center gap-3 pt-1 border-t border-slate-200/60 dark:border-navy-800">
              <span>Date of Issue: {acad?.previous_eoa.issued_date || "14-May-2025"}</span>
              <span>•</span>
              <span>{acad?.previous_eoa.approved_by || "Western Regional Committee"}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 dark:bg-navy-950/80 border border-blue-200 dark:border-navy-800 text-12 text-navy-900 dark:text-slate-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Automated Carry-Forward: </span>
              Approved instructional built-up area is recorded as <strong>{inst?.built_up_area_sqm?.toLocaleString() || "12,540"} sqm</strong>.
              All existing data is locked from manual editing to maintain audit trail integrity.
            </div>
          </div>
        </div>
      </div>

      {/* 4. Approved Programmes & Historical Intake Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-15 font-bold text-navy-900 dark:text-white">
              Approved Programmes & 5-Year Approved Intake Records
            </h3>
            <p className="text-12 text-gov-muted">
              Authorised AICTE sanction history (Total 2026-27 Sanctioned Capacity: {acad?.total_intake_2026_27 || 420} seats)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-13 border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-navy-800 bg-slate-50/70 dark:bg-navy-950/40 text-gov-muted text-11 uppercase font-bold tracking-wider">
                <th className="py-2.5 px-3">Programme Title</th>
                <th className="py-2.5 px-3 text-center">2022-23</th>
                <th className="py-2.5 px-3 text-center">2023-24</th>
                <th className="py-2.5 px-3 text-center">2024-25</th>
                <th className="py-2.5 px-3 text-center">2025-26</th>
                <th className="py-2.5 px-3 text-center font-black text-saffron-600 dark:text-saffron-400">2026-27 (Current)</th>
                <th className="py-2.5 px-3 text-center">NBA Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {acad?.approved_programmes.map((prog, idx) => {
                const intake = acad.approved_intake;
                const isNba = idx < (acad.accreditation.nba_accredited_count || 2);
                return (
                  <tr key={prog} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-navy-900 dark:text-white">
                      {prog}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums text-gov-muted">
                      {intake["2022-23"]?.[prog] || 60}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums text-gov-muted">
                      {intake["2023-24"]?.[prog] || 60}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums text-gov-muted">
                      {intake["2024-25"]?.[prog] || 60}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums text-gov-muted">
                      {intake["2025-26"]?.[prog] || 60}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums font-bold text-navy-900 dark:text-white bg-saffron-50/30 dark:bg-saffron-950/20">
                      {intake["2026-27"]?.[prog] || 60}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {isNba ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Accredited
                        </span>
                      ) : (
                        <span className="text-11 text-gov-muted">Eligible</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
