import React, { useState, useMemo, useEffect } from 'react';
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
  Fuel,
  Filter,
  RotateCcw,
  Scale,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CalculatedBillingTrip } from '../../types';
import { RolandPivotReportTab } from './RolandPivotReportTab';

interface ReportsPageProps {
  trips: CalculatedBillingTrip[];
  onNavigateToBilling?: () => void;
  onReDetectBranches?: () => void;
  initialSelectedCompany?: string | null;
  onLoadRolandTrips?: () => void;
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
  onLoadRolandTrips,
}) => {
  // Navigation tabs: Default to 'company' (Per Shipper / Consignee) as requested
  const [reportTab, setReportTab] = useState<'company' | 'monthly' | 'truck' | 'roland'>('company');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState<string>('ALL');

  // Selected company for drill-down report
  const [selectedCompany, setSelectedCompany] = useState<string | null>(initialSelectedCompany);
  const [companySubView, setCompanySubView] = useState<'pivot-truck' | 'pivot-date' | 'trips'>('pivot-truck');
  const [companyTripsSearch, setCompanyTripsSearch] = useState('');
  const [companyBranchFilter, setCompanyBranchFilter] = useState<string>('ALL');

  // Sync if initialSelectedCompany changes
  useEffect(() => {
    if (initialSelectedCompany) {
      setSelectedCompany(initialSelectedCompany);
      setReportTab('company');
    }
  }, [initialSelectedCompany]);

  const effectiveTrips = trips || [];

  // Branch counts across all trips
  const bangboTotalCount = useMemo(
    () => effectiveTrips.filter((t) => t.branch === 'บางบ่อ').length,
    [effectiveTrips]
  );
  const navanakornTotalCount = useMemo(
    () => effectiveTrips.filter((t) => t.branch === 'นวนคร').length,
    [effectiveTrips]
  );

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
      const comp =
        (t.consigneeShipper && t.consigneeShipper !== '-' ? t.consigneeShipper : t.pickUpName) ||
        'General Shipper';
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
      const fuelCost = Number(t.fuelSurcharge) || 0;
      const baseCost =
        Number(t.baseTripRate) ||
        Number(t.standardTripRate) ||
        (totalCost >= fuelCost ? totalCost - fuelCost : totalCost);

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
      const comp = (
        (t.consigneeShipper && t.consigneeShipper !== '-' ? t.consigneeShipper : t.pickUpName) || ''
      )
        .trim()
        .toLowerCase();
      const rawComp = (t.raw?.consigneeShipper || '').trim().toLowerCase();
      const puName = (t.pickUpName || '').trim().toLowerCase();

      const matchesCompany =
        comp === targetComp ||
        rawComp === targetComp ||
        puName === targetComp ||
        comp.includes(targetComp) ||
        targetComp.includes(comp);

      if (!matchesCompany) return false;

      if (companyBranchFilter !== 'ALL' && t.branch !== companyBranchFilter) {
        return false;
      }
      return true;
    });
  }, [effectiveTrips, selectedCompany, companyBranchFilter]);

  // Grouped by Truck Type and Fuel Ref Price (matches the requested Roland-style pivot)
  const truckFuelPivot = useMemo(() => {
    if (companyTrips.length === 0) {
      return { groups: [], grandQty: 0, grandTrips: 0, grandBase: 0, grandFuel: 0, grandCost: 0 };
    }

    const groupMap = new Map<
      string,
      Map<
        number,
        { qty: number; tripCount: number; baseAmount: number; fuelAmount: number; charterCost: number }
      >
    >();

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
        fuelPrice = 30.5;
      }

      const qty = Number(t.raw?.qty) || Number(t.raw?.actualQty) || 1;
      const cost = Number(t.totalAmount) || Number(t.standardTripRate) || Number(t.raw?.truckCharge) || 0;
      const fuel = Number(t.fuelSurcharge) || 0;
      const base =
        Number(t.baseTripRate) ||
        Number(t.standardTripRate) ||
        (cost >= fuel ? cost - fuel : cost);

      if (!groupMap.has(tType)) {
        groupMap.set(tType, new Map());
      }
      const priceMap = groupMap.get(tType)!;
      const cur = priceMap.get(fuelPrice) || {
        qty: 0,
        tripCount: 0,
        baseAmount: 0,
        fuelAmount: 0,
        charterCost: 0,
      };
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
      const fuelPrice = t.dieselRate ? Number(t.dieselRate.toFixed(2)) : 30.5;
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
      ['Generated on:', new Date().toLocaleString('th-TH')],
      [],
      [
        'Truck_Type',
        'Fuel_Ref_Price (THB/L)',
        'Total QTY',
        'Total trip',
        'Base Rate (THB)',
        'Fuel Surcharge (THB)',
        'Charter Cost (THB)',
      ],
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
      [`รายงานการวิ่งรถรายวันตามราคาอ้างอิงน้ำมัน — ${selectedCompany}`],
      ['Generated on:', new Date().toLocaleString('th-TH')],
      [],
      ['Delivery Date', 'Fuel_Ref_Price (THB/L)', 'Backhaul', 'Total QTY', 'Total trip', 'Charter Cost (THB)'],
      ...datePivot.rows.map((r) => [r.deliveryDate, r.fuelPrice, r.backhaul, r.qty, r.tripCount, r.charterCost]),
      ['GRAND TOTAL', '', '', datePivot.grandQty, datePivot.grandTrips, datePivot.grandCost],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(sheet2Rows);
    XLSX.utils.book_append_sheet(wb, ws2, 'Pivot By Date');

    // Sheet 3: All raw trips for this company
    const sheet3Rows: any[] = [
      [`รายการเที่ยวรถทั้งหมด — ${selectedCompany}`],
      ['Generated on:', new Date().toLocaleString('th-TH')],
      [],
      [
        'Issue Date',
        'Trip No',
        'Job No',
        'Branch',
        'Truck Type',
        'Truck No',
        'Driver',
        'Delivery Name',
        'Diesel Rate',
        'QTY',
        'Base Cost',
        'Fuel Surcharge',
        'Total Cost',
      ],
      ...companyTrips.map((t) => [
        t.issueDate,
        t.tripNo,
        t.jobNo,
        t.branch,
        t.truckTypeRaw || t.standardTruckType,
        t.truckNo || t.raw?.truckNo || '',
        t.driverName || t.raw?.driverName || '',
        t.deliveryName || t.zoneLocationMatch || '',
        t.dieselRate || 0,
        Number(t.raw?.qty) || Number(t.raw?.actualQty) || 1,
        t.baseTripRate || t.standardTripRate || 0,
        t.fuelSurcharge || 0,
        t.totalAmount || t.standardTripRate || 0,
      ]),
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(sheet3Rows);
    XLSX.utils.book_append_sheet(wb, ws3, 'All Trips Detail');

    const safeName = selectedCompany.replace(/[/\\?%*:|"<>]/g, '_');
    XLSX.writeFile(wb, `Fuel_Report_${safeName}.xlsx`);
  };

  const handleExportCompaniesList = () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['สรุปภาพรวมค่าขนส่งและค่าน้ำมันรายบริษัท (Per Shipper / Consignee)'],
      ['Generated on:', new Date().toLocaleString('th-TH')],
      [],
      [
        'บริษัท (Company / Shipper)',
        'สาขา (Branch)',
        'จำนวนเที่ยว (Trips)',
        'Total QTY',
        'เที่ยว 4W',
        'เที่ยว 6W',
        'เที่ยว 10W',
        'เที่ยว Trailer',
        'เรทฐาน Base Cost (THB)',
        'ค่าน้ำมัน Fuel Surcharge (THB)',
        'ยอดรวม Charter Cost (THB)',
      ],
      ...companyData.map((c) => [
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
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Companies Summary');
    XLSX.writeFile(wb, 'Company_Fuel_Summary_Report.xlsx');
  };

  const handleExportMonthly = () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['รายงานสรุปรายเดือน (Monthly Report)'],
      ['Month', 'Total Trips', '4W Trips', '6W Trips', '10W Trips', 'Total Amount (THB)', 'Avg / Trip (THB)'],
      ...monthlyData.map((m) => [
        m.monthName,
        m.count,
        m.count4W,
        m.count6W,
        m.count10W,
        m.totalAmount,
        m.avgTripRate,
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Report');
    XLSX.writeFile(wb, 'Monthly_Fuel_Report.xlsx');
  };

  const handleExportTruck = () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['รายงานสรุปรายคัน / คนขับ (Per Truck Report)'],
      ['ทะเบียนรถ', 'คนขับ', 'ประเภทรถ', 'สาขา', 'จำนวนเที่ยว', 'ยอดรวม (THB)', 'โซน / ปลายทางที่วิ่ง'],
      ...truckData.map((t) => [
        t.truckNo,
        t.driverName,
        t.truckType,
        t.branch,
        t.tripCount,
        t.totalAmount,
        Array.from(t.destinations).join(', '),
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Truck Report');
    XLSX.writeFile(wb, 'Truck_Fuel_Report.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>วิเคราะห์ค่าน้ำมันและรายงานค่าขนส่ง (Fuel Analytics)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            รายงานสถิติต้นทุนขนส่ง ค่าน้ำมันแยกประเภทรถ และตาราง Pivot คำนวนการวิ่งรถตามข้อมูลจริงในระบบ
          </p>
        </div>

        {/* Global Branch Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Global Branch Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-600">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-2 flex items-center gap-1">
              <Filter className="w-3 h-3 text-blue-500" />
              <span>สาขา:</span>
            </span>
            <button
              onClick={() => setFilterBranch('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterBranch === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              ทั้งหมด ({effectiveTrips.length})
            </button>
            <button
              onClick={() => setFilterBranch('บางบ่อ')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterBranch === 'บางบ่อ'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              บางบ่อ ({bangboTotalCount})
            </button>
            <button
              onClick={() => setFilterBranch('นวนคร')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterBranch === 'นวนคร'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              นวนคร ({navanakornTotalCount})
            </button>
          </div>

          {onReDetectBranches && (
            <button
              onClick={onReDetectBranches}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              title="ตรวจจับและปรับปรุงสาขาบางบ่อ / นวนคร ตามข้อมูลต้นทางล่าสุด"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
              <span>ปรับปรุงสาขา</span>
            </button>
          )}

          {reportTab === 'company' && !selectedCompany && (
            <button
              onClick={handleExportCompaniesList}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export สรุปทุกบริษัท</span>
            </button>
          )}

          {reportTab === 'monthly' && (
            <button
              onClick={handleExportMonthly}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (รายเดือน)</span>
            </button>
          )}

          {reportTab === 'truck' && (
            <button
              onClick={handleExportTruck}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (รายรถ)</span>
            </button>
          )}

          {onNavigateToBilling && (
            <button
              onClick={onNavigateToBilling}
              className="px-3.5 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition-colors"
            >
              ไปยังหน้าตารางค่าขนส่ง
            </button>
          )}
        </div>
      </div>

      {/* Main Report Tabs */}
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
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-mono">
            {companyData.length} บริษัท
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

        <button
          onClick={() => {
            setReportTab('roland');
            setSelectedCompany(null);
          }}
          className={`pb-3 px-5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            reportTab === 'roland'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Scale className="w-4 h-4 text-amber-500" />
          <span>Pivot Table & วิเคราะห์ยอด Roland (167 เที่ยว / ฿640,180)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold font-mono">
            Ground Truth
          </span>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setSelectedCompany(null)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>กลับไปหน้ารายชื่อบริษัท</span>
                  </button>
                  <span className="text-slate-400 text-xs">/</span>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedCompany}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Branch filter inside company drilldown */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl text-xs">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 px-2 font-medium">
                      สาขา:
                    </span>
                    {(['ALL', 'บางบ่อ', 'นวนคร'] as const).map((b) => (
                      <button
                        key={b}
                        onClick={() => setCompanyBranchFilter(b)}
                        className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          companyBranchFilter === b
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        {b === 'ALL' ? 'ทั้งหมด' : b}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleExportSelectedCompanyExcel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>ส่งออกรายงาน Excel (ตาราง Pivot)</span>
                  </button>
                </div>
              </div>

              {/* 1. Overall KPI Summary Cards for Selected Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                    <span>จำนวนเที่ยววิ่งรวม</span>
                    <Truck className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                    {truckFuelPivot.grandTrips.toLocaleString()}
                    <span className="text-xs font-normal text-slate-500 ml-1">เที่ยว</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 truncate">
                    {truckFuelPivot.groups.map((g) => `${g.truckType}: ${g.subtotalTrips}`).join(' • ')}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                    <span>ยอดจำนวนชิ้นรวม (Total QTY)</span>
                    <Package className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 font-mono">
                    {truckFuelPivot.grandQty.toLocaleString()}
                    <span className="text-xs font-normal text-slate-500 ml-1">QTY</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    ปริมาณสินค้ารวมประจำงวด
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                    <span>ยอดเรทฐานรวม (Base Cost)</span>
                    <TrendingUp className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1 font-mono">
                    ฿{truckFuelPivot.grandBase.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    ต้นทุนค่าวิ่งมาตรฐาน
                  </p>
                </div>

                {/* ราคาน้ำมันรวม แต่ละประเภท (Fuel Surcharge Highlight) */}
                <div className="bg-amber-50/60 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-xs">
                  <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 text-xs font-semibold">
                    <span>ราคาน้ำมันรวม แต่ละประเภท</span>
                    <Fuel className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
                    ฿{truckFuelPivot.grandFuel.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                  </div>
                  <div className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-1 flex flex-wrap gap-1 font-mono">
                    {truckFuelPivot.groups.map((g) => (
                      <span key={g.truckType} className="bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.2 rounded text-[10px]">
                        {g.truckType}: ฿{g.subtotalFuel.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-xs">
                  <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                    <span>ยอดค่าขนส่งรวม (Charter Cost)</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                    ฿{truckFuelPivot.grandCost.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                  </div>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-1 font-semibold">
                    Grand Total คำนวณตามข้อมูลจริง
                  </p>
                </div>
              </div>

              {/* 2. รายละเอียด แยกประเภทรถ (Breakdown by Vehicle Type Cards) */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <span>รายละเอียด แยกประเภทรถ — {selectedCompany}</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      สรุปจำนวนเที่ยววิ่ง ปริมาณชิ้น และราคาน้ำมันรวม จำแนกตามประเภทรถแต่ละประเภท
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    พบ {truckFuelPivot.groups.length} ประเภทรถที่ใช้งาน
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {truckFuelPivot.groups.map((group) => {
                    const isTrailer = group.truckType.includes('Trailer');
                    const is6W = group.truckType === '6W';
                    const is4W = group.truckType === '4W';

                    const borderColor = isTrailer
                      ? 'border-purple-200 dark:border-purple-800'
                      : is6W
                      ? 'border-blue-200 dark:border-blue-800'
                      : is4W
                      ? 'border-emerald-200 dark:border-emerald-800'
                      : 'border-amber-200 dark:border-amber-800';

                    const tagBg = isTrailer
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      : is6W
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : is4W
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';

                    const tripShare =
                      truckFuelPivot.grandTrips > 0
                        ? ((group.subtotalTrips / truckFuelPivot.grandTrips) * 100).toFixed(1)
                        : '0';

                    return (
                      <div
                        key={group.truckType}
                        className={`p-4 rounded-xl border ${borderColor} bg-slate-50/50 dark:bg-slate-750/50 space-y-2.5 transition-shadow hover:shadow-xs`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${tagBg} flex items-center gap-1.5`}>
                            <Truck className="w-3.5 h-3.5" />
                            <span>{group.truckType}</span>
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 font-semibold">
                            {tripShare}% ของเที่ยวทั้งหมด
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-700/60 text-xs">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 text-[11px]">จำนวนเที่ยววิ่ง:</span>
                            <div className="font-mono font-bold text-slate-800 dark:text-white">
                              {group.subtotalTrips.toLocaleString()} เที่ยว
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 text-[11px]">จำนวน QTY รวม:</span>
                            <div className="font-mono font-bold text-purple-600 dark:text-purple-400">
                              {group.subtotalQty.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-700/60 text-xs font-mono">
                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                            <span>เรทฐาน (Base Cost):</span>
                            <span>฿{group.subtotalBase.toLocaleString('th-TH', { minimumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-semibold">
                            <span>ราคาน้ำมันรวม (Fuel):</span>
                            <span>฿{group.subtotalFuel.toLocaleString('th-TH', { minimumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-900 dark:text-white font-black text-sm pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                            <span>ยอดรวม (Charter):</span>
                            <span className="text-blue-600 dark:text-blue-400">
                              ฿{group.subtotalCost.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Sub-view Switcher Tabs */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit">
                <button
                  onClick={() => setCompanySubView('pivot-truck')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    companySubView === 'pivot-truck'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>1. ตารางคำนวนการวิ่งรถ แต่ละประเภท (Pivot by Truck Type)</span>
                </button>

                <button
                  onClick={() => setCompanySubView('pivot-date')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    companySubView === 'pivot-date'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>2. ตารางคำนวนรายวันตามราคาน้ำมัน (Pivot by Date)</span>
                </button>

                <button
                  onClick={() => setCompanySubView('trips')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
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
              {/* SUB-VIEW 1: PIVOT BY TRUCK TYPE & FUEL PRICE (ROLAND FORMAT)  */}
              {/* ------------------------------------------------------------- */}
              {companySubView === 'pivot-truck' && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  {/* Top Header matching Roland sample format */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
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
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 rounded-full text-xs font-bold self-start sm:self-auto font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Grand Total: ฿{truckFuelPivot.grandCost.toLocaleString('th-TH', { minimumFractionDigits: 0 })} THB</span>
                    </div>
                  </div>

                  {/* Table with columns matching Roland format & fuel breakdown */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100/90 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 font-bold">
                        <tr>
                          <th className="py-3 px-5">Truck_Type</th>
                          <th className="py-3 px-5 text-center">Fuel_Ref_Price (฿/L)</th>
                          <th className="py-3 px-5 text-right">Total QTY</th>
                          <th className="py-3 px-5 text-right">Total trip</th>
                          <th className="py-3 px-5 text-right text-slate-600 dark:text-slate-400">Base Cost (THB)</th>
                          <th className="py-3 px-5 text-right text-amber-600 dark:text-amber-400">ค่าน้ำมัน Fuel Surcharge (THB)</th>
                          <th className="py-3 px-5 text-right font-extrabold text-blue-700 dark:text-blue-300">Charter Cost (THB)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {truckFuelPivot.groups.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400">
                              ไม่พบข้อมูลเที่ยวรถสำหรับบริษัทนี้ตามเงื่อนไขที่เลือก
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
                                <tr className="bg-slate-100/70 dark:bg-slate-800/80 font-bold border-y border-slate-200 dark:border-slate-700">
                                  <td className={`py-3 px-5 ${typeColor} font-bold`} colSpan={2}>
                                    รวม {group.truckType} (Subtotal)
                                  </td>
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

                      {/* Dark Grand Total Footer matching Roland sample style */}
                      {truckFuelPivot.groups.length > 0 && (
                        <tfoot className="bg-slate-950 text-white font-extrabold border-t-2 border-slate-900">
                          <tr>
                            <td className="py-3.5 px-5 text-amber-400 font-black tracking-wider text-xs" colSpan={2}>
                              GRAND TOTAL (ยอดรวมทั้งหมด)
                            </td>
                            <td className="py-3.5 px-5 text-right font-mono text-emerald-400 text-xs font-bold">
                              {truckFuelPivot.grandQty.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-5 text-right font-mono text-emerald-400 text-xs font-bold">
                              {truckFuelPivot.grandTrips.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-5 text-right font-mono text-slate-300 text-xs">
                              {truckFuelPivot.grandBase.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                            </td>
                            <td className="py-3.5 px-5 text-right font-mono text-amber-400 text-xs font-bold">
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
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
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
                        {datePivot.rows.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400">
                              ไม่พบข้อมูลรายวัน
                            </td>
                          </tr>
                        ) : (
                          datePivot.rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                              <td className="py-2.5 px-6 font-mono font-medium text-slate-800 dark:text-slate-200">
                                {row.deliveryDate}
                              </td>
                              <td className="py-2.5 px-6 text-center font-mono">{row.fuelPrice.toFixed(2)}</td>
                              <td className="py-2.5 px-6 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  row.backhaul === 'Yes'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                }`}>
                                  {row.backhaul}
                                </span>
                              </td>
                              <td className="py-2.5 px-6 text-right font-mono">{row.qty.toLocaleString()}</td>
                              <td className="py-2.5 px-6 text-right font-mono">{row.tripCount.toLocaleString()}</td>
                              <td className="py-2.5 px-6 text-right font-mono font-bold text-slate-900 dark:text-white">
                                {row.charterCost.toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {datePivot.rows.length > 0 && (
                        <tfoot className="bg-slate-900 text-white font-bold">
                          <tr>
                            <td className="py-3 px-6 text-amber-400 font-extrabold" colSpan={3}>
                              GRAND TOTAL
                            </td>
                            <td className="py-3 px-6 text-right font-mono text-emerald-400">
                              {datePivot.grandQty.toLocaleString()}
                            </td>
                            <td className="py-3 px-6 text-right font-mono text-emerald-400">
                              {datePivot.grandTrips.toLocaleString()}
                            </td>
                            <td className="py-3 px-6 text-right font-mono text-emerald-400 font-extrabold">
                              {datePivot.grandCost.toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SUB-VIEW 3: ALL RAW TRIPS FOR THIS COMPANY                    */}
              {/* ------------------------------------------------------------- */}
              {companySubView === 'trips' && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden space-y-4 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      แสดงรายการเที่ยวรถของ <strong>{selectedCompany}</strong> ทั้งหมด {filteredCompanyTrips.length} เที่ยว
                    </div>
                    <div className="relative max-w-xs w-full">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="ค้นหา Trip No, Job No, ทะเบียน, คนขับ..."
                        value={companyTripsSearch}
                        onChange={(e) => setCompanyTripsSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-600">
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
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  t.branch === 'บางบ่อ'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                }`}
                              >
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
                              ฿
                              {Number(t.totalAmount || t.standardTripRate || 0).toLocaleString('th-TH', {
                                minimumFractionDigits: 0,
                              })}
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
              {/* Search & Explanation Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>รายชื่อบริษัทลูกค้าทั้งหมด ({companyData.length} บริษัท)</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    💡 คลิกที่แถวบริษัทหรือปุ่ม <strong>"ดูรายงาน"</strong> เพื่อเปิด <strong>ตาราง Pivot คำนวนการวิ่งรถแยกประเภทรถ & ราคาน้ำมันรวม</strong>
                  </div>
                </div>

                <div className="relative max-w-xs w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อบริษัท / ลูกค้า..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Companies Table */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
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
                        <th className="py-3 px-4 text-right font-extrabold text-blue-700 dark:text-blue-300">
                          ยอดรวม (THB)
                        </th>
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
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    branchLabel === 'บางบ่อ'
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                      : branchLabel === 'ทั้ง 2 สาขา'
                                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  }`}
                                >
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
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  <span>ดูรายงาน</span>
                                  <ChevronRight className="w-3 h-3" />
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
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
                  <th className="py-3 px-4">รอบเดือน</th>
                  <th className="py-3 px-3 text-center">เที่ยวทั้งหมด</th>
                  <th className="py-3 px-3 text-center">4W</th>
                  <th className="py-3 px-3 text-center">6W</th>
                  <th className="py-3 px-3 text-center">10W</th>
                  <th className="py-3 px-4 text-right">ยอดรวมค่าขนส่ง (THB)</th>
                  <th className="py-3 px-4 text-right">เฉลี่ยต่อเที่ยว (THB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                {monthlyData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      ไม่พบข้อมูลเที่ยวรถ
                    </td>
                  </tr>
                ) : (
                  monthlyData.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span>{m.monthName}</span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold">{m.count.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center font-mono text-slate-500">{m.count4W || '-'}</td>
                      <td className="py-3 px-3 text-center font-mono text-slate-500">{m.count6W || '-'}</td>
                      <td className="py-3 px-3 text-center font-mono text-slate-500">{m.count10W || '-'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ฿{m.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
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
      {/* TAB 3: PER TRUCK REPORT                                           */}
      {/* ================================================================= */}
      {reportTab === 'truck' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                รายงานสรุปรายคัน / คนขับ (Per Truck / Driver Report)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ติดตามประสิทธิภาพและการวิ่งงานของรถแต่ละคันและพนักงานขับรถ
              </p>
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาทะเบียนรถ, คนขับ, ประเภท..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 font-bold">
                <tr>
                  <th className="py-3 px-4">ทะเบียนรถ</th>
                  <th className="py-3 px-3">คนขับ</th>
                  <th className="py-3 px-3">ประเภทรถ</th>
                  <th className="py-3 px-3 text-center">สาขา</th>
                  <th className="py-3 px-3 text-center">จำนวนเที่ยว</th>
                  <th className="py-3 px-4 text-right">ยอดรวมค่าขนส่ง (THB)</th>
                  <th className="py-3 px-4">โซน / ปลายทางที่วิ่ง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                {truckData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      ไม่พบข้อมูลรถตามเงื่อนไขการค้นหา
                    </td>
                  </tr>
                ) : (
                  truckData.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {t.truckNo}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-white">{t.driverName}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-700">
                          {t.truckType}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.branch === 'บางบ่อ'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {t.branch}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold">{t.tripCount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ฿{t.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate text-[11px]">
                        {Array.from(t.destinations).join(', ') || '-'}
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
      {/* TAB 4: ROLAND VERIFIED GROUND TRUTH & VARIANCE ANALYSIS TAB       */}
      {/* ================================================================= */}
      {reportTab === 'roland' && (
        <RolandPivotReportTab
          onLoadRolandTrips={onLoadRolandTrips}
          onNavigateToBilling={onNavigateToBilling}
        />
      )}
    </div>
  );
};
