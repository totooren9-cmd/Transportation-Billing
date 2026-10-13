import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Truck,
  Fuel,
  Calendar,
  Layers,
  Search,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import {
  buildRolandPivotByTruckType,
  buildRolandPivotByDate,
  exportRolandPivotExcel,
  ROLAND_FINAL_167_TRIPS,
  RolandTripRecord,
} from '../../services/rolandDataService';

interface RolandPivotReportTabProps {
  onLoadRolandTrips?: () => void;
  onNavigateToBilling?: () => void;
}

export const RolandPivotReportTab: React.FC<RolandPivotReportTabProps> = ({
  onLoadRolandTrips,
  onNavigateToBilling,
}) => {
  const [subView, setSubView] = useState<'truck' | 'date' | 'raw'>('truck');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTruckType, setFilterTruckType] = useState<string>('ALL');

  const truckPivot = buildRolandPivotByTruckType();
  const datePivot = buildRolandPivotByDate();

  // Filter raw trips
  const filteredRawTrips = ROLAND_FINAL_167_TRIPS.filter((t) => {
    const matchesSearch =
      t.tripNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.jobNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.truckNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.deliveryDate.includes(searchTerm);

    const matchesTruck =
      filterTruckType === 'ALL' || t.truckType === filterTruckType;

    return matchesSearch && matchesTruck;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-blue-700/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Final Ground Truth
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              รายการ Pivot Table ยอดการคำนวณที่ถูกต้อง Final แล้ว
            </h2>
            <p className="text-blue-200 text-sm font-medium">
              บริษัท ROLAND DIGITAL GROUP (THAILAND) CO.,LTD • ประจำเดือนกันยายน 2026 (167 Trips Verified)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={exportRolandPivotExcel}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-medium text-sm rounded-xl shadow-lg shadow-emerald-900/30 transition-all border border-emerald-400/30"
              title="ส่งออกรายงาน Pivot 3 ชีทสมบูรณ์แบบเป็นไฟล์ Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>ดาวน์โหลด Excel (.xlsx)</span>
            </button>

            {onLoadRolandTrips && (
              <button
                onClick={onLoadRolandTrips}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-medium text-sm rounded-xl shadow-lg shadow-blue-900/30 transition-all border border-blue-400/30"
                title="นำเข้า 167 เที่ยวจริงของ ROLAND เข้าสู่หน้า Billing เพื่อคำนวณทันที"
              >
                <Download className="w-4 h-4" />
                <span>โหลด 167 เที่ยวเข้าสู่ระบบ Billing</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Main Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-blue-200 text-xs font-medium">
              <span>Total QTY (จำนวนสินค้ารวม)</span>
              <Layers className="w-4 h-4 text-blue-300" />
            </div>
            <div className="text-3xl font-extrabold text-white mt-1">
              {truckPivot.totalQty.toLocaleString()}{' '}
              <span className="text-sm font-normal text-blue-200">QTY</span>
            </div>
            <div className="text-xs text-blue-300 mt-1 flex justify-between">
              <span>6W: {truckPivot.subtotals['6W'].qty.toLocaleString()} QTY</span>
              <span>6W-Trailer: {truckPivot.subtotals['6W-Trailer'].qty.toLocaleString()} QTY</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-indigo-200 text-xs font-medium">
              <span>Total Trips (จำนวนเที่ยววิ่งรวม)</span>
              <Truck className="w-4 h-4 text-indigo-300" />
            </div>
            <div className="text-3xl font-extrabold text-white mt-1">
              {truckPivot.totalTrip.toLocaleString()}{' '}
              <span className="text-sm font-normal text-indigo-200">เที่ยว</span>
            </div>
            <div className="text-xs text-indigo-300 mt-1 flex justify-between">
              <span>6W: {truckPivot.subtotals['6W'].trip.toLocaleString()} เที่ยว</span>
              <span>6W-Trailer: {truckPivot.subtotals['6W-Trailer'].trip.toLocaleString()} เที่ยว</span>
            </div>
          </div>

          <div className="bg-emerald-500/20 backdrop-blur-md rounded-xl p-4 border border-emerald-400/30">
            <div className="flex items-center justify-between text-emerald-200 text-xs font-medium">
              <span>Charter Cost (ยอดค่าขนส่งรวม Final)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-300 mt-1">
              ฿{truckPivot.totalCharterCost.toLocaleString()}{' '}
              <span className="text-sm font-normal text-emerald-200">THB</span>
            </div>
            <div className="text-xs text-emerald-200 mt-1 flex justify-between">
              <span>6W: ฿{truckPivot.subtotals['6W'].cost.toLocaleString()}</span>
              <span>6W-Trailer: ฿{truckPivot.subtotals['6W-Trailer'].cost.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubView('truck')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              subView === 'truck'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>ตารางคำนวนการวิ่งรถ แต่ละประเภท (Pivot by Truck Type)</span>
          </button>

          <button
            onClick={() => setSubView('date')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              subView === 'date'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>ตารางคำนวนรายวันตามราคาน้ำมัน (Pivot by Date)</span>
          </button>

          <button
            onClick={() => setSubView('raw')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              subView === 'raw'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>รายการเที่ยวรถทั้ง 167 เที่ยว (Raw 167 Trips Detail)</span>
          </button>
        </div>

        {onNavigateToBilling && (
          <button
            onClick={onNavigateToBilling}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            <span>ไปที่หน้า Billing ตรวจสอบค่าน้ำมัน</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* VIEW 1: EXACT PIVOT TABLE BY TRUCK TYPE (Requested by user) */}
      {subView === 'truck' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/60">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                ตารางคำนวนการวิ่งรถ แต่ละประเภท — ROLAND DIGITAL GROUP
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                จำแนกตามประเภทรถ (Truck_Type) และราคาอ้างอิงน้ำมันรายวัน (Fuel_Ref_Price)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Grand Total: 640,180 THB
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3.5 px-6">Truck_Type</th>
                  <th className="py-3.5 px-6 text-center">Fuel_Ref_Price</th>
                  <th className="py-3.5 px-6 text-right">Total QTY</th>
                  <th className="py-3.5 px-6 text-right">Total trip</th>
                  <th className="py-3.5 px-6 text-right">Charter Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {/* 6W Group */}
                {truckPivot.rows
                  .filter((r) => r.truckType === '6W')
                  .map((row, idx) => (
                    <tr
                      key={`6W-${idx}`}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors"
                    >
                      <td className="py-3 px-6 font-semibold text-blue-600 dark:text-blue-400">
                        {idx === 0 ? '6W' : ''}
                      </td>
                      <td className="py-3 px-6 text-center font-mono font-medium text-slate-700 dark:text-slate-300">
                        {row.fuelRefPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-6 text-right font-medium text-slate-900 dark:text-white">
                        {row.totalQty.toLocaleString()}
                      </td>
                      <td className="py-3 px-6 text-right font-medium text-slate-900 dark:text-white">
                        {row.totalTrip.toLocaleString()}
                      </td>
                      <td className="py-3 px-6 text-right font-mono font-semibold text-slate-900 dark:text-white">
                        {row.charterCost.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                {/* 6W Subtotal */}
                <tr className="bg-blue-50/60 dark:bg-blue-950/30 font-semibold border-t border-b border-blue-200 dark:border-blue-900">
                  <td className="py-2.5 px-6 text-blue-800 dark:text-blue-300 font-bold" colSpan={2}>
                    รวม 6W (Subtotal)
                  </td>
                  <td className="py-2.5 px-6 text-right text-blue-900 dark:text-blue-200">
                    {truckPivot.subtotals['6W'].qty.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-6 text-right text-blue-900 dark:text-blue-200">
                    {truckPivot.subtotals['6W'].trip.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-6 text-right font-mono font-bold text-blue-700 dark:text-blue-300">
                    {truckPivot.subtotals['6W'].cost.toLocaleString()}
                  </td>
                </tr>

                {/* 6W-Trailer Group */}
                {truckPivot.rows
                  .filter((r) => r.truckType === '6W-Trailer')
                  .map((row, idx) => (
                    <tr
                      key={`6W-Trailer-${idx}`}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors"
                    >
                      <td className="py-3 px-6 font-semibold text-purple-600 dark:text-purple-400">
                        {idx === 0 ? '6W-Trailer' : ''}
                      </td>
                      <td className="py-3 px-6 text-center font-mono font-medium text-slate-700 dark:text-slate-300">
                        {row.fuelRefPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-6 text-right font-medium text-slate-900 dark:text-white">
                        {row.totalQty.toLocaleString()}
                      </td>
                      <td className="py-3 px-6 text-right font-medium text-slate-900 dark:text-white">
                        {row.totalTrip.toLocaleString()}
                      </td>
                      <td className="py-3 px-6 text-right font-mono font-semibold text-slate-900 dark:text-white">
                        {row.charterCost.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                {/* 6W-Trailer Subtotal */}
                <tr className="bg-purple-50/60 dark:bg-purple-950/30 font-semibold border-t border-b border-purple-200 dark:border-purple-900">
                  <td className="py-2.5 px-6 text-purple-800 dark:text-purple-300 font-bold" colSpan={2}>
                    รวม 6W-Trailer (Subtotal)
                  </td>
                  <td className="py-2.5 px-6 text-right text-purple-900 dark:text-purple-200">
                    {truckPivot.subtotals['6W-Trailer'].qty.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-6 text-right text-purple-900 dark:text-purple-200">
                    {truckPivot.subtotals['6W-Trailer'].trip.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-6 text-right font-mono font-bold text-purple-700 dark:text-purple-300">
                    {truckPivot.subtotals['6W-Trailer'].cost.toLocaleString()}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                {/* Grand Total */}
                <tr className="bg-slate-900 text-white font-bold text-base border-t-2 border-slate-700">
                  <td className="py-4 px-6 uppercase tracking-wider text-amber-300" colSpan={2}>
                    Grand Total
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-amber-300">
                    {truckPivot.totalQty.toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-amber-300">
                    {truckPivot.totalTrip.toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-emerald-400 text-lg">
                    {truckPivot.totalCharterCost.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: PIVOT TABLE BY DELIVERY DATE */}
      {subView === 'date' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/60">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                ตารางคำนวนรายวันตามราคาอ้างอิงน้ำมัน (Delivery Date)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                22 วันทำงานในเดือนกันยายน 2026 พร้อมราคาน้ำมันอ้างอิงของแต่ละวัน
              </p>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              แสดง 22 วัน • รวม 167 เที่ยว
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-600">
                  <th className="py-3 px-6">Delivery Date</th>
                  <th className="py-3 px-6 text-center">Fuel_Ref_Price</th>
                  <th className="py-3 px-6 text-center">Backhaul</th>
                  <th className="py-3 px-6 text-right">Total QTY</th>
                  <th className="py-3 px-6 text-right">Total trip</th>
                  <th className="py-3 px-6 text-right">Charter Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {datePivot.rows.map((row, idx) => (
                  <tr
                    key={row.deliveryDate}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors"
                  >
                    <td className="py-2.5 px-6 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-6 text-xs text-slate-400">{idx + 1}.</span>
                      <span className="font-mono">{row.deliveryDate}</span>
                    </td>
                    <td className="py-2.5 px-6 text-center font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {row.fuelRefPrice.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
                      {row.backhaul}
                    </td>
                    <td className="py-2.5 px-6 text-right font-medium text-slate-900 dark:text-white">
                      {row.totalQty.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-6 text-right font-medium text-slate-900 dark:text-white">
                      {row.totalTrip.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-6 text-right font-mono font-semibold text-slate-900 dark:text-white">
                      {row.charterCost.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 z-10">
                <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-700">
                  <td className="py-3.5 px-6 text-amber-300" colSpan={3}>
                    Grand Total
                  </td>
                  <td className="py-3.5 px-6 text-right font-mono text-amber-300">
                    {datePivot.totalQty.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-6 text-right font-mono text-amber-300">
                    {datePivot.totalTrip.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-6 text-right font-mono text-emerald-400 text-base">
                    {datePivot.totalCharterCost.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: RAW 167 TRIPS WITH FULL DETAILS & SEARCH */}
      {subView === 'raw' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden space-y-4 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                รายการเที่ยวรถทั้งหมด 167 เที่ยว (Ground Truth Records)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ค้นหาและตรวจสอบรายละเอียดแต่ละเที่ยวได้ทุกคอลัมน์
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหา Trip No, ทะเบียน, คนขับ, วันที่..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>

              <select
                value={filterTruckType}
                onChange={(e) => setFilterTruckType(e.target.value)}
                className="py-1.5 px-3 text-xs bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">ประเภทรถทั้งหมด</option>
                <option value="6W">เฉพาะ 6W ({truckPivot.subtotals['6W'].trip} เที่ยว)</option>
                <option value="6W-Trailer">
                  เฉพาะ 6W-Trailer ({truckPivot.subtotals['6W-Trailer'].trip} เที่ยว)
                </option>
              </select>

              <span className="text-xs text-slate-500 dark:text-slate-400">
                พบ {filteredRawTrips.length} จาก 167 เที่ยว
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl max-h-[600px] overflow-y-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-600">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Trip No</th>
                  <th className="py-2.5 px-3">Job No</th>
                  <th className="py-2.5 px-3">Pick Up</th>
                  <th className="py-2.5 px-3">Delivery</th>
                  <th className="py-2.5 px-3">Driver</th>
                  <th className="py-2.5 px-3">Truck No</th>
                  <th className="py-2.5 px-3 text-center">Type</th>
                  <th className="py-2.5 px-3 text-center">Fuel</th>
                  <th className="py-2.5 px-3 text-right">QTY</th>
                  <th className="py-2.5 px-3 text-right">Cost (THB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-mono">
                {filteredRawTrips.map((t, idx) => (
                  <tr
                    key={t.tripNo + '-' + idx}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors"
                  >
                    <td className="py-2 px-3 text-slate-400 font-sans">{idx + 1}</td>
                    <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">
                      {t.deliveryDate}
                    </td>
                    <td className="py-2 px-3 text-blue-600 dark:text-blue-400 font-semibold truncate max-w-[150px]">
                      {t.tripNo}
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300 truncate max-w-[140px]">
                      {t.jobNo}
                    </td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-sans truncate max-w-[160px]" title={t.pickUpName}>
                      {t.pickUpName.includes('YBLC') ? 'YBLC (บางบ่อ)' : 'ROLAND DIGITAL'}
                    </td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-sans truncate max-w-[160px]" title={t.deliveryName}>
                      {t.deliveryName.includes('YBFLC') ? 'YBFLC Free Zone' : 'YSDC สุวรรณภูมิ'}
                    </td>
                    <td className="py-2 px-3 text-slate-800 dark:text-slate-200 font-sans truncate max-w-[120px]">
                      {t.driverName}
                    </td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                      {t.truckNo}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.truckType === '6W-Trailer'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {t.truckType}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-amber-600 dark:text-amber-400">
                      {t.fuelRefPrice.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-slate-900 dark:text-white">
                      {t.totalQty}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {t.charterCost.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
