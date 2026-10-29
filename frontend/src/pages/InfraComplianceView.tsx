import React, { useState, useEffect } from 'react';
import {
  Building2, Image as ImageIcon, Video, FileText, CheckCircle2,
  AlertTriangle, Eye, ShieldAlert, Check, X, Filter, RefreshCw, ZoomIn
} from 'lucide-react';
import { AdvisoryBanner } from '../components/StatusBadges';

const API_BASE = 'http://localhost:8000';

interface GalleryItem {
  id: string;
  type: 'FLOOR_PLAN' | 'PHOTO' | 'VIDEO_CLIP';
  title: string;
  url: string;
  label: string;
  quality_flag: 'EXCELLENT' | 'ACCEPTABLE' | 'LOW_LIGHT';
  resolution: string;
  geo_coordinates: string;
  timestamp: string;
}

interface ChecklistItem {
  id: string;
  category: string;
  requirement: string;
  required_sqm: number;
  measured_sqm: number;
  status: 'MEETS' | 'NEEDS_MORE_EVIDENCE' | 'RECOMMEND_INSPECTION';
  evidence_match: string;
  notes: string;
}

interface InfraData {
  gallery: GalleryItem[];
  checklist: ChecklistItem[];
  overall_summary: {
    total_items: number;
    meets_count: number;
    needs_evidence_count: number;
    recommend_inspection_count: number;
    compliance_percentage: number;
  };
}

