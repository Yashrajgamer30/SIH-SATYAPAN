import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../context/authStore';
import {
  Users, Search, Plus, ArrowUpDown, ChevronLeft, ChevronRight,
  Filter, X, CheckCircle2, AlertTriangle, ShieldCheck, Download,
  Edit2, Trash2, Award, Briefcase, Calendar, RefreshCw
} from 'lucide-react';

interface FacultyItem {
  id: string;
  name: string;
  designation: string;
  qualification: string;
  department: string;
  pan_masked: string;
  employment_type: string;
  joining_date: string;
  created_at?: string;
}

interface FSRMetrics {
  total_students: number;
  total_faculty: number;
  regular_faculty: number;
  current_ratio: string;
  numeric_ratio: number;
  prescribed_norm: string;
  is_compliant: boolean;
  status_label: string;
}

export const FacultyView: React.FC = () => {
  const { token } = useAuthStore();
  const [faculty, setFaculty] = useState<FacultyItem[]>([]);
  const [fsr, setFsr] = useState<FSRMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit'>('add');
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyItem | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    designation: 'Assistant Professor',
    qualification: 'M.Tech / M.E.',
    department: 'Computer Science and Engineering',
    pan: '',
    employment_type: 'REGULAR',
    joining_date: '2023-08-01'
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const departmentsList = [
    'Computer Science and Engineering',
    'Information Technology',
    'Electronics & Telecommunication',
    'Mechanical Engineering',
    'Applied Sciences'
  ];

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        sort_by: sortBy,
        sort_order: sortOrder
      });
      if (search.trim()) params.append('search', search.trim());
      if (department !== 'ALL') params.append('department', department);

      const resp = await fetch(`http://localhost:8000/institute/faculty?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const json = await resp.json();
        setFaculty(json.faculty);
        setFsr(json.fsr_widget);
        setTotalPages(json.pagination.total_pages);
        setTotalItems(json.pagination.total_items);
      }
    } catch (e) {
      console.error('Failed to fetch faculty list:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, [page, sortBy, sortOrder, department, token]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchFaculty();
  };

  const handleOpenAdd = () => {
    setDrawerMode('add');
    setSelectedFaculty(null);
    setFormData({
      name: '',
      designation: 'Assistant Professor',
      qualification: 'Ph.D. / M.Tech',
      department: 'Computer Science and Engineering',
      pan: '',
      employment_type: 'REGULAR',
      joining_date: new Date().toISOString().split('T')[0]
    });
    setFormError(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (f: FacultyItem) => {
    setDrawerMode('edit');
    setSelectedFaculty(f);
    setFormData({
      name: f.name,
      designation: f.designation,
      qualification: f.qualification,
      department: f.department,
      pan: '', // Keep blank unless updating
      employment_type: f.employment_type,
      joining_date: f.joining_date
    });
    setFormError(null);
    setIsDrawerOpen(true);
  };

  const handleSaveFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Form validations
    if (!formData.name.trim()) {
      setFormError('Faculty name is mandatory.');
      return;
    }
    if (drawerMode === 'add') {
      if (!formData.pan.trim() || formData.pan.trim().length !== 10) {
        setFormError('A valid 10-character Permanent Account Number (PAN) is mandatory.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (drawerMode === 'add') {
        const resp = await fetch('http://localhost:8000/institute/faculty', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        if (!resp.ok) {
          const err = await resp.json();
          throw new Error(err.detail || 'Failed to add faculty member');
        }
      } else if (selectedFaculty) {
        const updatePayload: Record<string, any> = {
          name: formData.name,
          designation: formData.designation,
          qualification: formData.qualification,
          department: formData.department,
          employment_type: formData.employment_type,
          joining_date: formData.joining_date
        };
        if (formData.pan.trim()) {
          updatePayload.pan = formData.pan.trim();
        }
        const resp = await fetch(`http://localhost:8000/institute/faculty/${selectedFaculty.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatePayload)
        });
        if (!resp.ok) {
          const err = await resp.json();
          throw new Error(err.detail || 'Failed to update faculty member');
        }
      }

      setIsDrawerOpen(false);
      fetchFaculty();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred during save.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFaculty = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the verified institutional faculty register?`)) {
      return;
    }
    try {
      const resp = await fetch(`http://localhost:8000/institute/faculty/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        fetchFaculty();
      }
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const handleExportXLSX = () => {
    window.open(`http://localhost:8000/institute/export/faculty?format=xlsx`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-24 font-bold text-navy-950 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-saffron-500" />
            <span>Faculty Register & Cadre Compliance</span>
          </h1>
          <p className="text-13 text-gov-muted mt-1">
            Maintain cadre-wise faculty appointments endorsed against AICTE Approval Process Handbook (APH 2026-27).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportXLSX}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-gov-text font-semibold text-13 hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors flex items-center gap-2 shadow-2xs"
          >
            <Download className="w-4 h-4 text-gov-muted" />
            <span>Export XLSX</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-13 shadow-sm hover:shadow transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Faculty Member</span>
          </button>
        </div>
      </div>

      {/* 2. Faculty-Student Ratio (FSR) Widget with Prescribed AICTE Norm */}
      {fsr && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-18 shrink-0">
              {fsr.total_faculty}
            </div>
            <div>
              <div className="text-11 font-bold text-gov-muted uppercase tracking-wider">Total Faculty</div>
              <div className="text-13 font-semibold text-navy-950 dark:text-white mt-0.5">
                {fsr.regular_faculty} Regular Cadre
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-18 shrink-0">
              {fsr.total_students}
            </div>
            <div>
              <div className="text-11 font-bold text-gov-muted uppercase tracking-wider">Approved Student Intake</div>
              <div className="text-13 font-semibold text-navy-950 dark:text-white mt-0.5">
                4 Academic Batches
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-16 shrink-0 ${
              fsr.is_compliant
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
            }`}>
              {fsr.current_ratio}
            </div>
            <div>
              <div className="text-11 font-bold text-gov-muted uppercase tracking-wider">Current FSR Ratio</div>
              <div className="text-12 font-medium text-gov-muted mt-0.5">
                AICTE Norm: <span className="font-bold text-navy-900 dark:text-white">{fsr.prescribed_norm} (UG)</span>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center gap-3.5 shadow-xs ${
            fsr.is_compliant
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
          }`}>
            {fsr.is_compliant ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <div>
              <div className="text-13 font-bold">{fsr.status_label}</div>
              <div className="text-11 opacity-80 mt-0.5">
                {fsr.is_compliant
                  ? 'Satisfies mandatory cadre norms'
                  : 'Requires recruitment before EoA submission'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gov-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search faculty name, department..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text placeholder:text-gov-muted focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gov-muted" />
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
            >
              <option value="ALL">All Departments</option>
              {departmentsList.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-gov-text text-13 font-medium hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors flex items-center gap-1.5"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-gov-muted" />
            <span className="uppercase text-11 font-bold">{sortOrder}</span>
          </button>
        </div>
      </div>

      {/* 4. Faculty Table */}
      <div className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-navy-800 bg-slate-50/60 dark:bg-navy-800/40 text-12 font-bold text-gov-muted uppercase tracking-wider">
                <th className="py-3.5 px-4">Faculty Name</th>
                <th className="py-3.5 px-4">Designation</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Qualification</th>
                <th className="py-3.5 px-4">Masked PAN</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Joining Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-13">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gov-muted">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-saffron-500 mb-2" />
                    <span>Loading verified faculty records...</span>
                  </td>
                </tr>
              ) : faculty.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gov-muted">
                    No faculty records found matching current query.
                  </td>
                </tr>
              ) : (
                faculty.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-navy-950 dark:text-white">
                      {f.name}
                    </td>
                    <td className="py-3 px-4 text-gov-text font-medium">
                      {f.designation}
                    </td>
                    <td className="py-3 px-4 text-gov-muted">
                      {f.department}
                    </td>
                    <td className="py-3 px-4 text-gov-text">
                      {f.qualification}
                    </td>
                    <td className="py-3 px-4 font-mono text-12 font-semibold text-slate-600 dark:text-slate-300">
                      {f.pan_masked}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-11 font-bold ${
                        f.employment_type === 'REGULAR'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40'
                      }`}>
                        {f.employment_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gov-muted font-mono text-12">
                      {f.joining_date}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(f)}
                          className="p-1.5 rounded-lg text-gov-muted hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                          title="Edit details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFaculty(f.id, f.name)}
                          className="p-1.5 rounded-lg text-gov-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          title="Delete faculty"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-13 text-gov-muted">
          <div>
            Showing <span className="font-bold text-navy-950 dark:text-white">{faculty.length}</span> of{' '}
            <span className="font-bold text-navy-950 dark:text-white">{totalItems}</span> faculty members
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-navy-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-navy-800 text-gov-text"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-12 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-navy-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-navy-800 text-gov-text"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Add / Edit Side Drawer with Validation */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-navy-950/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white dark:bg-navy-900 shadow-2xl z-10 flex flex-col h-full border-l border-slate-200 dark:border-navy-700">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between">
              <div>
                <h3 className="text-16 font-bold text-navy-950 dark:text-white">
                  {drawerMode === 'add' ? 'Add New Faculty Member' : 'Edit Faculty Record'}
                </h3>
                <p className="text-12 text-gov-muted mt-0.5">
                  Endorsed with masked PAN and AICTE cadre rules.
                </p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg text-gov-muted hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Form */}
            <form onSubmit={handleSaveFaculty} className="flex-1 overflow-y-auto p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-12 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-12 font-bold text-gov-text mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Ramesh Gupta"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
                />
              </div>

              <div>
                <label className="block text-12 font-bold text-gov-text mb-1.5">
                  Designation *
                </label>
                <select
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
                >
                  <option value="Professor & Principal">Professor & Principal</option>
                  <option value="Professor & Head">Professor & Head</option>
                  <option value="Professor">Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Adjunct Faculty">Adjunct Faculty</option>
                </select>
              </div>

              <div>
                <label className="block text-12 font-bold text-gov-text mb-1.5">
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
                >
                  {departmentsList.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-12 font-bold text-gov-text mb-1.5">
                  Highest Qualification *
                </label>
                <input
                  type="text"
                  required
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  placeholder="e.g. Ph.D. in Computer Science"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
                />
              </div>

              <div>
                <label className="block text-12 font-bold text-gov-text mb-1.5">
                  Permanent Account Number (PAN) {drawerMode === 'add' ? '*' : '(Leave empty to keep unchanged)'}
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={formData.pan}
                  onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                  placeholder={drawerMode === 'add' ? 'ABCDE1234F' : selectedFaculty?.pan_masked || 'ABCDE1234F'}
                  className="w-full px-3.5 py-2 font-mono uppercase bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
                />
                <p className="text-11 text-gov-muted mt-1">
                  Stored securely and displayed masked per DPDP Act 2023.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-12 font-bold text-gov-text mb-1.5">
                    Employment Type
                  </label>
                  <select
                    value={formData.employment_type}
                    onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
                  >
                    <option value="REGULAR">Regular Full-Time</option>
                    <option value="CONTRACTUAL">Contractual</option>
                    <option value="AD_HOC">Ad-Hoc / Visiting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-12 font-bold text-gov-text mb-1.5">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-navy-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-navy-700 text-gov-text text-13 font-semibold hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-saffron-500 hover:bg-saffron-600 disabled:opacity-50 text-white text-13 font-bold transition-all shadow-sm"
                >
                  {submitting ? 'Saving...' : drawerMode === 'add' ? 'Add Faculty' : 'Update Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
