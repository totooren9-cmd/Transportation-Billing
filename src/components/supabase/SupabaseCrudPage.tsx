import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Database,
  Search,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckSquare,
  Square,
  AlertTriangle,
  FileSpreadsheet,
  Check,
  X,
  Layers,
  Truck,
  DollarSign,
  Fuel,
  MapPin,
  Settings,
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface SupabaseCrudPageProps {
  addToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

type TableName =
  | 'transport_trips'
  | 'transport_rate_cards'
  | 'transport_fuel_prices'
  | 'transport_fuel_rates'
  | 'transport_trip_fuel'
  | 'transport_zone_mappings'
  | 'transport_custom_rates';

const TABLES_CONFIG: { id: TableName; label: string; icon: React.ReactNode; pk: string }[] = [
  { id: 'transport_trips', label: '🚚 ข้อมูลเที่ยวรถ (Transport Trips)', icon: <Truck className="w-4 h-4 text-blue-500" />, pk: 'id' },
  { id: 'transport_rate_cards', label: '💰 เรทราคา (Rate Cards)', icon: <DollarSign className="w-4 h-4 text-emerald-500" />, pk: 'id' },
  { id: 'transport_fuel_prices', label: '⛽ ราคาน้ำมัน (Fuel Prices)', icon: <Fuel className="w-4 h-4 text-amber-500" />, pk: 'id' },
  { id: 'transport_fuel_rates', label: '📊 อัตราค่าน้ำมัน (Fuel Rates)', icon: <Layers className="w-4 h-4 text-purple-500" />, pk: 'id' },
  { id: 'transport_trip_fuel', label: '🛢️ ค่าน้ำมันต่อเที่ยว (Trip Fuel)', icon: <Fuel className="w-4 h-4 text-rose-500" />, pk: 'id' },
  { id: 'transport_zone_mappings', label: '🗺️ Zone Mapping', icon: <MapPin className="w-4 h-4 text-teal-500" />, pk: 'id' },
  { id: 'transport_custom_rates', label: '🎯 Custom Rate', icon: <Settings className="w-4 h-4 text-indigo-500" />, pk: 'trip_id' },
];

export const SupabaseCrudPage: React.FC<SupabaseCrudPageProps> = ({ addToast }) => {
  const [activeTable, setActiveTable] = useState<TableName>('transport_trips');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal State
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [currentRowData, setCurrentRowData] = useState<Record<string, any>>({});
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);

  const currentTableConfig = TABLES_CONFIG.find((t) => t.id === activeTable) || TABLES_CONFIG[0];
  const pkField = currentTableConfig.pk;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from(activeTable).select('*', { count: 'exact' });

      if (searchKeyword.trim()) {
        if (activeTable === 'transport_trips') {
          query = query.or(`trip_no.ilike.%${searchKeyword}%,job_no.ilike.%${searchKeyword}%,consignee_shipper.ilike.%${searchKeyword}%`);
        } else {
          // generic fallback search on first text column or id
          query = query.ilike('id', `%${searchKeyword}%`);
        }
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setRows(data || []);
      setTotalCount(count || 0);
      setSelectedIds([]);
    } catch (err: any) {
      console.error('Error fetching table data:', err);
      addToast('error', 'ดึงข้อมูลไม่สำเร็จ', err.message);
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [activeTable, page, pageSize, searchKeyword, addToast]);

  useEffect(() => {
    setPage(1);
    fetchData();
  }, [activeTable, fetchData]);

  useEffect(() => {
    fetchData();
  }, [page, pageSize, fetchData]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Handle Select All
  const handleSelectAll = () => {
    if (selectedIds.length === rows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rows.map((r) => r[pkField]));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Audit Log helper
  const logAuditAction = async (tableName: string, recordId: string, action: string, oldData: any, newData: any) => {
    try {
      await supabase.from('audit_logs').insert({
        table_name: tableName,
        record_id: String(recordId),
        action,
        old_data: oldData || null,
        new_data: newData || null,
        action_by: 'admin@gttlogistics.com',
      });
    } catch (e) {
      console.warn('Audit log write error:', e);
    }
  };

  // Save (Create / Update)
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (modalMode === 'create') {
        // Generate UUID if id is missing and pk is id
        const payload = { ...currentRowData };
        if (pkField === 'id' && !payload.id) {
          payload.id = crypto.randomUUID();
        }

        const { data, error } = await supabase.from(activeTable).insert(payload).select().single();
        if (error) throw error;

        await logAuditAction(activeTable, data[pkField] || 'new', 'CREATE', null, data);
        addToast('success', 'เพิ่มข้อมูลสำเร็จ', `บันทึกข้อมูลลงตาราง ${activeTable} เรียบร้อย`);
      } else if (modalMode === 'edit') {
        const recordId = currentRowData[pkField];
        const payload = { ...currentRowData };
        delete payload[pkField]; // Don't update PK

        const { data, error } = await supabase
          .from(activeTable)
          .update(payload)
          .eq(pkField, recordId)
          .select()
          .single();

        if (error) throw error;

        await logAuditAction(activeTable, recordId, 'UPDATE', null, data);
        addToast('success', 'แก้ไขข้อมูลสำเร็จ', `อัปเดตข้อมูลในตาราง ${activeTable} เรียบร้อย`);
      }

      setModalMode(null);
      setCurrentRowData({});
      fetchData();
    } catch (err: any) {
      console.error('Save record error:', err);
      addToast('error', 'บันทึกข้อมูลไม่สำเร็จ', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete Single
  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setLoading(true);
    try {
      const targetRecord = rows.find((r) => r[pkField] === deleteTargetId);
      const { error } = await supabase.from(activeTable).delete().eq(pkField, deleteTargetId);
      if (error) throw error;

      await logAuditAction(activeTable, deleteTargetId, 'DELETE', targetRecord, null);
      addToast('success', 'ลบข้อมูลสำเร็จ', `ลบรายการ ID: ${deleteTargetId} เรียบร้อย`);
      setDeleteTargetId(null);
      fetchData();
    } catch (err: any) {
      console.error('Delete error:', err);
      addToast('error', 'ลบข้อมูลไม่สำเร็จ', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Bulk Delete
  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      const { error } = await supabase.from(activeTable).delete().in(pkField, selectedIds);
      if (error) throw error;

      for (const id of selectedIds) {
        await logAuditAction(activeTable, id, 'BULK_DELETE', null, null);
      }

      addToast('success', 'ลบข้อมูลหลายรายการสำเร็จ', `ลบ ${selectedIds.length} รายการ เรียบร้อย`);
      setIsBulkDeleting(false);
      setSelectedIds([]);
      fetchData();
    } catch (err: any) {
      console.error('Bulk delete error:', err);
      addToast('error', 'ลบข้อมูลหลายรายการไม่สำเร็จ', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Table columns sample preview
  const columns = useMemo(() => {
    if (rows.length === 0) return [pkField, 'created_at'];
    const keys = Object.keys(rows[0]);
    // prioritize key columns
    return keys.slice(0, 7);
  }, [rows, pkField]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
            <Database className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">จัดการฐานข้อมูล Supabase (CRUD Studio)</h2>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-white/25 rounded-full border border-white/30 text-white">
                PostgreSQL Direct
              </span>
            </div>
            <p className="text-xs text-emerald-100 mt-1">
              เชื่อมต่อตารางทั้ง 7 ใน Supabase รองรับการค้นหา กรอง แบ่งหน้า เพิ่ม แก้ไข และลบข้อมูลแบบเรียลไทม์
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-2 border border-white/30"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {/* Table Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {TABLES_CONFIG.map((table) => {
          const isActive = activeTable === table.id;
          return (
            <button
              key={table.id}
              onClick={() => {
                setActiveTable(table.id);
                setSearchKeyword('');
                setPage(1);
              }}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                isActive
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md font-bold'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-400 font-medium'
              }`}
            >
              <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>
                {table.icon}
              </div>
              <div className="truncate">
                <div className="text-xs truncate">{table.label}</div>
                <div className={`text-[10px] truncate ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                  ตาราง: {table.id}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Table Toolbar & Data Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={`ค้นหาในตาราง ${activeTable}...`}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {selectedIds.length > 0 && (
              <button
                onClick={() => setIsBulkDeleting(true)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบที่เลือก ({selectedIds.length})</span>
              </button>
            )}

            <button
              onClick={() => {
                setModalMode('create');
                setCurrentRowData({});
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มข้อมูลใหม่</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto min-h-[320px]">
          {loading && rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
              <p className="text-xs">กำลังโหลดข้อมูลจาก Supabase...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <Database className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-medium">ไม่พบข้อมูลในตาราง {activeTable}</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  <th className="py-3 px-4 w-10 text-center">
                    <button onClick={handleSelectAll} className="text-slate-500 hover:text-emerald-600">
                      {selectedIds.length === rows.length && rows.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  {columns.map((col) => (
                    <th key={col} className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">
                      {col}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right font-bold uppercase tracking-wider text-[11px]">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {rows.map((row) => {
                  const recordId = row[pkField];
                  const isSelected = selectedIds.includes(recordId);
                  return (
                    <tr
                      key={recordId}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors ${
                        isSelected ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => handleSelectRow(recordId)} className="text-slate-400 hover:text-emerald-600">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      {columns.map((col) => (
                        <td key={col} className="py-3 px-4 font-mono text-slate-700 dark:text-slate-200 truncate max-w-xs">
                          {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-slate-400 italic">null</span>}
                        </td>
                      ))}
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => {
                            setModalMode('edit');
                            setCurrentRowData(row);
                          }}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(recordId)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 rounded-lg transition-colors"
                          title="ลบ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-900/30">
          <div className="text-slate-500 dark:text-slate-400">
            แสดง {(page - 1) * pageSize + 1} ถึง {Math.min(page * pageSize, totalCount)} จากทั้งหมด {totalCount} รายการ
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">แสดงหน้าละ:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-semibold">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Create / Edit Form */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {modalMode === 'create' ? `➕ เพิ่มข้อมูลใหม่ (${activeTable})` : `✏️ แก้ไขข้อมูล (${activeTable})`}
              </h3>
              <button onClick={() => setModalMode(null)} className="p-1 text-white/80 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="p-6 space-y-4 overflow-y-auto flex-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                กรอกฟิลด์ข้อมูลที่ต้องการสำหรับตาราง <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-emerald-600">{activeTable}</code>:
              </p>

              {columns.map((col) => {
                if (col === pkField && modalMode === 'edit') return null; // read-only PK on edit
                return (
                  <div key={col} className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      {col} {col === pkField || col === 'trip_no' || col === 'job_no' ? <span className="text-rose-500">*</span> : null}
                    </label>
                    <input
                      type="text"
                      required={col === pkField || col === 'trip_no' || col === 'job_no'}
                      value={currentRowData[col] !== undefined && currentRowData[col] !== null ? String(currentRowData[col]) : ''}
                      onChange={(e) =>
                        setCurrentRowData({
                          ...currentRowData,
                          [col]: e.target.value,
                        })
                      }
                      placeholder={`ระบุ ${col}...`}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-hidden focus:border-emerald-500 font-mono"
                    />
                  </div>
                );
              })}

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-xs font-semibold transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกข้อมูล</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Single */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">ยืนยันการลบข้อมูล</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              คุณต้องการลบรายการรหัส <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{deleteTargetId}</code> จากตาราง {activeTable} นี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={loading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Bulk Delete */}
      {isBulkDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">ยืนยันการลบหลายรายการ</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              คุณต้องการลบข้อมูลที่เลือกจำนวน <strong className="text-rose-600">{selectedIds.length}</strong> รายการ จากตาราง {activeTable} ใช่หรือไม่?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsBulkDeleting(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleBulkDeleteConfirm}
                disabled={loading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                ยืนยันลบทั้งหมด ({selectedIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
