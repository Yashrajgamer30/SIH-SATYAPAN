import React, { useState, useRef } from 'react';
import { useAuthStore } from '../../context/authStore';
import {
  Upload, FileSpreadsheet, AlertTriangle, CheckCircle2,
  X, Download, RefreshCw, FileText, Check, AlertOctagon
} from 'lucide-react';

interface RowError {
  row: number;
  column: string;
  value: string;
  error: string;
}

interface PreviewRecord {
  row: number;
  enrolment_no: string;
  name: string;
  programme: string;
  year: number | string;
  status: 'VALID' | 'INVALID';
}

interface ImportSummary {
  total_rows_evaluated: number;
  valid_rows_count: number;
  error_rows_count: number;
  imported_count: number;
  import_mode: string;
  errors: RowError[];
  preview_records: PreviewRecord[];
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { token } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importValidOnly, setImportValidOnly] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    window.open('http://localhost:8000/institute/students/template', '_blank');
  };

  const handleFileChange = (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setUploadError('Please select a valid Excel (.xlsx, .xls) or CSV file.');
      return;
    }
    setSelectedFile(file);
    setUploadError(null);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const resp = await fetch(
        `http://localhost:8000/institute/students/bulk-import?import_valid_only=${importValidOnly}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || 'Failed to process import sheet');
      }

      const json: ImportSummary = await resp.json();
      setResult(json);
      if (json.imported_count > 0) {
        onSuccess();
      }
    } catch (e: any) {
      setUploadError(e.message || 'Error occurred while uploading and parsing file.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadErrorReport = () => {
    if (!result || result.errors.length === 0) return;

    const headers = ['Row Number', 'Column Name', 'Invalid Value', 'Error Description'];
    const rows = result.errors.map(e => [
      e.row,
      `"${e.column}"`,
      `"${e.value.replace(/"/g, '""')}"`,
      `"${e.error.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Import_Errors_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl bg-white dark:bg-navy-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-navy-700 overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-saffron-50 dark:bg-navy-800 text-saffron-500 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-16 font-bold text-navy-950 dark:text-white">
                Bulk Import Student Records
              </h3>
              <p className="text-12 text-gov-muted">
                Standardised AICTE Excel (.xlsx) / CSV format with row-level validation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-gov-text font-semibold text-12 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-saffron-500" />
              <span>Download Template</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gov-muted hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* 1. Drag & Drop Upload Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-saffron-500 bg-saffron-50/50 dark:bg-navy-800/80'
                : selectedFile
                ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20'
                : 'border-slate-200 dark:border-navy-700 hover:border-saffron-400 dark:hover:border-navy-600 bg-slate-50/50 dark:bg-navy-800/30'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            {selectedFile ? (
              <div className="flex flex-col items-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                <p className="font-bold text-navy-950 dark:text-white text-14">
                  {selectedFile.name}
                </p>
                <p className="text-12 text-gov-muted mt-0.5">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Click or drop to replace
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-10 h-10 text-gov-muted mb-2 animate-bounce" />
                <p className="font-bold text-navy-950 dark:text-white text-14">
                  Drag and drop Excel or CSV spreadsheet here
                </p>
                <p className="text-12 text-gov-muted mt-1">
                  or click to browse from your device
                </p>
              </div>
            )}
          </div>

          {/* Option: Import valid rows only */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200 dark:border-navy-700 flex items-center justify-between">
            <div>
              <div className="text-13 font-bold text-navy-950 dark:text-white">
                'Import Valid Rows Only' Mode
              </div>
              <div className="text-11 text-gov-muted">
                If checked, rows without errors will be saved immediately, while erroneous rows are reported.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={importValidOnly}
                onChange={(e) => setImportValidOnly(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-navy-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-saffron-500"></div>
            </label>
          </div>

          {uploadError && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-12 font-medium flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* 2. Upload / Parse Trigger */}
          <div className="flex justify-end">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="px-5 py-2.5 rounded-xl bg-saffron-500 hover:bg-saffron-600 disabled:opacity-40 text-white font-bold text-13 shadow-sm flex items-center gap-2 transition-all"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Parsing & Validating Rows...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Validate and Import File</span>
                </>
              )}
            </button>
          </div>

          {/* 3. Evaluation Result & Row-Level Error Report */}
          {result && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-navy-800">
              {/* Summary KPIs */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700">
                  <div className="text-11 text-gov-muted uppercase font-bold">Evaluated</div>
                  <div className="text-18 font-bold text-navy-950 dark:text-white mt-0.5">
                    {result.total_rows_evaluated}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50">
                  <div className="text-11 text-emerald-700 dark:text-emerald-300 uppercase font-bold">Valid Rows</div>
                  <div className="text-18 font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {result.valid_rows_count}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50">
                  <div className="text-11 text-red-700 dark:text-red-300 uppercase font-bold">Failed Rows</div>
                  <div className="text-18 font-bold text-red-600 dark:text-red-400 mt-0.5">
                    {result.error_rows_count}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50">
                  <div className="text-11 text-blue-700 dark:text-blue-300 uppercase font-bold">Imported</div>
                  <div className="text-18 font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                    {result.imported_count}
                  </div>
                </div>
              </div>

              {/* Row-Level Errors Table */}
              {result.errors.length > 0 ? (
                <div className="rounded-xl border border-red-200 dark:border-red-900/50 overflow-hidden">
                  <div className="p-3 bg-red-50 dark:bg-red-950/50 border-b border-red-200 dark:border-red-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-800 dark:text-red-200 font-bold text-13">
                      <AlertOctagon className="w-4 h-4 text-red-600" />
                      <span>Row-Level Errors Detected ({result.errors.length} issues)</span>
                    </div>
                    <button
                      onClick={handleDownloadErrorReport}
                      className="px-3 py-1 rounded-lg bg-white dark:bg-navy-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-11 font-bold hover:bg-red-50 transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Error File</span>
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-12">
                      <thead className="bg-slate-50 dark:bg-navy-800/80 sticky top-0 text-gov-muted font-bold uppercase">
                        <tr>
                          <th className="py-2 px-3">Row #</th>
                          <th className="py-2 px-3">Column</th>
                          <th className="py-2 px-3">Encountered Value</th>
                          <th className="py-2 px-3">Error Message</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                        {result.errors.map((err, idx) => (
                          <tr key={idx} className="hover:bg-red-50/30 dark:hover:bg-red-950/20">
                            <td className="py-2 px-3 font-mono font-bold text-red-600">
                              Row {err.row}
                            </td>
                            <td className="py-2 px-3 font-mono text-navy-900 dark:text-white">
                              {err.column}
                            </td>
                            <td className="py-2 px-3 font-mono text-gov-muted truncate max-w-[120px]">
                              {err.value || '<empty>'}
                            </td>
                            <td className="py-2 px-3 text-red-600 dark:text-red-400 font-medium">
                              {err.error}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-13 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>All {result.valid_rows_count} rows passed regulatory validations with zero errors!</span>
                </div>
              )}

              {/* Preview Table */}
              {result.preview_records && result.preview_records.length > 0 && (
                <div>
                  <h4 className="text-12 font-bold uppercase tracking-wider text-gov-muted mb-2">
                    Sheet Preview (First 10 Rows)
                  </h4>
                  <div className="rounded-xl border border-slate-200 dark:border-navy-700 overflow-x-auto text-12">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 dark:bg-navy-800 text-gov-muted font-bold uppercase">
                        <tr>
                          <th className="py-2 px-3">Row</th>
                          <th className="py-2 px-3">Enrolment No</th>
                          <th className="py-2 px-3">Student Name</th>
                          <th className="py-2 px-3">Programme</th>
                          <th className="py-2 px-3">Year</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                        {result.preview_records.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/30">
                            <td className="py-1.5 px-3 font-mono">{r.row}</td>
                            <td className="py-1.5 px-3 font-mono font-bold text-navy-950 dark:text-white">{r.enrolment_no}</td>
                            <td className="py-1.5 px-3">{r.name}</td>
                            <td className="py-1.5 px-3 text-gov-muted">{r.programme}</td>
                            <td className="py-1.5 px-3">{r.year}</td>
                            <td className="py-1.5 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-10 font-bold ${
                                r.status === 'VALID'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              }`}>
                                {r.status}
                              </span>
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

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-navy-800 flex items-center justify-end gap-2.5 bg-slate-50/60 dark:bg-navy-800/40">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-13 font-bold transition-colors"
          >
            {result?.imported_count ? 'Done' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
