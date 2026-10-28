import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../context/authStore';
import { BulkImportModal } from './BulkImportModal';
import {
  GraduationCap, Search, Plus, Filter, Download, ArrowUpDown,
  ChevronLeft, ChevronRight, FileSpreadsheet, Eye, Edit2, Trash2,
  FileCheck2, AlertCircle, X, CheckCircle2, SlidersHorizontal, RefreshCw
} from 'lucide-react';

interface StudentItem {
  id: string;
  enrolment_no: string;
  name: string;
  programme: string;
  year: number;
  category: string;
  gender: string;
  dob: string;
  email: string;
  mobile_masked: string;
  status: string;
  docs_uploaded: number;
  docs_required: number;
  docs_status: 'COMPLETE' | 'PENDING';
}

export const StudentsView: React.FC = () => {
  const { token } = useAuthStore();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [programme, setProgramme] = useState('ALL');
  const [year, setYear] = useState<string>('ALL');
  const [category, setCategory] = useState('ALL');
  const [gender, setGender] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState('enrolment_no');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Column Chooser
  const [showColumnChooser, setShowColumnChooser] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    enrolment: true,
    name: true,
    programme: true,
    year: true,
    category: true,
    gender: true,
    email: true,
    mobile: true,
    docs: true,
    status: true,
    actions: true
  });

  // Modal / Drawer state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit'>('add');
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    enrolment_no: '',
    name: '',
    programme: 'Computer Science and Engineering',
    year: 1,
    category: 'GENERAL',
    gender: 'M',
    dob: '2005-05-15',
    email: '',
    mobile: '',
    status: 'ENROLLED'
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const programmesList = [
    'Computer Science and Engineering',
    'Information Technology',
    'Electronics & Telecommunication',
    'Mechanical Engineering'
  ];

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        sort_by: sortBy,
        sort_order: sortOrder
      });
      if (search.trim()) params.append('search', search.trim());
      if (programme !== 'ALL') params.append('programme', programme);
      if (year !== 'ALL') params.append('year', year);
      if (category !== 'ALL') params.append('category', category);
      if (gender !== 'ALL') params.append('gender', gender);
      if (status !== 'ALL') params.append('status', status);

      const resp = await fetch(`http://localhost:8000/institute/students?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const json = await resp.json();
        setStudents(json.students);
        setTotalPages(json.pagination.total_pages);
        setTotalItems(json.pagination.total_items);
      }
    } catch (e) {
      console.error('Failed to fetch students:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, sortBy, sortOrder, programme, year, category, gender, status, token]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleOpenAdd = () => {
    setDrawerMode('add');
    setSelectedStudent(null);
    setFormData({
      enrolment_no: '',
      name: '',
      programme: 'Computer Science and Engineering',
      year: 1,
      category: 'GENERAL',
      gender: 'M',
      dob: '2005-01-01',
      email: '',
      mobile: '',
      status: 'ENROLLED'
    });
    setFormError(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (s: StudentItem) => {
    setDrawerMode('edit');
    setSelectedStudent(s);
    setFormData({
      enrolment_no: s.enrolment_no,
      name: s.name,
      programme: s.programme,
      year: s.year,
      category: s.category,
      gender: s.gender,
      dob: s.dob,
      email: s.email,
      mobile: '', // keep unchanged unless specified
      status: s.status
    });
    setFormError(null);
    setIsDrawerOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Student full name is mandatory.');
      return;
    }
    if (drawerMode === 'add') {
      if (!formData.enrolment_no.trim()) {
        setFormError('Enrolment number is required.');
        return;
      }
      if (!formData.email.includes('@')) {
        setFormError('A valid email address is required.');
        return;
      }
      if (formData.mobile.length < 10) {
        setFormError('A valid 10-digit mobile number is required.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (drawerMode === 'add') {
        const resp = await fetch('http://localhost:8000/institute/students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        if (!resp.ok) {
          const err = await resp.json();
          throw new Error(err.detail || 'Failed to add student');
        }
      } else if (selectedStudent) {
        const updatePayload: Record<string, any> = {
          name: formData.name,
          programme: formData.programme,
          year: formData.year,
          category: formData.category,
          gender: formData.gender,
          dob: formData.dob,
          email: formData.email,
          status: formData.status
        };
        if (formData.mobile.trim()) {
          updatePayload.mobile = formData.mobile.trim();
        }
        const resp = await fetch(`http://localhost:8000/institute/students/${selectedStudent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatePayload)
        });
        if (!resp.ok) {
          const err = await resp.json();
          throw new Error(err.detail || 'Failed to update student');
        }
      }

      setIsDrawerOpen(false);
      fetchStudents();
    } catch (e: any) {
      setFormError(e.message || 'Error saving student record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from institutional enrolments?`)) return;

    try {
      const resp = await fetch(`http://localhost:8000/institute/students/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        fetchStudents();
      }
    } catch (e) {
      console.error('Delete student failed:', e);
    }
  };

  const handleExport = (format: 'xlsx' | 'csv') => {
    const params = new URLSearchParams({ format });
    if (programme !== 'ALL') params.append('programme', programme);
    window.open(`http://localhost:8000/institute/export/students?${params.toString()}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-24 font-bold text-navy-950 dark:text-white flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-saffron-500" />
            <span>Enrolled Students Register</span>
          </h1>
          <p className="text-13 text-gov-muted mt-1">
            Verified student enrolment data with mandatory document verification status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Column Chooser Button */}
          <div className="relative">
            <button
              onClick={() => setShowColumnChooser(!showColumnChooser)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-gov-text font-semibold text-13 hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors flex items-center gap-2 shadow-2xs"
            >
              <SlidersHorizontal className="w-4 h-4 text-gov-muted" />
              <span>Columns</span>
            </button>

            {showColumnChooser && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-xl p-3 z-30 text-12 space-y-1.5">
                <div className="font-bold text-navy-950 dark:text-white pb-1.5 border-b border-slate-100 dark:border-navy-800">
                  Select Visible Columns
                </div>
                {Object.keys(visibleColumns).map((colKey) => (
                  <label key={colKey} className="flex items-center gap-2 py-1 px-1.5 hover:bg-slate-50 dark:hover:bg-navy-800 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleColumns[colKey as keyof typeof visibleColumns]}
                      onChange={(e) =>
                        setVisibleColumns({
                          ...visibleColumns,
                          [colKey]: e.target.checked
                        })
                      }
                      className="rounded text-saffron-500 focus:ring-saffron-400"
                    />
                    <span className="capitalize">{colKey.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Export Dropdown */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 shadow-2xs overflow-hidden">
            <button
              onClick={() => handleExport('xlsx')}
              className="px-3 py-2 text-13 font-semibold text-gov-text hover:bg-slate-50 dark:hover:bg-navy-800 border-r border-slate-200 dark:border-navy-700 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-gov-muted" />
              <span>XLSX</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="px-3 py-2 text-13 font-semibold text-gov-text hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors"
            >
              <span>CSV</span>
            </button>
          </div>

          {/* Bulk Import */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-saffron-300 dark:border-saffron-800 bg-saffron-50 dark:bg-saffron-950/40 text-saffron-700 dark:text-saffron-300 font-bold text-13 hover:bg-saffron-100 dark:hover:bg-saffron-900/60 transition-colors flex items-center gap-2 shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-saffron-600" />
            <span>Bulk Import</span>
          </button>

          {/* Add Student */}
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-13 shadow-sm hover:shadow transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* 2. Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gov-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search enrolment no, student name..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text placeholder:text-gov-muted focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
            />
          </form>

          <button
            onClick={() => {
              setProgramme('ALL');
              setYear('ALL');
              setCategory('ALL');
              setGender('ALL');
              setStatus('ALL');
              setSearch('');
              setPage(1);
            }}
            className="text-12 font-semibold text-saffron-600 dark:text-saffron-400 hover:underline"
          >
            Reset Filters
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 dark:border-navy-800 text-12">
          {/* Programme */}
          <div>
            <label className="block text-[11px] font-bold text-gov-muted uppercase mb-1">Programme</label>
            <select
              value={programme}
              onChange={(e) => { setProgramme(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg text-gov-text focus:outline-none"
            >
              <option value="ALL">All Programmes</option>
              {programmesList.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-[11px] font-bold text-gov-muted uppercase mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => { setYear(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg text-gov-text focus:outline-none"
            >
              <option value="ALL">All Years</option>
              <option value="1">Year 1 (FE)</option>
              <option value="2">Year 2 (SE)</option>
              <option value="3">Year 3 (TE)</option>
              <option value="4">Year 4 (BE)</option>
            </select>
          </div>

          {/* Social Category */}
          <div>
            <label className="block text-[11px] font-bold text-gov-muted uppercase mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg text-gov-text focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="GENERAL">GENERAL</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="EWS">EWS</option>
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-[11px] font-bold text-gov-muted uppercase mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => { setGender(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg text-gov-text focus:outline-none"
            >
              <option value="ALL">All Genders</option>
              <option value="M">Male (M)</option>
              <option value="F">Female (F)</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-bold text-gov-muted uppercase mb-1">Enrolment Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg text-gov-text focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="ENROLLED">ENROLLED</option>
              <option value="PROVISIONAL">PROVISIONAL</option>
              <option value="TRANSFERRED">TRANSFERRED</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Students Table */}
      <div className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-navy-800 bg-slate-50/60 dark:bg-navy-800/40 text-12 font-bold text-gov-muted uppercase tracking-wider">
                {visibleColumns.enrolment && <th className="py-3.5 px-4">Enrolment No</th>}
                {visibleColumns.name && <th className="py-3.5 px-4">Student Name</th>}
                {visibleColumns.programme && <th className="py-3.5 px-4">Programme</th>}
                {visibleColumns.year && <th className="py-3.5 px-4">Year</th>}
                {visibleColumns.category && <th className="py-3.5 px-4">Category</th>}
                {visibleColumns.gender && <th className="py-3.5 px-4">Gender</th>}
                {visibleColumns.email && <th className="py-3.5 px-4">Email</th>}
                {visibleColumns.mobile && <th className="py-3.5 px-4">Mobile</th>}
                {visibleColumns.docs && <th className="py-3.5 px-4">Document Status</th>}
                {visibleColumns.status && <th className="py-3.5 px-4">Status</th>}
                {visibleColumns.actions && <th className="py-3.5 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-13">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gov-muted">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-saffron-500 mb-2" />
                    <span>Loading student records...</span>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gov-muted">
                    No student records matching the selected filters.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/30 transition-colors">
                    {visibleColumns.enrolment && (
                      <td className="py-3 px-4 font-mono font-bold text-navy-950 dark:text-white">
                        {s.enrolment_no}
                      </td>
                    )}
                    {visibleColumns.name && (
                      <td className="py-3 px-4 font-bold text-navy-900 dark:text-slate-100">
                        {s.name}
                      </td>
                    )}
                    {visibleColumns.programme && (
                      <td className="py-3 px-4 text-gov-muted max-w-[200px] truncate" title={s.programme}>
                        {s.programme}
                      </td>
                    )}
                    {visibleColumns.year && (
                      <td className="py-3 px-4 font-bold text-center">
                        Year {s.year}
                      </td>
                    )}
                    {visibleColumns.category && (
                      <td className="py-3 px-4 font-semibold text-12">
                        {s.category}
                      </td>
                    )}
                    {visibleColumns.gender && (
                      <td className="py-3 px-4 text-center">
                        {s.gender}
                      </td>
                    )}
                    {visibleColumns.email && (
                      <td className="py-3 px-4 text-gov-muted font-mono text-12">
                        {s.email}
                      </td>
                    )}
                    {visibleColumns.mobile && (
                      <td className="py-3 px-4 font-mono text-12 text-gov-muted">
                        {s.mobile_masked}
                      </td>
                    )}
                    {/* Document Status Column */}
                    {visibleColumns.docs && (
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-11 font-bold flex items-center gap-1 ${
                            s.docs_status === 'COMPLETE'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40'
                          }`}>
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>{s.docs_uploaded} / {s.docs_required} Uploaded</span>
                          </span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-11 font-bold bg-slate-100 dark:bg-navy-800 text-gov-text border border-slate-200 dark:border-navy-700">
                          {s.status}
                        </span>
                      </td>
                    )}
                    {visibleColumns.actions && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 rounded-lg text-gov-muted hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                            title="Edit student"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s.id, s.name)}
                            className="p-1.5 rounded-lg text-gov-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            title="Delete student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-13 text-gov-muted">
          <div>
            Showing <span className="font-bold text-navy-950 dark:text-white">{students.length}</span> of{' '}
            <span className="font-bold text-navy-950 dark:text-white">{totalItems}</span> registered students
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

      {/* 4. Add/Edit Side Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-navy-950/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white dark:bg-navy-900 shadow-2xl z-10 flex flex-col h-full border-l border-slate-200 dark:border-navy-700">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between">
              <div>
                <h3 className="text-16 font-bold text-navy-950 dark:text-white">
                  {drawerMode === 'add' ? 'Add New Student' : 'Edit Student Record'}
                </h3>
                <p className="text-12 text-gov-muted mt-0.5">
                  Maintain verified student identity credentials.
                </p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg text-gov-muted hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveStudent} className="flex-1 overflow-y-auto p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-12 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-12 font-bold text-gov-text mb-1.5">
                  Enrolment / Roll Number *
                </label>
                <input
                  type="text"
                  required
                  disabled={drawerMode === 'edit'}
                  value={formData.enrolment_no}
                  onChange={(e) => setFormData({ ...formData, enrolment_no: e.target.value.toUpperCase() })}
                  placeholder="e.g. EN2026SIT101"
                  className="w-full px-3.5 py-2 font-mono uppercase bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text focus:outline-none focus:ring-2 focus:ring-saffron-500/30 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-12 font-bold text-gov-text mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
                />
              </div>

              <div>
                <label className="block text-12 font-bold text-gov-text mb-1.5">
                  Approved Programme *
                </label>
                <select
                  value={formData.programme}
                  onChange={(e) => setFormData({ ...formData, programme: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
                >
                  {programmesList.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-12 font-bold text-gov-text mb-1.5">
                    Academic Year *
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
                  >
                    <option value={1}>1st Year (FE)</option>
                    <option value={2}>2nd Year (SE)</option>
                    <option value={3}>3rd Year (TE)</option>
                    <option value={4}>4th Year (BE)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-12 font-bold text-gov-text mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
                  >
                    <option value="GENERAL">GENERAL</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-12 font-bold text-gov-text mb-1.5">
                    Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
                  >
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-12 font-bold text-gov-text mb-1.5">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-12 font-bold text-gov-text mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@sit.ac.in"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
                />
              </div>

              <div>
                <label className="block text-12 font-bold text-gov-text mb-1.5">
                  Mobile Number {drawerMode === 'add' ? '*' : '(Leave empty to keep unchanged)'}
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder={drawerMode === 'add' ? '9820112233' : selectedStudent?.mobile_masked || '9820112233'}
                  className="w-full px-3.5 py-2 font-mono bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
                />
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
                  {submitting ? 'Saving...' : drawerMode === 'add' ? 'Add Student' : 'Update Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Bulk Import Modal */}
      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          fetchStudents();
        }}
      />
    </div>
  );
};
