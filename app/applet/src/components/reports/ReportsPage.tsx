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
  MapPin,
  Zap,
  Filter,
  ShieldCheck,
  Fuel,
  RotateCcw,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CalculatedBillingTrip } from '../../types';

interface ReportsPageProps {
  trips: CalculatedBillingTrip[];
  onNavigateToBilling?: () => void;
  onReDetectBranches?: () => void;
  initialSelectedCompany?: string | null;
}

interface CompanyFuelPivotItem {
  truckType: string;
  fuelPrice: number;
  qty: number;
  tripCount: number;
  baseAmount: number;
  fuelAmount: number;
  charterCost: number;
}

interface CompanyTruckGroup {
  truckType: string;
  items: CompanyFuelPivotItem[];
  subtotalQty: number;
  subtotalTrips: number;
  subtotalBase: number;
  subtotalFuel: number;
  subtotalCost: number;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  trips,
  onNavigateToBilling,
  onReDetectBranches,
  initialSelectedCompany = null,
}) => {
  // Navigation tabs: Default to 'company' (Per Shipper / Consignee) as requested
  const [reportTab, setReportTab] = useState<'company' | 'monthly' | 'truck'>('company');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState<string>('ALL');

  // Selected company for drill-down report
  const [selectedCompany, setSelectedCompany] = useState<string | null>(initialSelectedCompany);
  const [companySubView, setCompanySubView] = useState<'pivot-truck' | 'pivot-date' | 'trips'>('pivot-truck');
  const [companyTripsSearch, setCompanyTripsSearch] = useState('');
  const [companyBranchFilter, setCompanyBranchFilter] = useState<string>('ALL');

  const effectiveTrips = trips || [];

  // Branch counts across all trips
  const bangboTotalCount = useMemo(() => effectiveTrips.filter((t) => t.branch === 'บางบ่อ').length, [effectiveTrips]);
  const navanakornTotalCount = useMemo(() => effectiveTrips.filter((t) => t.branch === 'นวนคร').length, [effectiveTrips]);

  // Trips filtered by global branch selector
  const branchFilteredTrips = useMemo(() => {
    if (filterBranch === 'ALL') return effectiveTrips;
    return effectiveTrips.filter((t) => t.branch === filterBranch);
  }, [effectiveTrips, filterBranch]);

  // =====================================================================
  // 1. Monthly Report Data
  // =====================================================================
  const monthlyData = useMemo(() => {
    const map = new Map<
      string,
      { count: number; totalAmount: number; count4W: number; count6W: number; count10W: number }
    >();

    branchFilteredTrips.forEach((t) => {
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
  }, [branchFilteredTrips]);

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
        branch: string;
        tripCount: number;
        totalAmount: number;
        destinations: Set<string>;
      }
    >();

    branchFilteredTrips.forEach((t) => {
      const plate = t.raw?.truckNo || t.truckNo || 'ไม่ระบุทะเบียน';
      const cur = map.get(plate) || {
        truckNo: plate,
        driverName: t.raw?.driverName || t.driverName || '-',
        truckType: t.standardTruckType || t.truckTypeRaw || '6W',
        branch: t.branch || 'นวนคร',
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
  }, [branchFilteredTrips, filterSearch]);

  // =====================================================================
  // 3. Per Consignee / Company Report Data
  // =====================================================================
  const companyData = useMemo(() => {
    const map = new Map<
      string,
      {
        companyName: string;
        branches: Set<string>;
        tripCount: number;
        totalAmount: number;
        baseAmount: number;
        fuelAmount: number;
        count4W: number;
        count6W: number;
        count10W: number;
        countTrailer: number;
        totalQty: number;
      }
    >();

    branchFilteredTrips.forEach((t) => {
      const comp = (t.consigneeShipper && t.consigneeShipper !== '-' ? t.consigneeShipper : t.pickUpName) || 'General Shipper';
      const cur = map.get(comp) || {
        companyName: comp,
        branches: new Set<string>(),
        tripCount: 0,
        totalAmount: 0,
        baseAmount: 0,
        fuelAmount: 0,
        count4W: 0,
        count6W: 0,
        count10W: 0,
        countTrailer: 0,
        totalQty: 0,
      };

      if (t.branch) cur.branches.add(t.branch);

      const qty = Number(t.raw?.qty) || Number(t.raw?.actualQty) || 1;
      const totalCost = Number(t.totalAmount) || Number(t.standardTripRate) || 0;
      const baseCost = Number(t.standardTripRate) || Number(t.fuelResult?.baseRate) || totalCost;
      const fuelCost = Number(t.fuelResult?.fuelSurchargeAmount) || Number(t.dieselAmount) || 0;

      cur.tripCount += 1;
      cur.totalAmount += totalCost;
      cur.baseAmount += baseCost;
      cur.fuelAmount += fuelCost;
      cur.totalQty += qty;

      const tType = (t.truckTypeRaw || t.standardTruckType || '').toUpperCase();
      if (tType.includes('TRAILER') || tType.includes('เทรลเลอร์')) cur.countTrailer += 1;
      else if (tType.includes('4W') || tType.includes('4 ล้อ')) cur.count4W += 1;
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
  }, [branchFilteredTrips, filterSearch]);

  // =====================================================================
  // 4. Drill-down Calculations for Selected Company
  // =====================================================================
  const companyTrips = useMemo(() => {
    if (!selectedCompany) return [];
    const targetComp = selectedCompany.trim().toLowerCase();

    return effectiveTrips.filter((t) => {
      const comp = ((t.consigneeShipper && t.consigneeShipper !== '-' ? t.consigneeShipper : t.pickUpName) || '').trim().toLowerCase();
      const rawComp = (t.raw?.consigneeShipper || '').trim().toLowerCase();
      const puName = (t.pickUpName || '').trim().toLowerCase();

      const matchesCompany = comp === targetComp || rawComp === targetComp || puName === targetComp || comp.includes(targetComp) || targetComp.includes(comp);
      if (!matchesCompany) return false;

      if (companyBranchFilter !== 'ALL' && t.branch !== companyBranchFilter) {
        return false;
      }
      return true;
    });
  }, [effectiveTrips, selectedCompany, companyBranchFilter]);

  // Grouped by Truck Type and Fuel Ref Price (matches requested format)
  const truckFuelPivot = useMemo(() => {
    if (companyTrips.length === 0) {
      return { groups: [], grandQty: 0, grandTrips: 0, grandBase: 0, grandFuel: 0, grandCost: 0 };
    }

    const groupMap = new Map<string, Map<number, { qty: number; tripCount: number; baseAmount: number; fuelAmount: number; charterCost: number }>>();

    companyTrips.forEach((t) => {
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

      let fuelPrice = 0;
      if (t.dieselRate && t.dieselRate > 0) {
        fuelPrice = Number(t.dieselRate.toFixed(2));
      } else if ((t.raw as any)?.dieselRate && Number((t.raw as any).dieselRate) > 0) {
        fuelPrice = Number(Number((t.raw as any).dieselRate).toFixed(2));
      } else {
        fuelPrice = 30.50;
      }

      const qty = Number(t.raw?.qty) || Number(t.raw?.actualQty) || 1;
      const cost = Number(t.totalAmount) || Number(t.standardTripRate) || Number(t.raw?.truckCharge) || 0;
      const base = Number(t.standardTripRate) || Number(t.fuelResult?.baseRate) || cost;
      const fuel = Number(t.fuelResult?.fuelSurchargeAmount) || Number(t.dieselAmount) || 0;

      if (!groupMap.has(tType)) {
        groupMap.set(tType, new Map());
      }
      const priceMap = groupMap.get(tType)!;
      const cur = priceMap.get(fuelPrice) || { qty: 0, tripCount: 0, baseAmount: 0, fuelAmount: 0, charterCost: 0 };
      cur.qty += qty;
      cur.tripCount += 1;
      cur.baseAmount += base;
      cur.fuelAmount += fuel;
      cur.charterCost += cost;
      priceMap.set(fuelPrice, cur);
    });

    let grandQty = 0;
    let grandTrips = 0;
    let grandBase = 0;
    let grandFuel = 0;
    let grandCost = 0;

    const groups: CompanyTruckGroup[] = [];

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
      let subBase = 0;
      let subFuel = 0;
      let subCost = 0;

      const rows: CompanyFuelPivotItem[] = sortedPrices.map((price) => {
        const val = priceMap.get(price)!;
        subQty += val.qty;
        subTrips += val.tripCount;
        subBase += val.baseAmount;
        subFuel += val.fuelAmount;
        subCost += val.charterCost;
        return {
          truckType: tType,
          fuelPrice: price,
          qty: val.qty,
          tripCount: val.tripCount,
          baseAmount: val.baseAmount,
          fuelAmount: val.fuelAmount,
          charterCost: val.charterCost,
        };
      });

      grandQty += subQty;
      grandTrips += subTrips;
      grandBase += subBase;
      grandFuel += subFuel;
      grandCost += subCost;

      groups.push({
        truckType: tType,
        items: rows,
        subtotalQty: subQty,
        subtotalTrips: subTrips,
        subtotalBase: subBase,
        subtotalFuel: subFuel,
        subtotalCost: subCost,
      });
    });

    return { groups, grandQty, grandTrips, grandBase, grandFuel, grandCost };
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
      const fuelPrice = t.dieselRate ? Number(t.dieselRate.toFixed(2)) : 30.50;
      const qty = Number(t.raw?.qty) || Number(t.raw?.actualQty) || 1;
      const cost = Number(t.totalAmount) || Number(t.standardTripRate) || 0;
      const backhaul = t.backhaul || t.raw?.backhaul || 'No';

      const key = `${date}__${fuelPrice}__${backhaul}`;
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

    let grandQty = 0;
    let grandTrips = 0;
    let grandCost = 0;

    const rows = Array.from(map.values()).sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate));
    rows.forEach((r) => {
      grandQty += r.qty;
      grandTrips += r.tripCount;
      grandCost += r.charterCost;
    });

    return { rows, grandQty, grandTrips, grandCost };
  }, [companyTrips]);

  // Filtered raw trips for this company
  const filteredCompanyTrips = useMemo(() => {
    if (!companyTripsSearch) return companyTrips;
    const q = companyTripsSearch.toLowerCase();
    return companyTrips.filter(
      (t) =>
        t.tripNo.toLowerCase().includes(q) ||
        t.jobNo.toLowerCase().includes(q) ||
        (t.driverName && t.driverName.toLowerCase().includes(q)) ||
        (t.truckNo && t.truckNo.toLowerCase().includes(q)) ||
        (t.deliveryName && t.deliveryName.toLowerCase().includes(q)) ||
        (t.zoneLocationMatch && t.zoneLocationMatch.toLowerCase().includes(q))
    );
  }, [companyTrips, companyTripsSearch]);

  // =====================================================================
  // Excel Export Handlers
  // =====================================================================
  const handleExportSelectedCompanyExcel = () => {
    if (!selectedCompany) return;
    const wb = XLSX.utils.book_new();

    // Sheet 1: Truck Type Pivot
    const sheet1Rows: any[] = [
      [`รายงานการวิ่งรถและค่าน้ำมันแยกตามประเภทรถ — ${selectedCompany}`],
      ['Truck_Type', 'Fuel_Ref_Price (THB/L)', 'Total QTY', 'Total trip', 'Base Rate (THB)', 'Fuel Surcharge (THB)', 'Charter Cost (THB)'],
    ];

    truckFuelPivot.groups.forEach((g) => {
      g.items.forEach((item, idx) => {
        sheet1Rows.push([
          idx === 0 ? g.truckType : '',
          item.fuelPrice,
          item.qty,
          item.tripCount,
          item.baseAmount,
          item.fuelAmount,
          item.charterCost,
        ]);
      });
      sheet1Rows.push([
        `รวม ${g.truckType} (Subtotal)`,
        '',
        g.subtotalQty,
        g.subtotalTrips,
        g.subtotalBase,
        g.subtotalFuel,
        g.subtotalCost,
      ]);
    });

    sheet1Rows.push([
      'GRAND TOTAL',
      '',
      truckFuelPivot.grandQty,
      truckFuelPivot.grandTrips,
      truckFuelPivot.grandBase,
      truckFuelPivot.grandFuel,
      truckFuelPivot.grandCost,
    ]);

    const ws1 = XLSX.utils.aoa_to_sheet(sheet1Rows);
    XLSX.utils.book_append_sheet(wb, ws1, 'Pivot By Truck Type');

    // Sheet 2: Daily Delivery Pivot
    const sheet2Rows: any[] = [
      [`รายงานรายวันและราคาอ้างอิงน้ำมัน — ${selectedCompany}`],
      ['Delivery Date', 'Fuel_Ref_Price (THB/L)', 'Backhaul', 'Total QTY', 'Total trip', 'Charter Cost (THB)'],
    ];
    datePivot.rows.forEach((r) => {
      sheet2Rows.push([r.deliveryDate, r.fuelPrice, r.backhaul, r.qty, r.tripCount, r.charterCost]);
    });
    sheet2Rows.push(['GRAND TOTAL', '', '', datePivot.grandQty, datePivot.grandTrips, datePivot.grandCost]);

    const ws2 = XLSX.utils.aoa_to_sheet(sheet2Rows);
    XLSX.utils.book_append_sheet(wb, ws2, 'Pivot By Date');

    // Sheet 3: Individual Trips
    const sheet3Rows: any[] = [
      [
        'วันที่',
        'Trip No',
        'Job No',
        'สาขา',
        'ประเภทรถ',
        'ทะเบียนรถ',
        'พนักงานขับรถ',
        'สถานที่จัดส่ง',
        'ราคาดีเซลอ้างอิง',
        'QTY',
        'ค่าขนส่ง (THB)',
      ],
    ];
    companyTrips.forEach((t) => {
      sheet3Rows.push([
        t.issueDate,
        t.tripNo,
        t.jobNo,
        t.branch || 'นวนคร',
        t.truckTypeRaw || t.standardTruckType,
        t.truckNo || t.raw?.truckNo || '-',
        t.driverName || t.raw?.driverName || '-',
        t.deliveryName || t.zoneLocationMatch || '',
        t.dieselRate ? t.dieselRate.toFixed(2) : '',
        Number(t.raw?.qty) || Number(t.raw?.actualQty) || 1,
        Number(t.totalAmount || t.standardTripRate || 0),
      ]);
    });
    const ws3 = XLSX.utils.aoa_to_sheet(sheet3Rows);
    XLSX.utils.book_append_sheet(wb, ws3, 'Trip Details');

    const cleanName = selectedCompany.replace(/[^a-zA-Z0-9_\u0E00-\u0E7F]/g, '_');
    XLSX.writeFile(wb, `Fuel_Report_${cleanName}.xlsx`);
  };

  const handleExportMonthly = () => {
    const rows = monthlyData.map((m) => [
      m.monthName,
      m.count,
      m.count4W,
      m.count6W,
      m.count10W,
      m.totalAmount,
      m.avgTripRate.toFixed(2),
    ]);
    const headers = ['รอบเดือน', 'จำนวนเที่ยวรวม', '4W (คัน)', '6W (คัน)', '10W (คัน)', 'ยอดรวม (THB)', 'เฉลี่ย/เที่ยว (THB)'];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Report');
    XLSX.writeFile(wb, 'Monthly_Transportation_Billing_Report.xlsx');
  };

  const handleExportTruck = () => {
    const rows = truckData.map((t) => [
      t.truckNo,
      t.driverName,
      t.truckType,
      t.branch,
      t.tripCount,
      t.totalAmount,
      Array.from(t.destinations).join(', '),
    ]);
    const headers = [
      'ทะเบียนรถ',
      'ชื่อพนักงานขับรถ',
      'ประเภทรถ',
      'สาขา',
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
      Array.from(c.branches).join(', ') || 'นวนคร',
      c.tripCount,
      c.totalQty,
      c.count4W,
      c.count6W,
      c.count10W,
      c.countTrailer,
      c.baseAmount,
      c.fuelAmount,
      c.totalAmount,
      c.tripCount > 0 ? (c.totalAmount / c.tripCount).toFixed(2) : '0',
    ]);
    const headers = [
      'บริษัท (Consignee/Shipper)',
      'สาขาที่วิ่ง',
      'จำนวนเที่ยวรวม',
      'จำนวน QTY รวม',
      'เที่ยว 4W',
      'เที่ยว 6W',
      'เที่ยว 10W',
      'เที่ยว Trailer',
      'ค่าเรทฐานรวม (THB)',
      'ค่าน้ำมันส่วนเพิ่มรวม (THB)',
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
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              FUEL ANALYTICS & PIVOT REPORTS
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              บางบ่อ: {bangboTotalCount.toLocaleString()} เที่ยว | นวนคร: {navanakornTotalCount.toLocaleString()} เที่ยว
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            วิเคราะห์ค่าน้ำมันและสถิติการขนส่ง (Fuel Analytics & Pivot Reports)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            รายงานวิเคราะห์ค่าน้ำมันรายบริษัทแยกตามประเภทรถ, รายงานรายเดือน และรายงานรายรถ/คนขับ (รองรับทั้ง 2 สาขา)
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {onReDetectBranches && (
            <button
              onClick={onReDetectBranches}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="ตรวจจับและแยกข้อมูลเป็น 2 สาขา (บางบ่อ / นวนคร) อัตโนมัติตามข้อมูลจริงในไฟล์"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>ตรวจจับแยก 2 สาขา</span>
            </button>
          )}

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
              className="px-3.5 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              ไปยังหน้าตารางค่าขนส่ง
            </button>
          )}
        </div>
      </div>

      {/* Global Branch Filter Selector */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-700 dark:text-slate-200">ตัวกรองสาขา:</span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg">
            <button
              onClick={() => setFilterBranch('ALL')}
              className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all cursor-pointer ${
                filterBranch === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              ทุกสาขา ({effectiveTrips.length.toLocaleString()} เที่ยว)
            </button>
            <button
              onClick={() => setFilterBranch('บางบ่อ')}
              className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all cursor-pointer ${
                filterBranch === 'บางบ่อ'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              สาขาบางบ่อ ({bangboTotalCount.toLocaleString()} เที่ยว)
            </button>
            <button
              onClick={() => setFilterBranch('นวนคร')}
              className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all cursor-pointer ${
                filterBranch === 'นวนคร'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              สาขานวนคร ({navanakornTotalCount.toLocaleString()} เที่ยว)
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          แสดงข้อมูล {branchFilteredTrips.length.toLocaleString()} จาก {effectiveTrips.length.toLocaleString()} เที่ยว
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

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg text-[11px]">
                    <span className="px-2 font-medium text-slate-500 dark:text-slate-400">สาขา:</span>
                    <button
                      onClick={() => setCompanyBranchFilter('ALL')}
                      className={`px-2 py-1 rounded font-bold transition-all cursor-pointer ${
                        companyBranchFilter === 'ALL'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      ทั้งหมด
                    </button>
                    <button
                      onClick={() => setCompanyBranchFilter('บางบ่อ')}
                      className={`px-2 py-1 rounded font-bold transition-all cursor-pointer ${
                        companyBranchFilter === 'บางบ่อ'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      บางบ่อ
                    </button>
                    <button
                      onClick={() => setCompanyBranchFilter('นวนคร')}
                      className={`px-2 py-1 rounded font-bold transition-all cursor-pointer ${
                        companyBranchFilter === 'นวนคร'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      นวนคร
                    </button>
                  </div>

                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    พบ <strong className="text-slate-800 dark:text-white font-mono">{companyTrips.length.toLocaleString()}</strong> เที่ยว
                  </span>
                </div>
              </div>

              {/* KPI Summary Cards for Selected Company */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
                    <span>จำนวนเที่ยวทั้งหมด</span>
                    <Truck className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {companyTrips.length.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">เที่ยวขนส่ง</div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
                    <span>จำนวน QTY รวม</span>
                    <Package className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
                    {truckFuelPivot.grandQty.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">ชิ้น / พาเลท</div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
                    <span>ค่าน้ำมันรวมแต่ละประเภท</span>
                    <Fuel className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
                    ฿{truckFuelPivot.grandFuel.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">บาท (Fuel Surcharge)</div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
                    <span>ยอดค่าขนส่งรวม (Charter Cost)</span>
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                    ฿{truckFuelPivot.grandCost.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">บาท (Grand Total)</div>
                </div>
              </div>

              {/* Sub-view switcher for this company */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
                <button
                  onClick={() => setCompanySubView('pivot-truck')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    companySubView === 'pivot-truck'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>1. ตารางคำนวนแยกตามประเภทรถ (Pivot by Truck Type & Fuel)</span>
                </button>

                <button
                  onClick={() => setCompanySubView('pivot-date')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    companySubView === 'pivot-date'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>2. ตารางรายวันตามราคาน้ำมัน (Pivot by Date)</span>
                </button>

                <button
                  onClick={() => setCompanySubView('trips')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    companySubView === 'trips'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>3. รายการเที่ยวรถทั้งหมด ({companyTrips.length} เที่ยว)</span>
                </button>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SUB-VIEW 1: PIVOT BY TRUCK TYPE & FUEL PRICE (MATCHES ROLAND) */}
              {/* ------------------------------------------------------------- */}
              {companySubView === 'pivot-truck' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  {/* Top Header matching user's requested layout */}
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
                          จำแนกตามประเภทรถ (Truck_Type) และราคาอ้างอิงน้ำมันรายวัน (Fuel_Ref_Price) คำนวณจากข้อมูลจริง
                        </p>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 rounded-full text-xs font-bold self-start sm:self-auto">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Grand Total: ฿{truckFuelPivot.grandCost.toLocaleString('th-TH', { minimumFractionDigits: 0 })} THB</span>
                    </div>
                  </div>

                  {/* Table matching user's format exactly */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 font-bold">
                        <tr>
                          <th className="py-3 px-5">Truck_Type</th>
                          <th className="py-3 px-5 text-center">Fuel_Ref_Price (฿/L)</th>
                          <th className="py-3 px-5 text-right">Total QTY</th>
                          <th className="py-3 px-5 text-right">Total trip</th>
                          <th className="py-3 px-5 text-right text-slate-600 dark:text-slate-400">Base Cost (THB)</th>
                          <th className="py-3 px-5 text-right text-amber-600 dark:text-amber-400">Fuel Surcharge (THB)</th>
                          <th className="py-3 px-5 text-right font-extrabold text-blue-700 dark:text-blue-300">Charter Cost (THB)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {truckFuelPivot.groups.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400">
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
                                    <td className={`py-2.5 px-5 font-bold ${typeColor}`}>
                                      {rIdx === 0 ? group.truckType : ''}
                                    </td>
                                    <td className="py-2.5 px-5 text-center font-mono text-slate-700 dark:text-slate-300">
                                      {row.fuelPrice.toFixed(2)}
                                    </td>
                                    <td className="py-2.5 px-5 text-right font-mono text-slate-800 dark:text-slate-200">
                                      {row.qty.toLocaleString()}
                                    </td>
                                    <td className="py-2.5 px-5 text-right font-mono text-slate-800 dark:text-slate-200">
                                      {row.tripCount.toLocaleString()}
                                    </td>
                                    <td className="py-2.5 px-5 text-right font-mono text-slate-600 dark:text-slate-400">
                                      {row.baseAmount.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                                    </td>
                                    <td className="py-2.5 px-5 text-right font-mono text-amber-600 dark:text-amber-400 font-semibold">
                                      {row.fuelAmount.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                                    </td>
                                    <td className="py-2.5 px-5 text-right font-mono font-bold text-slate-900 dark:text-white">
                                      {row.charterCost.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                                    </td>
                                  </tr>
                                ))}

                                {/* Subtotal row per truck type */}
                                <tr className="bg-slate-50/80 dark:bg-slate-800/80 font-bold border-y border-slate-200 dark:border-slate-700">
                                  <td className={`py-3 px-5 ${typeColor} font-bold`}>
                                    รวม {group.truckType} (Subtotal)
                                  </td>
                                  <td className="py-3 px-5"></td>
                                  <td className="py-3 px-5 text-right font-mono text-slate-900 dark:text-white">
                                    {group.subtotalQty.toLocaleString()}
                                  </td>
                                  <td className="py-3 px-5 text-right font-mono text-slate-900 dark:text-white">
                                    {group.subtotalTrips.toLocaleString()}
                                  </td>
                                  <td className="py-3 px-5 text-right font-mono text-slate-600 dark:text-slate-400">
                                    {group.subtotalBase.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                                  </td>
                                  <td className="py-3 px-5 text-right font-mono text-amber-600 dark:text-amber-400 font-bold">
                                    {group.subtotalFuel.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                                  </td>
                                  <td className={`py-3 px-5 text-right font-mono font-bold ${typeColor}`}>
                                    {group.subtotalCost.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
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
                            <td className="py-3.5 px-5 text-amber-400 font-black tracking-wider text-xs">
                              GRAND TOTAL
                            </td>
                            <td className="py-3.5 px-5"></td>
                            <td className="py-3.5 px-5 text-right font-mono text-emerald-400 text-xs">
                              {truckFuelPivot.grandQty.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-5 text-right font-mono text-emerald-400 text-xs">
                              {truckFuelPivot.grandTrips.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-5 text-right font-mono text-slate-300 text-xs">
                              {truckFuelPivot.grandBase.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                            </td>
                            <td className="py-3.5 px-5 text-right font-mono text-amber-300 text-xs font-bold">
                              {truckFuelPivot.grandFuel.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                            </td>
                            <td className="py-3.5 px-5 text-right font-mono text-emerald-400 text-sm font-black">
                              ฿{truckFuelPivot.grandCost.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
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
                          <th className="py-3 px-6 text-center">Fuel_Ref_Price (฿/L)</th>
                          <th className="py-3 px-6 text-center">Backhaul</th>
                          <th className="py-3 px-6 text-right">Total QTY</th>
                          <th className="py-3 px-6 text-right">Total trip</th>
                          <th className="py-3 px-6 text-right">Charter Cost (THB)</th>
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
                              {row.charterCost.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
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
                            ฿{datePivot.grandCost.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
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
                        ตรวจสอบรายละเอียดทุกเที่ยว รวมถึงสาขา คนขับ ทะเบียนรถ และยอดค่าขนส่ง
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
                          <th className="py-2.5 px-3 text-center">สาขา</th>
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
                            <td className="py-2 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.branch === 'บางบ่อ'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              }`}>
                                {t.branch || 'นวนคร'}
                              </span>
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
                              ฿{Number(t.totalAmount || t.standardTripRate || 0).toLocaleString('th-TH', { minimumFractionDigits: 0 })}
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
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>รายชื่อบริษัทลูกค้าทั้งหมด ({companyData.length} บริษัท)</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    คลิกที่ชื่อบริษัทหรือปุ่ม <strong>"ดูรายงาน"</strong> เพื่อเปิด <strong>ตาราง Pivot คำนวนการวิ่งรถแยกประเภทรถ & ราคาน้ำมัน</strong>
                  </div>
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
                        <th className="py-3 px-3 text-center">สาขา</th>
                        <th className="py-3 px-3 text-center">จำนวนเที่ยว</th>
                        <th className="py-3 px-3 text-center">QTY รวม</th>
                        <th className="py-3 px-3 text-center">4W</th>
                        <th className="py-3 px-3 text-center">6W</th>
                        <th className="py-3 px-3 text-center">10W</th>
                        <th className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">เรทฐาน (THB)</th>
                        <th className="py-3 px-4 text-right text-amber-600 dark:text-amber-400">ค่าน้ำมัน (THB)</th>
                        <th className="py-3 px-4 text-right font-extrabold text-blue-700 dark:text-blue-300">ยอดรวม (THB)</th>
                        <th className="py-3 px-4 text-center">รายงาน Pivot & สถิติ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                      {companyData.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-10 text-center text-slate-400 text-xs">
                            ไม่พบข้อมูลบริษัทตามเงื่อนไขการค้นหา
                          </td>
                        </tr>
                      ) : (
                        companyData.map((c, idx) => {
                          const branchesArr = Array.from(c.branches);
                          const branchLabel =
                            branchesArr.length > 1
                              ? 'ทั้ง 2 สาขา'
                              : branchesArr[0] || 'นวนคร';

                          return (
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
                              <td className="py-3.5 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  branchLabel === 'บางบ่อ'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : branchLabel === 'ทั้ง 2 สาขา'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                }`}>
                                  {branchLabel}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-center font-mono font-semibold">
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 font-bold">
                                  {c.tripCount.toLocaleString()}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-center font-mono text-purple-600 dark:text-purple-400 font-semibold">
                                {c.totalQty.toLocaleString()}
                              </td>
                              <td className="py-3.5 px-3 text-center font-mono text-slate-500">{c.count4W || '-'}</td>
                              <td className="py-3.5 px-3 text-center font-mono text-slate-500">{c.count6W || '-'}</td>
                              <td className="py-3.5 px-3 text-center font-mono text-slate-500">{c.count10W || '-'}</td>
                              <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                                ฿{c.baseAmount.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono text-amber-600 dark:text-amber-400 font-semibold">
                                ฿{c.fuelAmount.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                ฿{c.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
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
                          );
                        })
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
              แสดงสถิติจำนวนเที่ยววิ่ง แยกตามประเภทรถ และยอดรวมค่าขนส่งในแต่ละรอบเดือน (ตามตัวกรองสาขาที่เลือก)
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
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                รายงานสรุปรายทะเบียนรถ & พนักงานขับรถ (Per Truck / Driver)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                สถิติจำนวนเที่ยววิ่ง ยอดค่าขนส่งรวม และสถานที่ปลายทางที่จัดส่ง
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหา ทะเบียนรถ / ชื่อคนขับ..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 font-bold">
                <tr>
                  <th className="py-3 px-4">ทะเบียนรถ</th>
                  <th className="py-3 px-4">ชื่อพนักงานขับรถ</th>
                  <th className="py-3 px-4">ประเภทรถ</th>
                  <th className="py-3 px-4 text-center">สาขา</th>
                  <th className="py-3 px-4 text-center">จำนวนเที่ยว</th>
                  <th className="py-3 px-4 text-right">ยอดค่าขนส่งรวม (THB)</th>
                  <th className="py-3 px-4">ปลายทางที่จัดส่งหลัก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                {truckData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      ไม่พบข้อมูลรถขนส่งตามเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  truckData.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {t.truckNo}
                      </td>
                      <td className="py-2.5 px-4 font-medium">{t.driverName}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-bold">
                          {t.truckType}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.branch === 'บางบ่อ'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {t.branch || 'นวนคร'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-semibold">
                        {t.tripCount} เที่ยว
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ฿{t.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                      </td>
                      <td className="py-2.5 px-4 max-w-xs truncate text-[11px] text-slate-500">
                        {Array.from(t.destinations).slice(0, 3).join(', ') || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
