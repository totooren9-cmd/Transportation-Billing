import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Truck,
  Building2,
  FileSpreadsheet,
  Search,
  ArrowLeft,
  CheckCircle2,
  Layers,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Package,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CalculatedBillingTrip } from '../../types';

interface ReportsPageProps {
  trips: CalculatedBillingTrip[];
  onLoadRolandTrips?: () => void;
  onNavigateToBilling?: () => void;
}

interface CompanyFuelPivotItem {
  truckType: string;
  fuelPrice: number;
  qty: number;
  tripCount: number;
  charterCost: number;
}

interface CompanyTruckGroup {
  truckType: string;
  items: CompanyFuelPivotItem[];
  subtotalQty: number;
  subtotalTrips: number;
  subtotalCost: number;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  trips,
  onNavigateToBilling,
}) => {
  // Navigation tabs: Default to 'company' (Per Shipper / Consignee) as requested
  const [reportTab, setReportTab] = useState<'company' | 'monthly' | 'truck'>('company');
  const [filterSearch, setFilterSearch] = useState('');

  // Selected company for drill-down report
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [companySubView, setCompanySubView] = useState<'pivot-truck' | 'pivot-date' | 'trips'>('pivot-truck');
  const [companyTripsSearch, setCompanyTripsSearch] = useState('');

  const effectiveTrips = trips || [];

  // =====================================================================
  // 1. Monthly Report Data
  // =====================================================================
  const monthlyData = useMemo(() => {
    const map = new Map<
      string,
      { count: number; totalAmount: number; count4W: number; count6W: number; count10W: number }
    >();

    effectiveTrips.forEach((t) => {
      const parts = t.issueDate.split(/[-/]/);
      const mKey = parts.length >= 2 ? `${parts[1]}/${parts[2] || '2026'}` : '09/2026';
      const cur = map.get(mKey) || {
        count: 0,
        totalAmount: 0,
        count4W: 0,
        count6W: 0,
        count10W: 0,
      };

      cur.count += 1;
      cur.totalAmount += t.standardTripRate || t.totalAmount || 0;
      if (t.standardTruckType === '4W') cur.count4W += 1;
      if (t.standardTruckType === '6W') cur.count6W += 1;
      if (t.standardTruckType === '10W') cur.count10W += 1;

      map.set(mKey, cur);
    });

    return Array.from(map.entries()).map(([month, data]) => ({
      monthKey: month,
      monthName: `งวดเดือน ${month}`,
      ...data,
      avgTripRate: data.count > 0 ? data.totalAmount / data.count : 0,
    }));
  }, [effectiveTrips]);

  // =====================================================================
  // 2. Per Truck / Driver Report Data
  // =====================================================================
  const truckData = useMemo(() => {
    const map = new Map<
      string,
      {
        truckNo: string;
        driverName: string;
        truckType: string;
        tripCount: number;
        totalAmount: number;
        destinations: Set<string>;
      }
    >();

    effectiveTrips.forEach((t) => {
      const plate = t.raw?.truckNo || t.truckNo || 'ไม่ระบุทะเบียน';
      const cur = map.get(plate) || {
        truckNo: plate,
        driverName: t.raw?.driverName || t.driverName || '-',
        truckType: t.standardTruckType || t.truckTypeRaw || '6W',
        tripCount: 0,
        totalAmount: 0,
        destinations: new Set<string>(),
      };

      cur.tripCount += 1;
      cur.totalAmount += t.standardTripRate || t.totalAmount || 0;
      if (t.zoneLocationMatch || t.deliveryName) cur.destinations.add(t.zoneLocationMatch || t.deliveryName);
      map.set(plate, cur);
    });

    return Array.from(map.values())
      .filter((item) => {
        if (!filterSearch) return true;
        const q = filterSearch.toLowerCase();
        return (
          item.truckNo.toLowerCase().includes(q) ||
          item.driverName.toLowerCase().includes(q) ||
          item.truckType.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [effectiveTrips, filterSearch]);

  // =====================================================================
  // 3. Per Consignee / Company Report Data
  // =====================================================================
  const companyData = useMemo(() => {
    const map = new Map<
      string,
      {
        companyName: string;
        tripCount: number;
        totalAmount: number;
        count4W: number;
        count6W: number;
        count10W: number;
        totalQty: number;
      }
    >();

    effectiveTrips.forEach((t) => {
      const comp = (t.consigneeShipper && t.consigneeShipper !== '-' ? t.consigneeShipper : t.pickUpName) || 'General Shipper';
      const cur = map.get(comp) || {
        companyName: comp,
        tripCount: 0,
        totalAmount: 0,
        count4W: 0,
        count6W: 0,
        count10W: 0,
        totalQty: 0,
      };

      const qty = Number(t.raw?.qty) || Number(t.raw?.actualQty) || 1;
      cur.tripCount += 1;
      cur.totalAmount += t.totalAmount || t.standardTripRate || 0;
      cur.totalQty += qty;

      const tType = (t.truckTypeRaw || t.standardTruckType || '').toUpperCase();
      if (tType.includes('4W') || tType.includes('4 ล้อ')) cur.count4W += 1;
      else if (tType.includes('10W') || tType.includes('10 ล้อ')) cur.count10W += 1;
      else cur.count6W += 1;

      map.set(comp, cur);
    });

    return Array.from(map.values())
      .filter((item) => {
        if (!filterSearch) return true;
        return item.companyName.toLowerCase().includes(filterSearch.toLowerCase());
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [effectiveTrips, filterSearch]);

  // =====================================================================
  // 4. Drill-down Calculations for Selected Company
  // =====================================================================
  const companyTrips = useMemo(() => {
    if (!selectedCompany) return [];
    return effectiveTrips.filter(
      (t) =>
        (t.consigneeShipper && t.consigneeShipper.trim() === selectedCompany.trim()) ||
        (t.raw?.consigneeShipper && t.raw.consigneeShipper.trim() === selectedCompany.trim()) ||
        (t.pickUpName && t.pickUpName.trim() === selectedCompany.trim())
    );
  }, [effectiveTrips, selectedCompany]);

  // Grouped by Truck Type and Fuel Ref Price (matches image.png)
  const truckFuelPivot = useMemo(() => {
    if (companyTrips.length === 0) {
      return { groups: [], grandQty: 0, grandTrips: 0, grandCost: 0 };
    }

    const groupMap = new Map<string, Map<number, { qty: number; tripCount: number; charterCost: number }>>();

    companyTrips.forEach((t) => {
      // Determine truck type label matching user's standards (6W, 6W-Trailer, 4W, 10W)
      let tType = t.truckTypeRaw || t.standardTruckType || '6W';
      const upper = tType.toUpperCase();
      if (upper.includes('TRAILER') || upper.includes('เทรลเลอร์')) {
        tType = '6W-Trailer';
      } else if (upper.includes('6W') || upper.includes('6 ล้อ')) {
        tType = '6W';
      } else if (upper.includes('10W') || upper.includes('10 ล้อ')) {
        tType = '10W';
      } else if (upper.includes('4W') || upper.includes('4 ล้อ')) {
        tType = '4W';
      }

      // Fuel reference price for that trip
      let fuelPrice = 0;
      if (t.dieselRate && t.dieselRate > 0) {
        fuelPrice = Number(t.dieselRate.toFixed(2));
      } else if ((t.raw as any)?.dieselRate && Number((t.raw as any).dieselRate) > 0) {
        fuelPrice = Number(Number((t.raw as any).dieselRate).toFixed(2));
      } else {
        fuelPrice = 40.69;
      }

      const qty = Number(t.raw?.qty) || Number(t.raw?.actualQty) || 1;
      const cost = Number(t.totalAmount) || Number(t.standardTripRate) || Number(t.raw?.truckCharge) || 0;

      if (!groupMap.has(tType)) {
        groupMap.set(tType, new Map());
      }
      const priceMap = groupMap.get(tType)!;
      const cur = priceMap.get(fuelPrice) || { qty: 0, tripCount: 0, charterCost: 0 };
      cur.qty += qty;
      cur.tripCount += 1;
      cur.charterCost += cost;
      priceMap.set(fuelPrice, cur);
    });

    let grandQty = 0;
    let grandTrips = 0;
    let grandCost = 0;

    const groups: CompanyTruckGroup[] = [];

    // Prioritize natural ordering: 6W, 6W-Trailer, 4W, 10W
    const sortedTypes = Array.from(groupMap.keys()).sort((a, b) => {
      const order = ['6W', '6W-Trailer', '4W', '10W'];
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    sortedTypes.forEach((tType) => {
      const priceMap = groupMap.get(tType)!;
      const sortedPrices = Array.from(priceMap.keys()).sort((a, b) => a - b);

      let subQty = 0;
      let subTrips = 0;
      let subCost = 0;

      const rows: CompanyFuelPivotItem[] = sortedPrices.map((price) => {
        const val = priceMap.get(price)!;
        subQty += val.qty;
        subTrips += val.tripCount;
        subCost += val.charterCost;
        return {
          truckType: tType,
          fuelPrice: price,
          qty: val.qty,
          tripCount: val.tripCount,
          charterCost: val.charterCost,
        };
      });

      grandQty += subQty;
      grandTrips += subTrips;
      grandCost += subCost;

      groups.push({
        truckType: tType,
        items: rows,
        subtotalQty: subQty,
        subtotalTrips: subTrips,
        subtotalCost: subCost,
      });
    });

    return { groups, grandQty, grandTrips, grandCost };
  }, [companyTrips]);

  // Grouped by Delivery Date and Fuel Price
  const datePivot = useMemo(() => {
    if (companyTrips.length === 0) return { rows: [], grandQty: 0, grandTrips: 0, grandCost: 0 };

    const map = new Map<
      string,
      { deliveryDate: string; fuelPrice: number; backhaul: string; qty: number; tripCount: number; charterCost: number }
    >();

    companyTrips.forEach((t) => {
      const date = t.issueDate || t.raw?.deliveryDate || 'N/A';
      const fuelPrice = t.dieselRate ? Number(t.dieselRate.toFixed(2)) : 40.69;
      const qty = Number(t.raw?.qty) || Number(t.raw?.actualQty) || 1;
      const cost = Number(t.totalAmount) || Number(t.standardTripRate) || 0;
      const backhaul = t.backhaul || t.raw?.backhaul || 'No';

      const key = `${date}__${fuelPrice}`;
      const cur = map.get(key) || {
        deliveryDate: date,
        fuelPrice,
        backhaul,
        qty: 0,
        tripCount: 0,
        charterCost: 0,
      };
      cur.qty += qty;
      cur.tripCount += 1;
      cur.charterCost += cost;
      map.set(key, cur);
    });

    const rows = Array.from(map.values()).sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate));
    const grandQty = rows.reduce((s, r) => s + r.qty, 0);
    const grandTrips = rows.reduce((s, r) => s + r.tripCount, 0);
    const grandCost = rows.reduce((s, r) => s + r.charterCost, 0);

    return { rows, grandQty, grandTrips, grandCost };
  }, [companyTrips]);

  // Filtered raw trips for the selected company
  const filteredCompanyTrips = useMemo(() => {
    if (!companyTripsSearch) return companyTrips;
    const q = companyTripsSearch.toLowerCase();
    return companyTrips.filter(
      (t) =>
        (t.tripNo || '').toLowerCase().includes(q) ||
        (t.jobNo || '').toLowerCase().includes(q) ||
        (t.deliveryName || '').toLowerCase().includes(q) ||
        (t.truckNo || t.raw?.truckNo || '').toLowerCase().includes(q) ||
        (t.driverName || t.raw?.driverName || '').toLowerCase().includes(q)
    );
  }, [companyTrips, companyTripsSearch]);

  // =====================================================================
  // Export Handlers
  // =====================================================================
  const handleExportSelectedCompanyExcel = () => {
    if (!selectedCompany) return;
    const wb = XLSX.utils.book_new();

    // 1. Pivot by Truck Type Sheet (matching image.png)
    const pivotRows: any[] = [
      [`ตารางคำนวนการวิ่งรถ แต่ละประเภท — ${selectedCompany}`],
      ['Generated on:', new Date().toLocaleString('th-TH')],
      [],
      ['Truck_Type', 'Fuel_Ref_Price', 'Total QTY', 'Total trip', 'Charter Cost'],
    ];

    truckFuelPivot.groups.forEach((g) => {
      g.items.forEach((item, idx) => {
        pivotRows.push([
          idx === 0 ? g.truckType : '',
          item.fuelPrice,
          item.qty,
          item.tripCount,
          item.charterCost,
        ]);
      });
      pivotRows.push([
        `รวม ${g.truckType} (Subtotal)`,
        '',
        g.subtotalQty,
        g.subtotalTrips,
        g.subtotalCost,
      ]);
    });
    pivotRows.push([]);
    pivotRows.push([
      'GRAND TOTAL',
      '',
      truckFuelPivot.grandQty,
      truckFuelPivot.grandTrips,
      truckFuelPivot.grandCost,
    ]);

    const wsTruck = XLSX.utils.aoa_to_sheet(pivotRows);
    wsTruck['!cols'] = [{ wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsTruck, 'Pivot_By_Truck_Type');

    // 2. Pivot by Date Sheet
    const dateRows: any[] = [
      [`ตารางคำนวนรายวันตามราคาอ้างอิงน้ำมัน — ${selectedCompany}`],
      ['Generated on:', new Date().toLocaleString('th-TH')],
      [],
      ['Delivery Date', 'Fuel_Ref_Price', 'Backhaul', 'Total QTY', 'Total trip', 'Charter Cost'],
      ...datePivot.rows.map((r) => [
        r.deliveryDate,
        r.fuelPrice,
        r.backhaul,
        r.qty,
        r.tripCount,
        r.charterCost,
      ]),
      [],
      ['Grand Total', '', '', datePivot.grandQty, datePivot.grandTrips, datePivot.grandCost],
    ];
    const wsDate = XLSX.utils.aoa_to_sheet(dateRows);
    wsDate['!cols'] = [{ wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsDate, 'Pivot_By_Date');

    // 3. Raw Trips Detail Sheet
    const tripHeaders = [
      'Date',
      'Trip No',
      'Job No.',
      'Pick Up Name',
      'Delivery Name',
      'Driver Name',
      'Truck No',
      'Truck Type',
      'Fuel Ref Price (THB/L)',
      'QTY',
      'Charter Cost (THB)',
    ];
    const tripRows = companyTrips.map((t) => [
      t.issueDate || t.raw?.deliveryDate || '',
      t.tripNo || '',
      t.jobNo || '',
      t.pickUpName || '',
      t.deliveryName || '',
      t.driverName || t.raw?.driverName || '',
      t.truckNo || t.raw?.truckNo || '',
      t.truckTypeRaw || t.standardTruckType || '',
      t.dieselRate ?? '-',
      Number(t.raw?.qty) || Number(t.raw?.actualQty) || 1,
      Number(t.totalAmount) || Number(t.standardTripRate) || 0,
    ]);
    const wsTrips = XLSX.utils.aoa_to_sheet([tripHeaders, ...tripRows]);
    wsTrips['!cols'] = [
      { wch: 14 },
      { wch: 22 },
      { wch: 20 },
      { wch: 30 },
      { wch: 30 },
      { wch: 18 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
      { wch: 12 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, wsTrips, 'Trips_Detail');

    const cleanName = selectedCompany.replace(/[/\\?%*:|"<>]/g, '_');
    XLSX.writeFile(wb, `${cleanName}_Fuel_Analytics_Report.xlsx`);
  };

  const handleExportMonthly = () => {
    const rows = monthlyData.map((m) => [
      m.monthName,
      m.count,
      m.count4W,
      m.count6W,
      m.count10W,
      m.totalAmount,
      m.avgTripRate,
    ]);
    const headers = [
      'รอบเดือน',
      'จำนวนเที่ยวรวม',
      'รถ 4W (คัน)',
      'รถ 6W (คัน)',
      'รถ 10W (คัน)',
      'ยอดค่าขนส่งรวม (THB)',
      'ค่าขนส่งเฉลี่ยต่อเที่ยว (THB)',
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Report');
    XLSX.writeFile(wb, 'Monthly_Transportation_Report.xlsx');
  };

  const handleExportTruck = () => {
    const rows = truckData.map((t) => [
      t.truckNo,
      t.driverName,
      t.truckType,
      t.tripCount,
      t.totalAmount,
      Array.from(t.destinations).join(', '),
    ]);
    const headers = [
      'ทะเบียนรถ',
      'ชื่อพนักงานขับรถ',
      'ประเภทรถ',
      'จำนวนเที่ยว',
      'ยอดค่าขนส่งรวม (THB)',
      'ปลายทางที่จัดส่ง',
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Per Truck Report');
    XLSX.writeFile(wb, 'Per_Truck_Transportation_Report.xlsx');
  };

  const handleExportCompanyList = () => {
    const rows = companyData.map((c) => [
      c.companyName,
      c.tripCount,
      c.totalQty,
      c.count4W,
      c.count6W,
      c.count10W,
      c.totalAmount,
      c.tripCount > 0 ? (c.totalAmount / c.tripCount).toFixed(2) : '0',
    ]);
    const headers = [
      'บริษัท (Consignee/Shipper)',
      'จำนวนเที่ยวรวม',
      'จำนวน QTY รวม',
      'เที่ยว 4W',
      'เที่ยว 6W',
      'เที่ยว 10W',
      'ยอดค่าขนส่งรวม (THB)',
      'เฉลี่ยต่อเที่ยว (THB)',
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Per Company Report');
    XLSX.writeFile(wb, 'Per_Company_Transportation_Report.xlsx');
  };

  // =====================================================================
  // Main Render
  // =====================================================================
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              FUEL ANALYTICS & PIVOT REPORTS
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            วิเคราะห์ค่าน้ำมันและสถิติการขนส่ง (Fuel Analytics & Pivot Reports)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            รายงานวิเคราะห์ค่าน้ำมันรายบริษัทแยกตามประเภทรถ, รายงานรายเดือน และรายงานรายรถ/คนขับ
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {reportTab === 'company' && selectedCompany && (
            <button
              onClick={handleExportSelectedCompanyExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel ({selectedCompany})</span>
            </button>
          )}

          {reportTab === 'company' && !selectedCompany && (
            <button
              onClick={handleExportCompanyList}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (รายชื่อบริษัททั้งหมด)</span>
            </button>
          )}

          {reportTab === 'monthly' && (
            <button
              onClick={handleExportMonthly}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (รายเดือน)</span>
            </button>
          )}

          {reportTab === 'truck' && (
            <button
              onClick={handleExportTruck}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (รายรถ)</span>
            </button>
          )}

          {onNavigateToBilling && (
            <button
              onClick={onNavigateToBilling}
              className="px-3.5 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors"
            >
              ไปยังหน้าตารางค่าขนส่ง
            </button>
          )}
        </div>
      </div>

      {/* Main Report Tabs - Only the 3 genuine reports */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-700 text-xs font-semibold gap-1">
        <button
          onClick={() => {
            setReportTab('company');
          }}
          className={`pb-3 px-5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            reportTab === 'company'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>รายงานรายบริษัท (Per Shipper / Consignee)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-mono">
            {companyData.length}
          </span>
        </button>

        <button
          onClick={() => {
            setReportTab('monthly');
            setSelectedCompany(null);
          }}
          className={`pb-3 px-5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            reportTab === 'monthly'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>รายงานรายเดือน (Monthly Report)</span>
        </button>

        <button
          onClick={() => {
            setReportTab('truck');
            setSelectedCompany(null);
          }}
          className={`pb-3 px-5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            reportTab === 'truck'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>รายงานรายรถ / คนขับ (Per Truck / Driver)</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* TAB 1: COMPANY REPORT (LIST OR DRILL-DOWN)                        */}
      {/* ================================================================= */}
      {reportTab === 'company' && (
        <div className="space-y-5">
          {/* A. If a Company is Selected: Show Detailed Company Drill-Down Report */}
          {selectedCompany ? (
            <div className="space-y-6">
              {/* Breadcrumb & Navigation Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCompany(null)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>ย้อนกลับไปรายชื่อบริษัท</span>
                  </button>
                  <span className="text-slate-400 text-xs">/</span>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 truncate max-w-md">
                    {selectedCompany}
                  </span>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400">
                  พบข้อมูลทั้งหมด <strong className="text-slate-800 dark:text-white font-mono">{companyTrips.length.toLocaleString()}</strong> เที่ยว
                </div>
              </div>

              {/* KPI Summary Cards for Selected Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                    <span>จำนวนเที่ยววิ่งรวม</span>
                    <Truck className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                    {truckFuelPivot.grandTrips.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-slate-500">เที่ยว</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {truckFuelPivot.groups.map((g) => `${g.truckType}: ${g.subtotalTrips}`).join(' • ')}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                    <span>ยอดจำนวนชิ้นรวม (Total QTY)</span>
                    <Package className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 font-mono">
                    {truckFuelPivot.grandQty.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-slate-500">QTY</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    คำนวณตามปริมาณขนส่งจริง
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                    <span>ยอดค่าขนส่งรวม (Charter Cost)</span>
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                    ฿{truckFuelPivot.grandCost.toLocaleString('th-TH', { minimumFractionDigits: 0 })}{' '}
                    <span className="text-xs font-normal text-slate-500">THB</span>
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    คำนวณตามประเภทรถ & ราคาน้ำมัน
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                    <span>เฉลี่ยต่อเที่ยว (Avg / Trip)</span>
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 font-mono">
                    ฿
                    {(truckFuelPivot.grandTrips > 0
                      ? truckFuelPivot.grandCost / truckFuelPivot.grandTrips
                      : 0
                    ).toLocaleString('th-TH', { minimumFractionDigits: 0 })}{' '}
                    <span className="text-xs font-normal text-slate-500">THB</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    ค่าขนส่งเฉลี่ยต่อ 1 เที่ยววิ่ง
                  </p>
                </div>
              </div>

              {/* Sub-view Switcher Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                <button
                  onClick={() => setCompanySubView('pivot-truck')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    companySubView === 'pivot-truck'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>ตารางคำนวนการวิ่งรถ แต่ละประเภท (Pivot by Truck Type)</span>
                </button>

                <button
                  onClick={() => setCompanySubView('pivot-date')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    companySubView === 'pivot-date'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>ตารางคำนวนรายวันตามราคาอ้างอิงน้ำมัน (Pivot by Date)</span>
                </button>

                <button
                  onClick={() => setCompanySubView('trips')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    companySubView === 'trips'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>รายการเที่ยวรถทั้งหมด ({companyTrips.length} เที่ยว)</span>
                </button>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SUB-VIEW 1: PIVOT BY TRUCK TYPE & FUEL PRICE (MATCHES IMAGE)  */}
              {/* ------------------------------------------------------------- */}
              {companySubView === 'pivot-truck' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  {/* Top Header matching user's image */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          ตารางคำนวนการวิ่งรถ แต่ละประเภท — {selectedCompany}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          จำแนกตามประเภทรถ (Truck_Type) และราคาอ้างอิงน้ำมันรายวัน (Fuel_Ref_Price)
                        </p>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 rounded-full text-xs font-bold self-start sm:self-auto">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Grand Total: ฿{truckFuelPivot.grandCost.toLocaleString()} THB</span>
                    </div>
                  </div>

                  {/* Table matching user's image layout exactly */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 font-bold">
                        <tr>
                          <th className="py-3 px-6 w-1/5">Truck_Type</th>
                          <th className="py-3 px-6 text-center w-1/5">Fuel_Ref_Price</th>
                          <th className="py-3 px-6 text-right w-1/5">Total QTY</th>
                          <th className="py-3 px-6 text-right w-1/5">Total trip</th>
                          <th className="py-3 px-6 text-right w-1/5">Charter Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {truckFuelPivot.groups.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400">
                              ไม่พบข้อมูลเที่ยวรถสำหรับบริษัทนี้
                            </td>
                          </tr>
                        ) : (
                          truckFuelPivot.groups.map((group) => {
                            const isTrailer = group.truckType.includes('Trailer');
                            const typeColor = isTrailer
                              ? 'text-purple-600 dark:text-purple-400'
                              : 'text-blue-600 dark:text-blue-400';

                            return (
                              <React.Fragment key={group.truckType}>
                                {group.items.map((row, rIdx) => (
                                  <tr
                                    key={`${group.truckType}-${row.fuelPrice}`}
                                    className="hover:bg-blue-50/40 dark:hover:bg-slate-700/40 transition-colors"
                                  >
                                    <td className={`py-2.5 px-6 font-bold ${typeColor}`}>
                                      {rIdx === 0 ? group.truckType : ''}
                                    </td>
                                    <td className="py-2.5 px-6 text-center font-mono text-slate-700 dark:text-slate-300">
                                      {row.fuelPrice.toFixed(2)}
                                    </td>
                                    <td className="py-2.5 px-6 text-right font-mono text-slate-800 dark:text-slate-200">
                                      {row.qty.toLocaleString()}
                                    </td>
                                    <td className="py-2.5 px-6 text-right font-mono text-slate-800 dark:text-slate-200">
                                      {row.tripCount.toLocaleString()}
                                    </td>
                                    <td className="py-2.5 px-6 text-right font-mono font-bold text-slate-900 dark:text-white">
                                      {row.charterCost.toLocaleString()}
                                    </td>
                                  </tr>
                                ))}

                                {/* Subtotal row */}
                                <tr className="bg-slate-50/80 dark:bg-slate-800/80 font-bold border-y border-slate-200 dark:border-slate-700">
                                  <td className={`py-3 px-6 ${typeColor} font-bold`}>
                                    รวม {group.truckType} (Subtotal)
                                  </td>
                                  <td className="py-3 px-6"></td>
                                  <td className="py-3 px-6 text-right font-mono text-slate-900 dark:text-white">
                                    {group.subtotalQty.toLocaleString()}
                                  </td>
                                  <td className="py-3 px-6 text-right font-mono text-slate-900 dark:text-white">
                                    {group.subtotalTrips.toLocaleString()}
                                  </td>
                                  <td className={`py-3 px-6 text-right font-mono font-bold ${typeColor}`}>
                                    {group.subtotalCost.toLocaleString()}
                                  </td>
                                </tr>
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                      {/* Dark Grand Total Footer matching user's image */}
                      {truckFuelPivot.groups.length > 0 && (
                        <tfoot className="bg-slate-950 text-white font-extrabold border-t-2 border-slate-900">
                          <tr>
                            <td className="py-3.5 px-6 text-amber-400 font-black tracking-wider text-xs">
                              GRAND TOTAL
                            </td>
                            <td className="py-3.5 px-6"></td>
                            <td className="py-3.5 px-6 text-right font-mono text-emerald-400 text-xs">
                              {truckFuelPivot.grandQty.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-6 text-right font-mono text-emerald-400 text-xs">
                              {truckFuelPivot.grandTrips.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-6 text-right font-mono text-emerald-400 text-sm font-black">
                              {truckFuelPivot.grandCost.toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SUB-VIEW 2: PIVOT BY DELIVERY DATE                            */}
              {/* ------------------------------------------------------------- */}
              {companySubView === 'pivot-date' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                          ตารางคำนวนรายวันตามราคาอ้างอิงน้ำมัน — {selectedCompany}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          จำแนกตามวันที่จัดส่ง (Delivery Date), ราคาอ้างอิงน้ำมัน (Fuel_Ref_Price) และขากลับ (Backhaul)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 font-bold">
                        <tr>
                          <th className="py-3 px-6">Delivery Date</th>
                          <th className="py-3 px-6 text-center">Fuel_Ref_Price</th>
                          <th className="py-3 px-6 text-center">Backhaul</th>
                          <th className="py-3 px-6 text-right">Total QTY</th>
                          <th className="py-3 px-6 text-right">Total trip</th>
                          <th className="py-3 px-6 text-right">Charter Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {datePivot.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                            <td className="py-2.5 px-6 font-mono font-medium text-slate-900 dark:text-white">
                              {row.deliveryDate}
                            </td>
                            <td className="py-2.5 px-6 text-center font-mono text-slate-700 dark:text-slate-300">
                              {row.fuelPrice.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-6 text-center font-mono text-slate-500">
                              {row.backhaul}
                            </td>
                            <td className="py-2.5 px-6 text-right font-mono text-slate-800 dark:text-slate-200">
                              {row.qty.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-6 text-right font-mono text-slate-800 dark:text-slate-200">
                              {row.tripCount.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-6 text-right font-mono font-bold text-slate-900 dark:text-white">
                              {row.charterCost.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-950 text-white font-extrabold border-t-2 border-slate-900">
                        <tr>
                          <td className="py-3.5 px-6 text-amber-400 font-black tracking-wider text-xs">
                            GRAND TOTAL
                          </td>
                          <td className="py-3.5 px-6"></td>
                          <td className="py-3.5 px-6"></td>
                          <td className="py-3.5 px-6 text-right font-mono text-emerald-400 text-xs">
                            {datePivot.grandQty.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-6 text-right font-mono text-emerald-400 text-xs">
                            {datePivot.grandTrips.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-6 text-right font-mono text-emerald-400 text-sm font-black">
                            {datePivot.grandCost.toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SUB-VIEW 3: ALL RAW TRIPS DETAIL FOR THIS COMPANY             */}
              {/* ------------------------------------------------------------- */}
              {companySubView === 'trips' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                        รายการเที่ยวรถทั้งหมด — {selectedCompany} ({filteredCompanyTrips.length} รายการ)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        ตรวจสอบรายละเอียดทุกเที่ยว รวมถึงคนขับ ทะเบียนรถ และยอดค่าขนส่ง
                      </p>
                    </div>

                    <div className="relative max-w-xs w-full">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="ค้นหา Trip / Job / คนขับ / ปลายทาง..."
                        value={companyTripsSearch}
                        onChange={(e) => setCompanyTripsSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 font-bold sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3">วันที่</th>
                          <th className="py-2.5 px-3">Trip No</th>
                          <th className="py-2.5 px-3">Job No</th>
                          <th className="py-2.5 px-3">ประเภทรถ</th>
                          <th className="py-2.5 px-3">ทะเบียนรถ</th>
                          <th className="py-2.5 px-3">คนขับ</th>
                          <th className="py-2.5 px-3">ปลายทาง</th>
                          <th className="py-2.5 px-3 text-center">เรทน้ำมัน</th>
                          <th className="py-2.5 px-3 text-right">จำนวน QTY</th>
                          <th className="py-2.5 px-3 text-right">ค่าขนส่ง (THB)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredCompanyTrips.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                            <td className="py-2 px-3 font-mono text-[11px]">{t.issueDate}</td>
                            <td className="py-2 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {t.tripNo}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">
                              {t.jobNo}
                            </td>
                            <td className="py-2 px-3">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-semibold text-[10px]">
                                {t.truckTypeRaw || t.standardTruckType}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono">{t.truckNo || t.raw?.truckNo || '-'}</td>
                            <td className="py-2 px-3">{t.driverName || t.raw?.driverName || '-'}</td>
                            <td className="py-2 px-3 max-w-xs truncate text-[11px] text-slate-600 dark:text-slate-300">
                              {t.deliveryName || t.zoneLocationMatch}
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                              {t.dieselRate ? `฿${t.dieselRate.toFixed(2)}` : '-'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              {(Number(t.raw?.qty) || Number(t.raw?.actualQty) || 1).toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              ฿{Number(t.totalAmount || t.standardTripRate || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* B. When No Company is Selected: Show List of All Companies */
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  คลิกที่ชื่อบริษัทเพื่อดู <strong>รายงานแยกประเภทรถ & ราคาน้ำมัน (Pivot Table)</strong> รายละเอียดทั้งหมด
                </div>

                <div className="relative max-w-xs w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อบริษัท / ลูกค้า..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Companies Table */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 font-bold">
                      <tr>
                        <th className="py-3 px-4">บริษัท (Consignee / Shipper)</th>
                        <th className="py-3 px-4 text-center">จำนวนเที่ยวรวม</th>
                        <th className="py-3 px-4 text-center">จำนวน QTY รวม</th>
                        <th className="py-3 px-4 text-center">4W (คัน)</th>
                        <th className="py-3 px-4 text-center">6W (คัน)</th>
                        <th className="py-3 px-4 text-center">10W (คัน)</th>
                        <th className="py-3 px-4 text-right">ยอดค่าขนส่งรวม (THB)</th>
                        <th className="py-3 px-4 text-right">เฉลี่ย/เที่ยว (THB)</th>
                        <th className="py-3 px-4 text-center">รายงาน & สถิติ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                      {companyData.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-10 text-center text-slate-400 text-xs">
                            ไม่พบข้อมูลบริษัทตามเงื่อนไขการค้นหา
                          </td>
                        </tr>
                      ) : (
                        companyData.map((c, idx) => (
                          <tr
                            key={idx}
                            onClick={() => setSelectedCompany(c.companyName)}
                            className="hover:bg-blue-50/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer group"
                          >
                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform shrink-0" />
                              <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {c.companyName}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono font-semibold">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 font-bold">
                                {c.tripCount.toLocaleString()} เที่ยว
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono text-purple-600 dark:text-purple-400 font-semibold">
                              {c.totalQty.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono text-slate-500">{c.count4W}</td>
                            <td className="py-3.5 px-4 text-center font-mono text-slate-500">{c.count6W}</td>
                            <td className="py-3.5 px-4 text-center font-mono text-slate-500">{c.count10W}</td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                              ฿{c.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                              ฿
                              {(c.tripCount > 0 ? c.totalAmount / c.tripCount : 0).toLocaleString('th-TH', {
                                minimumFractionDigits: 0,
                              })}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCompany(c.companyName);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              >
                                <span>ดูรายงาน</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: MONTHLY REPORT                                             */}
      {/* ================================================================= */}
      {reportTab === 'monthly' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              รายงานสรุปค่าขนส่งรายเดือน (Monthly Summary Report)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              แสดงสถิติจำนวนเที่ยววิ่ง แยกตามประเภทรถ และยอดรวมค่าขนส่งในแต่ละรอบเดือน
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 font-bold">
                <tr>
                  <th className="py-2.5 px-4">รอบเดือน</th>
                  <th className="py-2.5 px-4 text-center">จำนวนเที่ยวรวม</th>
                  <th className="py-2.5 px-4 text-center">4W (คัน)</th>
                  <th className="py-2.5 px-4 text-center">6W (คัน)</th>
                  <th className="py-2.5 px-4 text-center">10W (คัน)</th>
                  <th className="py-2.5 px-4 text-right">ยอดค่าขนส่งรวม (THB)</th>
                  <th className="py-2.5 px-4 text-right">ค่าเฉลี่ยต่อเที่ยว (THB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                {monthlyData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      ไม่พบข้อมูลเที่ยวรถในระบบ
                    </td>
                  </tr>
                ) : (
                  monthlyData.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {m.monthName}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold">
                        {m.count} เที่ยว
                      </td>
                      <td className="py-3 px-4 text-center font-mono">{m.count4W}</td>
                      <td className="py-3 px-4 text-center font-mono">{m.count6W}</td>
                      <td className="py-3 px-4 text-center font-mono">{m.count10W}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        ฿{m.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        ฿{m.avgTripRate.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: PER TRUCK / DRIVER REPORT                                  */}
      {/* ================================================================= */}
      {reportTab === 'truck' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              สรุปจำนวนเที่ยววิ่ง และยอดค่าขนส่งตามทะเบียนรถและพนักงานขับรถ
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาทะเบียนรถ / คนขับ..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 font-bold">
                  <tr>
                    <th className="py-2.5 px-4">ทะเบียนรถ (Truck No.)</th>
                    <th className="py-2.5 px-4">พนักงานขับรถ (Driver)</th>
                    <th className="py-2.5 px-4 text-center">ประเภทรถ</th>
                    <th className="py-2.5 px-4 text-center">จำนวนเที่ยว</th>
                    <th className="py-2.5 px-4 text-right">ยอดค่าขนส่งรวม (THB)</th>
                    <th className="py-2.5 px-4">ปลายทางที่ส่งบ่อย</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {truckData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        ไม่พบข้อมูลรถตามเงื่อนไข
                      </td>
                    </tr>
                  ) : (
                    truckData.map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {t.truckNo}
                        </td>
                        <td className="py-3 px-4">{t.driverName}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-semibold">
                            {t.truckType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-semibold">
                          {t.tripCount} เที่ยว
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ฿{t.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                          {Array.from(t.destinations).join(', ') || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