export const InfraComplianceView: React.FC = () => {
  const [data, setData] = useState<InfraData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<GalleryItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const fetchInfraData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/official/infra-compliance`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: InfraData = await res.json();
      setData(json);
    } catch (err) {
      setError(`Failed to load infrastructure compliance data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfraData();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 space-y-2">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
        <p>Analyzing architectural CAD layouts and geo-tagged infrastructure evidence...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-xs text-rose-600 space-y-3">
        <AlertTriangle className="w-6 h-6 mx-auto text-rose-500" />
        <p>{error || 'Infrastructure data could not be loaded.'}</p>
        <button onClick={fetchInfraData} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold">
          Retry
        </button>
      </div>
    );
  }

  const { gallery, checklist, overall_summary } = data;

  const filteredChecklist = selectedCategory === 'ALL'
    ? checklist
    : checklist.filter(c => c.category === selectedCategory);

  return (
    <div className="space-y-4">
      {/* Principle 1 Advisory Banner */}
      <AdvisoryBanner />

      {/* Header bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Infrastructure Norms &amp; Multi-Modal Evidence Compliance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated verification comparing architectural CAD master floor plans, geo-tagged photos, and walkthrough videos against AICTE APH Chapter 4 norms.
          </p>
        </div>

        <button
          onClick={fetchInfraData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Compliance Index</span>
          <div className="text-22 font-mono font-bold text-slate-900 mt-0.5">
            {overall_summary.compliance_percentage}%
          </div>
          <span className="text-[11px] text-slate-500">{overall_summary.meets_count} of {overall_summary.total_items} Norms Met</span>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase">Meets Statutory Norm</span>
          <div className="text-22 font-mono font-bold text-emerald-700 mt-0.5">
            {overall_summary.meets_count}
          </div>
          <span className="text-[11px] text-slate-500">Fully Compliant Areas</span>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase">Needs Evidence</span>
          <div className="text-22 font-mono font-bold text-amber-700 mt-0.5">
            {overall_summary.needs_evidence_count}
          </div>
          <span className="text-[11px] text-slate-500">Missing Stack Plan / CAD</span>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-rose-600 uppercase">Recommend Inspection</span>
          <div className="text-22 font-mono font-bold text-rose-700 mt-0.5">
            {overall_summary.recommend_inspection_count}
          </div>
          <span className="text-[11px] text-slate-500">On-Site Visit Advised</span>
        </div>
      </div>

      {/* SECTION 1: Multi-Modal Evidence Gallery */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-blue-600" />
            Geo-Tagged Infrastructure Evidence Gallery ({gallery.length} Verified Media Files)
          </h2>
          <span className="text-xs text-slate-500">All media timestamped &amp; geo-anchored</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {gallery.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedGalleryItem(item)}
              className="group border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between space-y-2"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    item.type === 'FLOOR_PLAN'
                      ? 'bg-blue-100 text-blue-800'
                      : item.type === 'VIDEO_CLIP'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {item.type.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                    item.quality_flag === 'EXCELLENT'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {item.quality_flag}
                  </span>
                </div>

                <div className="h-24 bg-slate-200 rounded flex items-center justify-center relative overflow-hidden group-hover:shadow-xs transition-shadow">
                  {item.type === 'FLOOR_PLAN' && <FileText className="w-8 h-8 text-slate-500" />}
                  {item.type === 'VIDEO_CLIP' && <Video className="w-8 h-8 text-purple-600" />}
                  {item.type === 'PHOTO' && <ImageIcon className="w-8 h-8 text-emerald-600" />}
                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1 rounded font-mono">
                    {item.resolution}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mt-1" title={item.title}>
                  {item.title}
                </h4>
                <p className="text-[10px] text-slate-500 line-clamp-1">{item.label}</p>
              </div>

              <div className="pt-1.5 border-t border-slate-200/80 text-[9px] font-mono text-slate-400 flex items-center justify-between">
                <span>{item.geo_coordinates}</span>
                <span className="text-blue-600 font-bold group-hover:underline">View</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Side-by-Side Requirement vs Evidence Checklist */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Statutory Requirement Checklist (Side-by-Side Evidence Verification)
            </h2>
            <p className="text-xs text-slate-500">
              Every facility verified against AICTE APH Chapter 4 instructional carpet area requirements.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-semibold mr-1">Filter Area:</span>
            {['ALL', 'INSTRUCTIONAL_AREA', 'LABORATORY_AREA', 'LIBRARY_AREA', 'WORKSHOP_AREA', 'HOSTEL_AMENITY'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'All' : cat.replace(/_AREA|_AMENITY/g, '')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                <th className="py-2 px-3">Facility Norm</th>
                <th className="py-2 px-3">Statutory Requirement</th>
                <th className="py-2 px-3">Measured from Evidence</th>
                <th className="py-2 px-3">Determination</th>
                <th className="py-2 px-3">Corroborating Evidence File</th>
                <th className="py-2 px-3">Official Scrutiny Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredChecklist.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900 block">{item.requirement}</span>
                    <span className="text-[10px] font-mono text-slate-400">{item.category}</span>
                  </td>

                  <td className="py-3 px-3 font-mono text-[12px] text-slate-700 tabular-nums">
                    {item.required_sqm.toFixed(1)} sqm
                  </td>

                  <td className="py-3 px-3 font-mono text-[12px] font-bold tabular-nums">
                    <span className={item.measured_sqm >= item.required_sqm ? 'text-emerald-700' : 'text-rose-700'}>
                      {item.measured_sqm.toFixed(1)} sqm
                    </span>
                    {item.measured_sqm < item.required_sqm && (
                      <span className="text-[10px] text-rose-600 block">
                        (-{(item.required_sqm - item.measured_sqm).toFixed(1)} sqm deficit)
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    {item.status === 'MEETS' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> MEETS
                      </span>
                    )}
                    {item.status === 'NEEDS_MORE_EVIDENCE' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        <AlertTriangle className="w-3 h-3" /> NEEDS EVIDENCE
                      </span>
                    )}
                    {item.status === 'RECOMMEND_INSPECTION' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                        <ShieldAlert className="w-3 h-3" /> RECOMMEND INSPECTION
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-slate-700 text-[11px]">
                    {item.evidence_match}
                  </td>

                  <td className="py-3 px-3 text-slate-600 text-[11px] max-w-[240px]">
                    {item.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Media Inspection Modal */}
      {selectedGalleryItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-5 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">
                {selectedGalleryItem.title}
              </h3>
              <button
                onClick={() => setSelectedGalleryItem(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="h-64 bg-slate-900 rounded-lg flex flex-col items-center justify-center text-white space-y-2 p-4">
              {selectedGalleryItem.type === 'FLOOR_PLAN' && <FileText className="w-12 h-12 text-blue-400" />}
              {selectedGalleryItem.type === 'VIDEO_CLIP' && <Video className="w-12 h-12 text-purple-400" />}
              {selectedGalleryItem.type === 'PHOTO' && <ImageIcon className="w-12 h-12 text-emerald-400" />}
              <span className="text-xs font-semibold text-slate-300">{selectedGalleryItem.label}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {selectedGalleryItem.resolution} • {selectedGalleryItem.quality_flag} Quality
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs p-3 bg-slate-50 rounded border border-slate-200 font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">GEO-COORDINATES:</span>
                <span className="text-slate-900 font-bold">{selectedGalleryItem.geo_coordinates}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">VERIFIED TIMESTAMP:</span>
                <span className="text-slate-900 font-bold">{new Date(selectedGalleryItem.timestamp).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedGalleryItem(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
