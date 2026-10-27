import React, { useState, useMemo } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Columns, 
  MoreVertical,
  Check
} from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  isTabular?: boolean;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyField: keyof T;
  title?: string;
  onRowAction?: (action: string, row: T) => void;
  actions?: { label: string; action: string }[];
  selectable?: boolean;
  onSelectionChange?: (selectedKeys: string[]) => void;
  rowsPerPageOptions?: number[];
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  title,
  onRowAction,
  actions = [],
  selectable = true,
  onSelectionChange,
  rowsPerPageOptions = [5, 10, 20],
  className = ""
}: DataTableProps<T>) {
  // State
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<Set<string>>(
    new Set(columns.map(c => c.key))
  );
  const [showColumnChooser, setShowColumnChooser] = useState(false);
  const [activeMenuRowId, setActiveMenuRowId] = useState<string | null>(null);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;
      const compare = String(valA).localeCompare(String(valB), undefined, { numeric: true });
      return sortDir === 'asc' ? compare : -compare;
    });
  }, [data, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / rowsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else {
        setSortKey(null);
        setSortDir('asc');
      }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(paginatedData.map(d => String(d[keyField])));
      setSelectedIds(allIds);
      onSelectionChange?.(Array.from(allIds));
    } else {
      setSelectedIds(new Set());
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
    onSelectionChange?.(Array.from(next));
  };

  const toggleColumnVisibility = (key: string) => {
    const next = new Set(visibleColumnKeys);
    if (next.has(key)) {
      if (next.size > 1) next.delete(key);
    } else {
      next.add(key);
    }
    setVisibleColumnKeys(next);
  };

  const visibleColumns = columns.filter(c => visibleColumnKeys.has(c.key));
  const isAllSelected = paginatedData.length > 0 && paginatedData.every(d => selectedIds.has(String(d[keyField])));

  return (
    <div className={`bg-gov-surface border border-gov-border rounded-lg shadow-xs overflow-hidden ${className}`}>
      {/* Table Toolbar */}
      <div className="p-3 sm:p-4 border-b border-gov-border flex flex-wrap items-center justify-between gap-3 bg-gov-surface">
        <div>
          {title && <h3 className="text-16 font-bold text-gov-text">{title}</h3>}
          <p className="text-12 text-gov-muted">
            Showing <span className="tabular-nums font-semibold text-gov-text">{paginatedData.length}</span> of <span className="tabular-nums font-semibold text-gov-text">{data.length}</span> records
            {selectedIds.size > 0 && (
              <span className="ml-2 font-bold text-navy-700 bg-navy-50 px-2 py-0.5 rounded">
                {selectedIds.size} selected
              </span>
            )}
          </p>
        </div>

        {/* Column Chooser Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColumnChooser(!showColumnChooser)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-12 font-semibold text-gov-text bg-gov-surface border border-gov-border rounded hover:bg-gov-subtle transition-colors cursor-pointer"
            aria-expanded={showColumnChooser}
          >
            <Columns className="w-3.5 h-3.5 text-gov-muted" />
            Columns ({visibleColumns.length}/{columns.length})
          </button>

          {showColumnChooser && (
            <div className="absolute right-0 mt-2 w-52 bg-gov-surface border border-gov-border rounded-md shadow-lg p-2 z-30">
              <p className="text-12 font-bold text-gov-text px-2 py-1 border-b border-gov-border mb-1">
                Toggle Columns
              </p>
              <div className="space-y-1">
                {columns.map(col => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-2 py-1 text-12 text-gov-text hover:bg-gov-subtle rounded cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumnKeys.has(col.key)}
                      onChange={() => toggleColumnVisibility(col.key)}
                      className="rounded border-gov-border text-navy-700 focus:ring-saffron-500"
                    />
                    <span>{col.header}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Table Body Container */}
      <div className="overflow-x-auto max-h-[500px] relative">
        <table className="w-full text-left text-14 border-collapse">
          {/* Sticky Header */}
          <thead className="bg-navy-900 text-white sticky top-0 z-10 shadow-xs">
            <tr>
              {selectable && (
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    aria-label="Select all rows"
                    className="rounded border-slate-300 text-navy-700 focus:ring-saffron-500 cursor-pointer"
                  />
                </th>
              )}

              {visibleColumns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  style={{ width: col.width }}
                  className={`p-3 font-semibold text-12 uppercase tracking-wider select-none text-slate-100 ${
                    col.sortable ? 'cursor-pointer hover:bg-navy-700' : ''
                  } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                >
                  <div className={`inline-flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : ''}`}>
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-slate-300">
                        {sortKey === col.key ? (
                          sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-saffron-500" /> : <ChevronDown className="w-3.5 h-3.5 text-saffron-500" />
                        ) : (
                          <ChevronsUpDown className="w-3 h-3 opacity-50" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}

              {actions.length > 0 && (
                <th className="p-3 w-16 text-center font-semibold text-12 uppercase tracking-wider text-slate-100">
                  Action
                </th>
              )}
            </tr>
          </thead>

          {/* Table Rows */}
          <tbody className="divide-y divide-gov-border bg-gov-surface">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="p-8 text-center text-gov-muted text-14">
                  No records match the current filter criteria.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => {
                const rowId = String(row[keyField]);
                const isSelected = selectedIds.has(rowId);
                return (
                  <tr
                    key={rowId}
                    className={`transition-colors duration-150 hover:bg-gov-subtle ${
                      isSelected ? 'bg-navy-50/70' : idx % 2 === 1 ? 'bg-gov-bg/30' : ''
                    }`}
                  >
                    {selectable && (
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(rowId)}
                          aria-label={`Select row ${rowId}`}
                          className="rounded border-gov-border text-navy-700 focus:ring-saffron-500 cursor-pointer"
                        />
                      </td>
                    )}

                    {visibleColumns.map(col => (
                      <td
                        key={col.key}
                        className={`p-3 text-gov-text ${
                          col.isTabular ? 'tabular-nums' : ''
                        } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                      >
                        {col.accessor(row)}
                      </td>
                    ))}

                    {actions.length > 0 && (
                      <td className="p-3 text-center relative">
                        <button
                          type="button"
                          onClick={() => setActiveMenuRowId(activeMenuRowId === rowId ? null : rowId)}
                          className="p-1 hover:bg-gov-subtle rounded text-gov-muted hover:text-gov-text transition-colors cursor-pointer"
                          aria-label="Row actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuRowId === rowId && (
                          <div className="absolute right-3 top-8 bg-gov-surface border border-gov-border rounded-md shadow-lg py-1 w-36 z-20 text-left">
                            {actions.map(act => (
                              <button
                                key={act.action}
                                type="button"
                                onClick={() => {
                                  onRowAction?.(act.action, row);
                                  setActiveMenuRowId(null);
                                }}
                                className="block w-full text-left px-3 py-1.5 text-12 text-gov-text hover:bg-navy-50 hover:text-navy-700 font-medium cursor-pointer"
                              >
                                {act.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 sm:p-4 border-t border-gov-border flex flex-wrap items-center justify-between gap-3 bg-gov-surface text-12 text-gov-muted">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gov-border rounded px-2 py-1 bg-gov-surface text-gov-text text-12 outline-none cursor-pointer"
          >
            {rowsPerPageOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="tabular-nums">
            Page <strong className="text-gov-text">{currentPage}</strong> of <strong className="text-gov-text">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              className="p-1.5 rounded border border-gov-border bg-gov-surface hover:bg-gov-subtle disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4 text-gov-text" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              className="p-1.5 rounded border border-gov-border bg-gov-surface hover:bg-gov-subtle disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4 text-gov-text" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
