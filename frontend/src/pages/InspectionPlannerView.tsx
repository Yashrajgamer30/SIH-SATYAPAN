import { API_BASE } from '../config/api';
import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  AlertTriangle,
  FileText,
  Download,
  Printer,
  ChevronRight,
  Building,
  Users,
  CheckCircle2,
  Filter,
  Navigation
} from 'lucide-react';
import { InspectionBriefModal } from '../components/inspection/InspectionBriefModal';

interface InspectionItem {
  id: string;
  application_id: string;
  application_no: string;
  institute_id: string;
  institute_name: string;
  district: string;
  state: string;
  geo_coordinates: string;
  recommended_priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  risk_score: number;
  recommended_inspectors: number;
  reasons: string[];
  mandatory_on_site_checks: string[];
  proposed_window: string;
}

export const InspectionPlannerView: React.FC = () => {
  const [inspections, setInspections] = useState<InspectionItem[]>([]);
  const [groupedByDistrict, setGroupedByDistrict] = useState<Record<string, InspectionItem[]>>({});
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedBriefAppId, setSelectedBriefAppId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlannerData();
  }, []);

  const fetchPlannerData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/official/inspection-planner`);
      if (!res.ok) throw new Error('Failed to load planner data');
      const data = await res.json();
      setInspections(data.inspections || []);
      setGroupedByDistrict(data.grouped_by_district || {});
    } catch (e) {
      console.error('Failed to load inspection planner data:', e);
      // Fallback demo data
      const demoList: InspectionItem[] = [
        {
          id: 'INSP-2026-PUN-01',
          application_id: '1',
          application_no: 'AICTE/EOA/2026/MH-PUN-402',
          institute_id: 'inst-1',
          institute_name: 'Government College of Engineering & Research',
          district: 'Pune',
          state: 'Maharashtra',
          geo_coordinates: '18.5204° N, 73.8567° E',
          recommended_priority: 'CRITICAL',
          risk_score: 78.5,
          recommended_inspectors: 2,
          reasons: [
            'Fire NOC seal contour mismatch with State Fire Services master register',
            'Digital library carpet area deficit (142 sqm vs 200 sqm norm)',
            'Possible concurrent faculty appointment order with Nashik campus'
          ],
          mandatory_on_site_checks: [
            'Inspect physical Fire NOC original certificate with hologram',
            'Measure carpet area of Central Digital Library Stack Room',
            'Verify biometric attendance logs of Dr. Ramesh Gupta'
          ],
          proposed_window: '05-Nov to 08-Nov 2026'
        },
        {
          id: 'INSP-2026-PUN-02',
          application_id: '2',
          application_no: 'AICTE/EOA/2026/MH-PUN-204',
          institute_id: 'inst-2',
          institute_name: 'Pune Institute of Technology & Management',
          district: 'Pune',
          state: 'Maharashtra',
          geo_coordinates: '18.5320° N, 73.8420° E',
          recommended_priority: 'HIGH',
          risk_score: 64.0,
          recommended_inspectors: 2,
          reasons: [
            'Student Hostel Dining and emergency egress width requires on-site scrutiny',
            'Mechanical workshop machine clearance safety gangways pending verification'
          ],
          mandatory_on_site_checks: [
            'Inspect hostel wing A fire escape door dimensions',
            'Verify machine grounding certificates in electrical lab'
          ],
          proposed_window: '08-Nov to 10-Nov 2026'
        },
        {
          id: 'INSP-2026-NSK-01',
          application_id: '3',
          application_no: 'AICTE/EOA/2026/MH-NSK-301',
          institute_id: 'inst-nsk-301',
          institute_name: 'Nashik Technical Polytechnic Institute',
          district: 'Nashik',
          state: 'Maharashtra',
          geo_coordinates: '19.9975° N, 73.7898° E',
          recommended_priority: 'MEDIUM',
          risk_score: 45.0,
          recommended_inspectors: 1,
          reasons: [
            'Computer laboratory terminal invoice date verification with supplier'
          ],
          mandatory_on_site_checks: [
            'Spot count 60 working desktop terminals in Lab 2'
          ],
          proposed_window: '12-Nov to 14-Nov 2026'
        }
      ];

      setInspections(demoList);
      setGroupedByDistrict({
        Pune: [demoList[0], demoList[1]],
        Nashik: [demoList[2]]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = 'Inspection ID,Application No,Institute,District,State,Priority,Risk Score,Window\n';
    const rows = inspections
      .map(
        (i) =>
          `"${i.id}","${i.application_no}","${i.institute_name}","${i.district}","${i.state}","${i.recommended_priority}","${i.risk_score}","${i.proposed_window}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AICTE_Inspection_Roster_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayedInspections =
    selectedDistrict === 'ALL'
      ? inspections
      : inspections.filter((i) => i.district === selectedDistrict);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Risk-Based Inspection Travel Planner
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-full border border-amber-300 dark:border-amber-700">
              Western Region
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Prioritizes physical scrutiny committee itineraries based on algorithmic risk scores, cluster proximity, and pending on-site checks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Roster (CSV)
          </button>
        </div>
      </div>

      {/* District Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 flex items-center gap-1 text-[11px] font-semibold">
          <Filter className="w-3.5 h-3.5" /> Filter District:
        </span>
        <button
          onClick={() => setSelectedDistrict('ALL')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedDistrict === 'ALL'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          All Districts ({inspections.length})
        </button>
        {Object.keys(groupedByDistrict).map((district) => (
          <button
            key={district}
            onClick={() => setSelectedDistrict(district)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedDistrict === district
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {district} ({groupedByDistrict[district].length})
          </button>
        ))}
      </div>

      {/* Itinerary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedInspections.map((insp) => (
          <div
            key={insp.id}
            className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {insp.id} • {insp.district}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 line-clamp-1">
                    {insp.institute_name}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500">{insp.application_no}</p>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    insp.recommended_priority === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : insp.recommended_priority === 'HIGH'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  }`}
                >
                  {insp.recommended_priority}
                </span>
              </div>

              {/* Coordinates and window */}
              <div className="flex items-center justify-between text-[11px] p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  {insp.geo_coordinates}
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-purple-500" />
                  {insp.proposed_window}
                </span>
              </div>

              {/* Top risk trigger reasons */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Inspection Triggers ({insp.reasons.length})
                </span>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {insp.reasons.slice(0, 2).map((r, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mandatory on-site checks preview */}
              <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Mandatory Spot Checks
                </span>
                <p className="text-[11px] text-slate-700 dark:text-slate-300">
                  • {insp.mandatory_on_site_checks[0]}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {insp.recommended_inspectors} Inspectors Req.
              </span>

              <button
                onClick={() => setSelectedBriefAppId(insp.application_id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" /> Inspection Brief
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Printable Inspection Brief Modal */}
      {selectedBriefAppId && (
        <InspectionBriefModal
          appId={selectedBriefAppId}
          isOpen={true}
          onClose={() => setSelectedBriefAppId(null)}
        />
      )}
    </div>
  );
};
