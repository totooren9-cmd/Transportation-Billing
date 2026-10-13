import React from 'react';
import { X } from 'lucide-react';
import { RolandPivotReportTab } from '../reports/RolandPivotReportTab';

interface RolandPivotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadRolandTrips?: () => void;
  onNavigateToBilling?: () => void;
}

export const RolandPivotModal: React.FC<RolandPivotModalProps> = ({
  isOpen,
  onClose,
  onLoadRolandTrips,
  onNavigateToBilling,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-base">
              📊
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Pivot Table: ROLAND DIGITAL GROUP (THAILAND) CO.,LTD
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ยอดการคำนวณที่ถูกต้อง Final แล้ว • Total QTY = 4,012 | Total Trips = 167 | Charter Cost = 640,180 THB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <RolandPivotReportTab
            onLoadRolandTrips={() => {
              if (onLoadRolandTrips) {
                onLoadRolandTrips();
                onClose();
              }
            }}
            onNavigateToBilling={() => {
              if (onNavigateToBilling) {
                onNavigateToBilling();
                onClose();
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
