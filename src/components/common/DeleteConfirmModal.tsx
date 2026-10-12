import React, { useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  RefreshCw,
  Database,
  Cloud,
  Layers,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export type DeleteTargetType =
  | 'transport_trips'
  | 'transport_rate_cards'
  | 'transport_fuel_prices'
  | 'transport_fuel_rates'
  | 'transport_trip_fuel'
  | 'transport_zone_mappings'
  | 'transport_custom_rates'
  | 'upload_history';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: DeleteTargetType;
  targetLabel: string;
  itemsCount: number;
  selectedIds?: string[];
  itemName?: string;
  isBulk?: boolean;
  filterDescription?: string;
  onConfirmDelete: (deleteMode: 'soft' | 'hard') => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetLabel,
  itemsCount,
  selectedIds = [],
  itemName,
  isBulk = false,
  filterDescription,
  onConfirmDelete,
}) => {
  const [deleteMode, setDeleteMode] = useState<'soft' | 'hard'>('soft');
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const count = isBulk ? (selectedIds.length > 0 ? selectedIds.length : itemsCount) : 1;
  const isHardDelete = deleteMode === 'hard';
  const requiresConfirmInput = isHardDelete;
  const isInputValid = !requiresConfirmInput || confirmInput.trim() === 'DELETE';

  const handleExecute = async () => {
    if (requiresConfirmInput && !isInputValid) {
      setErrorMsg('กรุณาพิมพ์คำว่า DELETE เพื่อยืนยันการลบถาวร');
      return;
    }

    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await onConfirmDelete(deleteMode);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-linear-to-r from-rose-600 to-red-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-snug">
                {isBulk ? `ยืนยันการลบข้อมูลหลายรายการ (${count} รายการ)` : 'ยืนยันการลบข้อมูล'}
              </h3>
              <p className="text-xs text-white/80">
                ตาราง: <code className="font-mono bg-black/20 px-1.5 py-0.5 rounded">{targetType}</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-white/80 hover:text-white p-1 text-xl font-bold leading-none disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Target summary box */}
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-900 dark:text-rose-200 text-sm">
                คุณกำลังจะลบ {targetLabel}
              </p>
              {itemName && (
                <p className="text-rose-700 dark:text-rose-300 font-mono">
                  รายการ: <span className="font-bold">{itemName}</span>
                </p>
              )}
              {filterDescription && (
                <p className="text-rose-600 dark:text-rose-400">
                  เงื่อนไข: {filterDescription}
                </p>
              )}
              <div className="flex items-center gap-2 pt-1 text-[11px] text-rose-700 dark:text-rose-300">
                <span className="font-semibold">จำนวนที่เลือก:</span>
                <span className="px-2 py-0.5 bg-rose-200/60 dark:bg-rose-900/80 rounded font-mono font-bold text-rose-900 dark:text-rose-100">
                  {count.toLocaleString()} รายการ
                </span>
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <Cloud className="w-3.5 h-3.5" />
                  พร้อม Sync Supabase Realtime
                </span>
              </div>
            </div>
          </div>

          {/* Delete Mode Selection: Soft Delete vs Hard Delete */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-800 dark:text-slate-200 block">
              เลือกรูปแบบการลบข้อมูล (Deletion Type):
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-1.5 ${
                  deleteMode === 'soft'
                    ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <input
                      type="radio"
                      name="deleteMode"
                      value="soft"
                      checked={deleteMode === 'soft'}
                      onChange={() => setDeleteMode('soft')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Soft Delete (แนะนำ)</span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                    ปลอดภัย
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  ซ่อนข้อมูลและตั้งค่า <code>is_deleted = true</code> กู้คืนได้ ปลอดภัยต่อการตรวจสอบย้อนหลัง
                </p>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-1.5 ${
                  deleteMode === 'hard'
                    ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <input
                      type="radio"
                      name="deleteMode"
                      value="hard"
                      checked={deleteMode === 'hard'}
                      onChange={() => setDeleteMode('hard')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span>Hard Delete</span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300">
                    ถาวร
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  ลบแถวข้อมูลออกจากฐานข้อมูล Supabase และหน่วยความจำถาวร ไม่สามารถกู้คืนได้
                </p>
              </label>
            </div>
          </div>

          {/* Type DELETE to confirm if Hard Delete */}
          {isHardDelete && (
            <div className="space-y-1.5 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl">
              <label className="font-semibold text-amber-900 dark:text-amber-200 flex items-center justify-between">
                <span>พิมพ์คำว่า &quot;DELETE&quot; เพื่อยืนยันการลบถาวร:</span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono">Case-sensitive</span>
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-rose-500 uppercase font-bold"
                autoFocus
              />
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 rounded-lg text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              การลบจะถูกบันทึกลงฐานข้อมูล Supabase ทันที พร้อมอัปเดตแคชและหน้าจอแบบเรียลไทม์
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            ยกเลิก (Cancel)
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={isDeleting || (requiresConfirmInput && !isInputValid)}
            className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-2 transition-all ${
              isHardDelete
                ? 'bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400'
                : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
            }`}
          >
            {isDeleting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>กำลังลบข้อมูล...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันการลบ ({count} รายการ)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
