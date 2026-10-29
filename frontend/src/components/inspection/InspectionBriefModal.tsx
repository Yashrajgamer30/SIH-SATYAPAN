import React, { useRef } from 'react';
import {
  FileText,
  Printer,
  X,
  AlertTriangle,
  CheckSquare,
  Building,
  QrCode,
  ShieldAlert,
  Calendar,
  Download
} from 'lucide-react';

interface InspectionBriefModalProps {
  appId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const InspectionBriefModal: React.FC<InspectionBriefModalProps> = ({
  appId,
  isOpen,
  onClose
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="flex items-center justify-between p-4 bg-slate-100 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-sm text-slate-900">
              Statutory Physical Inspection Committee Brief
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div ref={printRef} className="p-8 overflow-y-auto space-y-6 text-xs font-sans leading-relaxed">
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div>
              <div className="text-[10px] tracking-wider uppercase font-bold text-slate-500">
                Government of India • Ministry of Education
              </div>
              <h1 className="text-base font-black text-slate-900 tracking-tight">
                ALL INDIA COUNCIL FOR TECHNICAL EDUCATION (AICTE)
              </h1>
              <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
                Statutory Physical Scrutiny Committee Brief • Western Regional Office
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold border border-rose-300">
                CONFIDENTIAL • INSPECTOR EYES ONLY
              </span>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Generated: {new Date().toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>

          {/* Dossier & Institute Meta */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 block text-[10px]">APPLICATION NUMBER:</span>
              <span className="font-bold text-slate-900">AICTE/EOA/2026/MH-PUN-402</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">AICTE PERMANENT ID:</span>
              <span className="font-bold text-slate-900">1-29849201 (Established 2008)</span>
            </div>
            <div className="col-span-2 pt-1 border-t border-slate-200">
              <span className="text-slate-500 block text-[10px]">INSTITUTE NAME & CAMPUS:</span>
              <span className="font-bold text-slate-900">
                Government College of Engineering & Research, Awasari (Pune District, Maharashtra)
              </span>
            </div>
          </div>

          {/* Pre-Screening Forensic Findings Summary */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-rose-800 flex items-center gap-1.5 border-b pb-1">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              1. Key Forensic Deficiencies Flagged by SATYAPAN Pre-Check
            </h4>

            <div className="space-y-2">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <div className="flex justify-between font-bold text-rose-900 text-[11px]">
                  <span>Finding 1: Fire NOC Contradiction & Reused Seal Signature</span>
                  <span className="font-mono text-rose-700">SEVERITY: CRITICAL</span>
                </div>
                <p className="text-slate-700 text-[11px] mt-1">
                  Document text overlay references expiry date 31-12-2026, but State Fire Services issuing serial lookup confirms certificate expired on 31-12-2024. Blue seal Hough transform contour matches another institute submission in Pune.
                </p>
                <div className="mt-2 text-[10px] font-semibold text-rose-800 bg-rose-100 p-1.5 rounded">
                  Mandatory Action: Demand physical inspection of original stamped folio from Pune Municipal Fire Brigade.
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex justify-between font-bold text-amber-900 text-[11px]">
                  <span>Finding 2: Central Digital Library Carpet Area Deficit</span>
                  <span className="font-mono text-amber-700">SEVERITY: HIGH</span>
                </div>
                <p className="text-slate-700 text-[11px] mt-1">
                  Submitted CAD floor plan measures 142 sqm total carpet area versus 200 sqm statutory requirement in AICTE Approval Process Handbook (Chapter 4).
                </p>
                <div className="mt-2 text-[10px] font-semibold text-amber-800 bg-amber-100 p-1.5 rounded">
                  Mandatory Action: Inspector must use digital laser distance meter to physically verify Stack Room and Reading Hall dimensions.
                </div>
              </div>
            </div>
          </div>

          {/* On-Site Verification Checklist */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b pb-1">
              <CheckSquare className="w-4 h-4 text-blue-600" />
              2. Mandatory On-Site Inspector Checklist & Spot Verification
            </h4>

            <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-2 w-12">Verify</th>
                  <th className="border border-slate-300 p-2">Statutory Item to Inspect</th>
                  <th className="border border-slate-300 p-2 w-32">Statutory Norm</th>
                  <th className="border border-slate-300 p-2 w-36">Physical Observation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2 text-center">[  ]</td>
                  <td className="border border-slate-300 p-2 font-medium">Original Title Deed / Non-Encumbrance 7/12 Extract</td>
                  <td className="border border-slate-300 p-2">&gt;= 2.50 Acres contiguous</td>
                  <td className="border border-slate-300 p-2">__________________</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 text-center">[  ]</td>
                  <td className="border border-slate-300 p-2 font-medium">Fire Exit Stairwell Clear Egress Width</td>
                  <td className="border border-slate-300 p-2">&gt;= 1.50 meters clear</td>
                  <td className="border border-slate-300 p-2">__________________</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 text-center">[  ]</td>
                  <td className="border border-slate-300 p-2 font-medium">Core Computing Terminal Count & Gigabit Switches</td>
                  <td className="border border-slate-300 p-2">60 Working PCs</td>
                  <td className="border border-slate-300 p-2">__________________</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 text-center">[  ]</td>
                  <td className="border border-slate-300 p-2 font-medium">Faculty Biometric Attendance & Physical Verification</td>
                  <td className="border border-slate-300 p-2">SFR &lt;= 1:20 Cadre Norm</td>
                  <td className="border border-slate-300 p-2">__________________</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatures & Verification QR */}
          <div className="pt-6 border-t-2 border-slate-900 flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-bold text-slate-800">Scrutiny Officer: Shri R. Verma</p>
              <p className="text-[10px] text-slate-500">Western Regional Scrutiny Cell, AICTE</p>
              <div className="h-10 w-36 border-b border-dashed border-slate-400 mt-2 flex items-end text-[9px] text-slate-400">
                Official Signature & Seal
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="w-14 h-14 bg-white border border-slate-300 flex items-center justify-center">
                <QrCode className="w-10 h-10 text-slate-800" />
              </div>
              <div className="text-[9px] text-slate-500 font-mono leading-tight">
                <strong className="block text-slate-900 font-bold">DIGITAL AUDIT STAMP</strong>
                <span>HASH: c7f940...a981</span>
                <span className="block mt-0.5">Scan to verify live status</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

