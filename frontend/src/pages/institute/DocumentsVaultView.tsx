import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../context/authStore';
import {
  FolderLock, Calendar, Clock, AlertTriangle, CheckCircle2,
  Filter, Search, FileText, Download, History, RefreshCw,
  Bell, ChevronRight, Eye
} from 'lucide-react';

interface VaultDoc {
  id: string;
  name: string;
  type: string;
  category: string;
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
  expiry_date: string;
  days_until_expiry: number;
  reminder_level: string;
  version: number;
  size_kb: number;
  uploaded_at: string;
  history: Array<{
    version: number;
    filename: string;
    uploaded_at: string;
  }>;
}

export const DocumentsVaultView: React.FC = () => {
  const { token } = useAuthStore();
  const [documents, setDocuments] = useState<VaultDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [selectedDocHistory, setSelectedDocHistory] = useState<VaultDoc | null>(null);

  const fetchVault = async () => {
    setLoading(true);
    try {
      const resp = await fetch('http://localhost:8000/institute/vault', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const json = await resp.json();
        setDocuments(json.documents);
      }
    } catch (e) {
      console.warn('Failed to fetch document vault:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVault();
  }, [token]);

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase()) || doc.type.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCategory === 'ALL' || doc.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  const categories = Array.from(new Set(documents.map(d => d.category)));

  return (
    <div className="space-y-6">
      {/* 1. Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-24 font-bold text-navy-950 dark:text-white flex items-center gap-2.5">
            <FolderLock className="w-6 h-6 text-saffron-500" />
            <span>Statutory Document Vault</span>
          </h1>
          <p className="text-13 text-gov-muted mt-1">
            Centralized document repository with automated expiry countdowns and version history.
          </p>
        </div>

        {/* View Switcher: Table vs Calendar */}
        <div className="flex items-center rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 p-1 shadow-2xs">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-12 font-bold transition-colors ${
              viewMode === 'table'
                ? 'bg-saffron-500 text-white'
                : 'text-gov-text hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg text-12 font-bold transition-colors flex items-center gap-1.5 ${
              viewMode === 'calendar'
                ? 'bg-saffron-500 text-white'
                : 'text-gov-text hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Expiry Calendar</span>
          </button>
        </div>
      </div>

      {/* 2. Automated Expiry Reminders Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-600 flex items-center justify-center font-bold text-16">
            0
          </div>
          <div>
            <div className="text-11 font-bold text-red-700 dark:text-red-300 uppercase">Critical (7 Days)</div>
            <div className="text-12 text-red-900 dark:text-red-200 mt-0.5">Zero certificates expiring this week</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 flex items-center justify-center font-bold text-16">
            1
          </div>
          <div>
            <div className="text-11 font-bold text-amber-700 dark:text-amber-300 uppercase">Urgent (15 Days)</div>
            <div className="text-12 text-amber-900 dark:text-amber-200 mt-0.5 font-semibold">Fire Safety NOC (14 days left)</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 flex items-center justify-center font-bold text-16">
            1
          </div>
          <div>
            <div className="text-11 font-bold text-blue-700 dark:text-blue-300 uppercase">Advance Notice (30 Days)</div>
            <div className="text-12 text-blue-900 dark:text-blue-200 mt-0.5 font-semibold">Affiliation Letter (28 days left)</div>
          </div>
        </div>
      </div>

      {/* 3. Search and Category Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gov-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search certificates, document type..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text placeholder:text-gov-muted focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gov-muted" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Table View */}
      {viewMode === 'table' && (
        <div className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-navy-800 bg-slate-50/60 dark:bg-navy-800/40 text-12 font-bold text-gov-muted uppercase tracking-wider">
                  <th className="py-3.5 px-4">Document Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Validity / Expiry</th>
                  <th className="py-3.5 px-4">Countdown</th>
                  <th className="py-3.5 px-4">Version</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-13">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gov-muted">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-saffron-500 mb-2" />
                      <span>Loading secure document vault...</span>
                    </td>
                  </tr>
                ) : filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gov-muted">
                      No documents found matching current filter.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-navy-950 dark:text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-saffron-500 shrink-0" />
                        <span>{doc.name}</span>
                      </td>
                      <td className="py-3 px-4 text-gov-muted text-12">
                        {doc.category}
                      </td>
                      <td className="py-3 px-4 font-mono text-12 text-gov-text">
                        {doc.expiry_date}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-11 font-mono font-bold ${
                          doc.days_until_expiry <= 15
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-navy-800 dark:text-slate-300'
                        }`}>
                          {doc.days_until_expiry > 365
                            ? `${(doc.days_until_expiry / 365).toFixed(1)} years`
                            : `${doc.days_until_expiry} days left`}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedDocHistory(doc)}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-navy-800 text-gov-text text-11 font-mono font-bold hover:bg-slate-200 transition-colors flex items-center gap-1"
                        >
                          <History className="w-3 h-3 text-gov-muted" />
                          <span>v{doc.version}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-11 font-bold ${
                          doc.status === 'VALID'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => alert(`Downloading verified copy of ${doc.name}...`)}
                          className="p-1.5 rounded-lg text-gov-muted hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                          title="Download document"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Calendar Reminders View */}
      {viewMode === 'calendar' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs space-y-4">
          <h2 className="text-16 font-bold text-navy-950 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-saffron-500" />
            <span>Statutory Expiry Calendar Schedule</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className={`p-4 rounded-xl border flex flex-col justify-between ${
                  doc.days_until_expiry <= 15
                    ? 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-navy-700 bg-slate-50/50 dark:bg-navy-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-11 font-bold text-gov-muted uppercase">{doc.category}</span>
                    <span className="font-mono text-11 font-bold text-saffron-600">v{doc.version}</span>
                  </div>
                  <h3 className="text-14 font-bold text-navy-950 dark:text-white">{doc.name}</h3>
                  <div className="text-12 font-mono text-gov-muted mt-2">
                    Expires on: <span className="font-bold text-navy-900 dark:text-white">{doc.expiry_date}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-navy-700/60 flex items-center justify-between">
                  <span className={`text-12 font-bold ${
                    doc.days_until_expiry <= 15 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {doc.days_until_expiry} Days Remaining
                  </span>
                  <button
                    onClick={() => alert(`Opening renewal form for ${doc.name}...`)}
                    className="text-11 font-bold text-saffron-600 hover:underline"
                  >
                    Renew &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Version History Drawer/Modal */}
      {selectedDocHistory && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedDocHistory(null)}
          />

          <div className="relative w-full max-w-md bg-white dark:bg-navy-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-navy-700 overflow-hidden z-10 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-3">
              <div>
                <h3 className="text-15 font-bold text-navy-950 dark:text-white">
                  Document Version History
                </h3>
                <p className="text-11 text-gov-muted font-mono mt-0.5">
                  {selectedDocHistory.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedDocHistory(null)}
                className="text-gov-muted hover:text-navy-900 dark:hover:text-white text-14 font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2.5">
              {selectedDocHistory.history.map((h) => (
                <div key={h.version} className="p-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 flex items-center justify-between text-12">
                  <div>
                    <div className="font-bold text-navy-950 dark:text-white flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-saffron-500" />
                      <span>Version {h.version}: {h.filename}</span>
                    </div>
                    <div className="text-11 text-gov-muted mt-0.5">
                      Uploaded on {h.uploaded_at}
                    </div>
                  </div>
                  <button
                    onClick={() => alert(`Downloading archived version ${h.version}...`)}
                    className="p-1 rounded text-gov-muted hover:text-saffron-500"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
