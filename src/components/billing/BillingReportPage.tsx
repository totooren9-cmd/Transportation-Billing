import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Cloud,
  Search,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Truck,
  ChevronLeft,
  ChevronRight,
  Zap,
  HelpCircle,
  Edit2,
  Save,
  SlidersHorizontal,
  Plus,
  Trash2,
  Sparkles,
  X,
  Scale,
  DownloadCloud,
  Database,
  Building2,
  Fuel,
  UserCheck,
  ShieldCheck,
  MapPin,
  Car,
} from 'lucide-react';
import {
  CalculatedBillingTrip,
  BillingReportSummary,
  StandardTruckType,
  TruckSummary,
  RawTripData,
  DiffStatus,
  CustomerFuelCycle,
  FixedDieselCustomer,
  DieselPriceRecord,
  CustomerRateConfig,
} from '../../types';
import { exportBillingReportExcel, downloadRawData69TemplateExcel } from '../../services/excelService';
import { computeBillingSummary } from '../../services/billingCalculator';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { RATE_CARD_BRACKETS } from '../../data/seedData';
import { ConditionFuelCycleModal } from '../common/ConditionFuelCycleModal';

interface BillingReportPageProps {
  trips: CalculatedBillingTrip[];
  summary: BillingReportSummary;
  onOpenGoogleDriveModal: () => void;
  isDriveConnected: boolean;
  onGoogleSignIn: () => void;
  selectedBracket: string;
  onSelectBracket: (key: string) => void;
  onAutoResolveAll: () => void;
  onUpdateTripRate: (tripId: string, newRate: number) => void;
  onAddNewTrip?: (trip: RawTripData) => void;
  onDeleteTrip?: (tripId: string, mode?: 'soft' | 'hard') => void;
  onDeleteTripsBulk?: (tripIds: string[], mode?: 'soft' | 'hard') => void;
  onSimulateFullMonthTrips?: () => void;
  onResetToSeedData?: () => void;
  onOpenQuotationUpload?: () => void;
  dieselMethod?: 'monthly_avg' | 'daily_spot';
  onSelectDieselMethod?: (method: 'monthly_avg' | 'daily_spot') => void;
  onClearTrips?: () => void;
  onNavigateToReconciliation?: () => void;
  onMapAllShippingQuotations100?: () => void;
  onLoad20StandardTrips?: () => void;
  onFetchAllFromDatabase?: () => void;
  isFetchingDatabase?: boolean;
  fuelCycles?: CustomerFuelCycle[];
  onUpdateFuelCycles?: (cycles: CustomerFuelCycle[]) => void;
  fixedCustomers?: FixedDieselCustomer[];
  onUpdateFixedCustomers?: (customers: FixedDieselCustomer[]) => void;
  customerRateConfigs?: CustomerRateConfig[];
  onUpdateCustomerRateConfigs?: (configs: CustomerRateConfig[]) => void;
  dieselPrices?: DieselPriceRecord[];
  onReDetectBranches?: () => void;
}

export const BillingReportPage: React.FC<BillingReportPageProps> = ({
  trips,
  summary,
  onOpenGoogleDriveModal,
  isDriveConnected,
  onGoogleSignIn,
  selectedBracket,
  onSelectBracket,
  onAutoResolveAll,
  onUpdateTripRate,
  onAddNewTrip,
  onDeleteTrip,
  onDeleteTripsBulk,
  onSimulateFullMonthTrips,
  onResetToSeedData,
  onOpenQuotationUpload,
  dieselMethod = 'monthly_avg',
  onSelectDieselMethod,
  onClearTrips,
  onNavigateToReconciliation,
  onMapAllShippingQuotations100,
  onLoad20StandardTrips,
  onFetchAllFromDatabase,
  isFetchingDatabase = false,
  fuelCycles = [],
  onUpdateFuelCycles = () => {},
  fixedCustomers = [],
  onUpdateFixedCustomers = () => {},
  customerRateConfigs = [],
  onUpdateCustomerRateConfigs,
  dieselPrices = [],
  onReDetectBranches,
}) => {
  // Checkbox selection state for Bulk Operations
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);

  // Condition & Fuel Cycle Modal state
  const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);

  // Delete Confirm Modal State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    isBulk: boolean;
    tripIds: string[];
    itemName?: string;
    filterDescription?: string;
  }>({
    isOpen: false,
    isBulk: false,
    tripIds: [],
  });

  // Filters
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCompany, setFilterCompany] = useState('ALL');
  const [filterBranch, setFilterBranch] = useState('ALL');
  const [filterTruckType, setFilterTruckType] = useState<string>('ALL');
  const [filterODType, setFilterODType] = useState('ALL');
  const [filterTruckNo, setFilterTruckNo] = useState('ALL');
  const [filterDriver, setFilterDriver] = useState('ALL');
  const [filterContractType, setFilterContractType] = useState<'ALL' | 'fixed_diesel' | 'quotation'>('ALL');
  const [filterFuelCycle, setFilterFuelCycle] = useState<string>('ALL');
  const [filterDiff, setFilterDiff] = useState<'ALL' | 'Match' | 'MinorDiff' | 'MajorDiff'>('ALL');
  const [filterZone, setFilterZone] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Inline Rate Editing
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [editRateValue, setEditRateValue] = useState<string>('');

  // Add Trip Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newJobNo, setNewJobNo] = useState('');
  const [newTripNo, setNewTripNo] = useState('');
  const [newIssueDate, setNewIssueDate] = useState(() => {
    const today = new Date();
    return `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
  });
  const [newCompany, setNewCompany] = useState('AJITRADE (THAILAND) CO.,LTD.');
  const [newDelivName, setNewDelivName] = useState('');
  const [newDelivDistrict, setNewDelivDistrict] = useState('ศรีมหาโพธิ');
  const [newDelivProvince, setNewDelivProvince] = useState('ปราจีนบุรี');
  const [newTruckType, setNewTruckType] = useState('4W/Single Unit');
  const [newStandardRate, setNewStandardRate] = useState('3280');

  const handleSaveNewTrip = () => {
    if (!newJobNo.trim()) return;
    const rateVal = parseFloat(newStandardRate) || 0;
    const newTripRaw: RawTripData = {
      id: `trip-manual-${Date.now()}`,
      issueDate: newIssueDate,
      jobNo: newJobNo.trim(),
      tripNo: newTripNo.trim() || `TRP-MANUAL-${Date.now().toString().slice(-5)}`,
      consigneeShipper: newCompany.trim(),
      pickUpName: 'YUSEN LOGISTICS (THAILAND) CO.,LTD (NLC)',
      pickUpDistrict: 'คลองหลวง',
      pickUpProvince: 'ปทุมธานี',
      deliveryName: newDelivName.trim() || 'สถานที่จัดส่ง',
      deliveryDistrict: newDelivDistrict.trim(),
      deliveryProvince: newDelivProvince.trim(),
      deliveryZone: newDelivDistrict.trim(),
      truckType: newTruckType,
      tripStatus: 'FinishTrip',
      haulType: 'Direct',
      backhaul: 'No',
    };

    if (onAddNewTrip) {
      onAddNewTrip(newTripRaw);
    }
    if (rateVal > 0) {
      onUpdateTripRate(newTripRaw.id, rateVal);
    }

    setIsAddModalOpen(false);
    setNewJobNo('');
    setNewTripNo('');
    setNewDelivName('');
  };

  // Pagination (Supports viewing all items across all branches without pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [summaryViewTab, setSummaryViewTab] = useState<'truck' | 'vehicle' | 'customer' | 'branch' | 'zone'>('truck');

  // Options
  const companyOptions = useMemo(() => {
    return ['ALL', ...new Set(trips.map((t) => t.consigneeShipper).filter(Boolean))];
  }, [trips]);

  const branchOptions = useMemo(() => {
    const set = new Set(trips.map((t) => t.branch).filter(Boolean));
    set.add('บางบ่อ');
    set.add('นวนคร');
    return ['ALL', ...Array.from(set)];
  }, [trips]);

  const zoneOptions = useMemo(() => {
    return ['ALL', ...new Set(trips.map((t) => t.zoneLocationMatch).filter(Boolean))];
  }, [trips]);

  const truckNoOptions = useMemo(() => {
    const list = trips
      .map((t) => (t.truckNo && t.truckNo !== '-' ? t.truckNo : t.raw?.truckNo))
      .filter((x): x is string => Boolean(x && x !== '-' && x.trim() !== ''));
    return ['ALL', ...Array.from(new Set(list)).sort()];
  }, [trips]);

  const driverOptions = useMemo(() => {
    const list = trips
      .map((t) => (t.driverName && t.driverName !== '-' ? t.driverName : t.raw?.driverName))
      .filter((x): x is string => Boolean(x && x !== '-' && x.trim() !== ''));
    return ['ALL', ...Array.from(new Set(list)).sort()];
  }, [trips]);

  // Diagnostics & Missing analysis
  const pricedTrips = trips.filter((t) => t.standardTripRate > 0);
  const zeroRateTrips = trips.filter((t) => t.standardTripRate === 0);
  const unmappedZoneTrips = trips.filter((t) => t.reviewStatus === 'ตรวจโซนปลายทาง');
  const estimatedMissingAmount = zeroRateTrips.reduce((sum, t) => {
    const baseline = t.standardTruckType === '4W' ? 2200 : t.standardTruckType === '6W' ? 3500 : 5500;
    return sum + baseline;
  }, 0);

  // Filtered trips
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      // Date Range
      if (filterStartDate && t.issueDate && t.issueDate < filterStartDate) return false;
      if (filterEndDate && t.issueDate && t.issueDate > filterEndDate) return false;

      // Company
      if (filterCompany !== 'ALL' && t.consigneeShipper !== filterCompany) return false;

      // Branch
      if (filterBranch !== 'ALL' && t.branch !== filterBranch) return false;

      // Truck Type (4W, 6W, 10W, OD4, OD6, OD10)
      if (filterTruckType !== 'ALL') {
        if (filterTruckType === '4W' || filterTruckType === '6W' || filterTruckType === '10W') {
          if (t.standardTruckType !== filterTruckType) return false;
        } else if (filterTruckType === 'OD4') {
          if (t.odType !== 'OD 4' && t.odType !== 'OD4') return false;
        } else if (filterTruckType === 'OD6') {
          if (t.odType !== 'OD 6' && t.odType !== 'OD6') return false;
        } else if (filterTruckType === 'OD10') {
          if (t.odType !== 'OD 10' && t.odType !== 'OD10') return false;
        }
      }

      // OD Type
      if (filterODType !== 'ALL') {
        if (filterODType === 'Company Truck' && t.isSubContractor) return false;
        if (filterODType !== 'Company Truck' && t.odType !== filterODType) return false;
      }

      // Truck No (ทะเบียนรถ)
      if (filterTruckNo !== 'ALL') {
        const tNo = (t.truckNo || t.raw?.truckNo || '').trim();
        if (tNo !== filterTruckNo) return false;
      }

      // Driver Name (คนขับ)
      if (filterDriver !== 'ALL') {
        const dName = (t.driverName || t.raw?.driverName || '').trim();
        if (dName !== filterDriver) return false;
      }

      // Contract Type (สัญญาพิเศษ)
      if (filterContractType === 'fixed_diesel' && !t.isFixedDieselContract) return false;
      if (filterContractType === 'quotation' && !t.matchedQuotationName) return false;

      // Fuel Rate Cycle / Range Filter
      if (filterFuelCycle === 'cycle_21_20') {
        const isElematec = (t.consigneeShipper || '').toUpperCase().includes('ELEMATEC');
        if (t.dieselMethod !== 'cycle_21_20' && !isElematec) return false;
      } else if (filterFuelCycle === 'fixed_contract') {
        if (t.dieselMethod !== 'fixed_contract' && !t.isFixedDieselContract) return false;
      } else if (filterFuelCycle === 'monthly_avg') {
        if (t.dieselMethod !== 'monthly_avg') return false;
      }

      // Diff Status
      if (filterDiff !== 'ALL' && t.diffStatus !== filterDiff) return false;

      // Zone
      if (filterZone !== 'ALL' && t.zoneLocationMatch !== filterZone) return false;

      // Status
      if (filterStatus !== 'ALL' && t.reviewStatus !== filterStatus) return false;

      // Keyword Search across all fields
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const text = `${t.jobNo} ${t.tripNo} ${t.consigneeShipper} ${t.deliveryName} ${t.pickUpName} ${t.truckTypeRaw} ${t.branch} ${t.odType} ${t.truckNo || ''} ${t.driverName || ''} ${t.zoneLocationMatch || ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [
    trips,
    filterStartDate,
    filterEndDate,
    filterCompany,
    filterBranch,
    filterTruckType,
    filterODType,
    filterTruckNo,
    filterDriver,
    filterContractType,
    filterFuelCycle,
    filterDiff,
    filterZone,
    filterStatus,
    searchKeyword,
  ]);

  // Computed summary for filtered set using official multi-metric calculation
  const filteredSummary: BillingReportSummary = useMemo(() => {
    return computeBillingSummary(filteredTrips);
  }, [filteredTrips]);

  // Calculation by Delivery Zone
  const zoneSummaries = useMemo(() => {
    const map = new Map<string, {
      zone: string;
      province: string;
      count4W: number;
      count6W: number;
      count10W: number;
      totalCount: number;
      baseAmount: number;
      fuelAmount: number;
      otherAmount: number;
      totalAmount: number;
    }>();

    filteredTrips.forEach((t) => {
      const zoneKey = t.zoneLocationMatch || t.deliveryDistrict || 'ไม่ระบุ';
      const existing = map.get(zoneKey) || {
        zone: zoneKey,
        province: t.deliveryProvince || '-',
        count4W: 0,
        count6W: 0,
        count10W: 0,
        totalCount: 0,
        baseAmount: 0,
        fuelAmount: 0,
        otherAmount: 0,
        totalAmount: 0,
      };

      if (t.standardTruckType === '4W') existing.count4W++;
      else if (t.standardTruckType === '6W') existing.count6W++;
      else if (t.standardTruckType === '10W') existing.count10W++;

      existing.totalCount++;
      existing.baseAmount += t.baseTripRate || 0;
      existing.fuelAmount += t.fuelSurcharge || 0;
      existing.otherAmount += (t.dropFee + t.waitingFee + t.tollFee + t.porterFee + t.otherFees) || 0;
      existing.totalAmount += t.totalAmount || 0;

      map.set(zoneKey, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredTrips]);

  // Summary per Truck / Vehicle (ทะเบียนรถ & คัน)
  const vehicleSummaries = useMemo(() => {
    const map = new Map<string, {
      truckNo: string;
      driverName: string;
      truckType: string;
      branch: string;
      tripCount: number;
      baseAmount: number;
      fuelAmount: number;
      otherAmount: number;
      totalAmount: number;
      branchSentAmount: number;
      diffAmount: number;
    }>();

    filteredTrips.forEach((t) => {
      const key = t.truckNo && t.truckNo !== '-' ? t.truckNo : (t.raw?.truckNo || 'ไม่ระบุทะเบียน');
      const existing = map.get(key) || {
        truckNo: key,
        driverName: t.driverName && t.driverName !== '-' ? t.driverName : (t.raw?.driverName || '-'),
        truckType: t.standardTruckType || t.truckTypeRaw,
        branch: t.branch,
        tripCount: 0,
        baseAmount: 0,
        fuelAmount: 0,
        otherAmount: 0,
        totalAmount: 0,
        branchSentAmount: 0,
        diffAmount: 0,
      };

      existing.tripCount++;
      existing.baseAmount += t.baseTripRate || 0;
      existing.fuelAmount += t.fuelSurcharge || 0;
      existing.otherAmount += (t.dropFee + t.waitingFee + t.tollFee + t.porterFee + t.otherFees) || 0;
      existing.totalAmount += t.totalAmount || 0;
      existing.branchSentAmount += t.customerQuotedPrice || 0;
      existing.diffAmount += t.diffAmount || 0;

      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredTrips]);

  // Summary per Customer & Special Contract (ลูกค้ารายบริษัท)
  const customerSummaries = useMemo(() => {
    const map = new Map<string, {
      customerName: string;
      isFixedDiesel: boolean;
      quotationName?: string;
      tripCount: number;
      baseAmount: number;
      fuelAmount: number;
      specialFees: number;
      totalAmount: number;
      branchSentAmount: number;
      diffAmount: number;
    }>();

    filteredTrips.forEach((t) => {
      const key = t.consigneeShipper || 'ไม่ระบุลูกค้า';
      const existing = map.get(key) || {
        customerName: key,
        isFixedDiesel: Boolean(t.isFixedDieselContract),
        quotationName: t.matchedQuotationName,
        tripCount: 0,
        baseAmount: 0,
        fuelAmount: 0,
        specialFees: 0,
        totalAmount: 0,
        branchSentAmount: 0,
        diffAmount: 0,
      };

      existing.tripCount++;
      existing.baseAmount += t.baseTripRate || 0;
      existing.fuelAmount += t.fuelSurcharge || 0;
      existing.specialFees += (t.dropFee + t.waitingFee + t.porterFee + t.tollFee + t.otherFees) || 0;
      existing.totalAmount += t.totalAmount || 0;
      existing.branchSentAmount += t.customerQuotedPrice || 0;
      existing.diffAmount += t.diffAmount || 0;

      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredTrips]);

  // Summary per Branch & Diff Reconciliation (ทุกสาขาในระบบ)
  const branchDiffSummaries = useMemo(() => {
    const map = new Map<string, {
      branch: string;
      tripCount: number;
      calculatedAmount: number;
      branchSentAmount: number;
      diffAmount: number;
      matchCount: number;
      diffCount: number;
    }>();

    filteredTrips.forEach((t) => {
      const key = t.branch || 'ไม่ระบุสาขา';
      const existing = map.get(key) || {
        branch: key,
        tripCount: 0,
        calculatedAmount: 0,
        branchSentAmount: 0,
        diffAmount: 0,
        matchCount: 0,
        diffCount: 0,
      };

      existing.tripCount++;
      existing.calculatedAmount += t.totalAmount || 0;
      existing.branchSentAmount += t.customerQuotedPrice || 0;
      existing.diffAmount += t.diffAmount || 0;
      if (t.diffStatus === 'Match') existing.matchCount++;
      else existing.diffCount++;

      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.calculatedAmount - a.calculatedAmount);
  }, [filteredTrips]);

  const handleResetFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterCompany('ALL');
    setFilterBranch('ALL');
    setFilterTruckType('ALL');
    setFilterODType('ALL');
    setFilterTruckNo('ALL');
    setFilterDriver('ALL');
    setFilterContractType('ALL');
    setFilterFuelCycle('ALL');
    setFilterDiff('ALL');
    setFilterZone('ALL');
    setFilterStatus('ALL');
    setSearchKeyword('');
    setCurrentPage(1);
  };

  const handleExportExcel = () => {
    exportBillingReportExcel(filteredSummary, filteredTrips, `Billing_Report_${Date.now()}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveInlineRate = (tripId: string) => {
    const val = parseFloat(editRateValue);
    if (!isNaN(val) && val >= 0) {
      onUpdateTripRate(tripId, val);
    }
    setEditingTripId(null);
  };

  // Pagination calculation
  const isShowAll = pageSize >= 999999;
  const totalPages = isShowAll ? 1 : Math.ceil(filteredTrips.length / pageSize) || 1;
  const paginatedTrips = isShowAll ? filteredTrips : filteredTrips.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
              OFFICIAL BILLING
            </span>
            <span className="text-xs text-slate-400">GTT Logistics & Transportation</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">
            AUTOMATED TRANSPORTATION BILLING REPORT
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            รายงานคำนวณและสรุปยอดบิลค่าขนส่งอัตโนมัติประจำงวด
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Fetch All from Database Button */}
          {onFetchAllFromDatabase && (
            <button
              onClick={onFetchAllFromDatabase}
              disabled={isFetchingDatabase}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              title="ดึงข้อมูลเที่ยวขนส่งและ Master Data ทั้งหมดจากฐานข้อมูล Supabase Cloud มาคำนวณและแสดงผลทันที"
            >
              <DownloadCloud className={`w-4 h-4 ${isFetchingDatabase ? 'animate-bounce text-white' : 'text-emerald-200'}`} />
              <span>
                {isFetchingDatabase ? 'กำลังดึงข้อมูลจาก DB...' : `ดึงจากฐานข้อมูล DB (${trips.length > 0 ? trips.length.toLocaleString() : '4,102'})`}
              </span>
            </button>
          )}

          {/* Navigate to Diff Check */}
          {onNavigateToReconciliation && (
            <button
              onClick={onNavigateToReconciliation}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              title="ไปยังหน้าจอ Diff Check (เทียบราคาสาขา & ตรวจสอบทริป)"
            >
              <Scale className="w-4 h-4 text-emerald-200" />
              <span>Diff Check (เทียบราคาสาขา)</span>
            </button>
          )}

          {/* Condition Rules & Fuel Cycle Modal Button */}
          <button
            onClick={() => setIsConditionModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
            title="เปิดหน้าต่างเงื่อนไข เลือกสาขา บริษัท และช่วงเรทราคาน้ำมัน (เช่น Elematec 21 ชน 20 หรือ SIEMENS 38.00)"
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-300" />
            <span>⚙️ หน้าต่างเงื่อนไข & รอบค่าน้ำมัน</span>
          </button>

          {/* Download 69-Col Template */}
          <button
            onClick={() => downloadRawData69TemplateExcel()}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            title="ดาวน์โหลดแม่แบบ Excel สำหรับกรอกข้อมูล 69 คอลัมน์ (AW=Truck Type)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Template 69 คอลัมน์</span>
          </button>

          {/* Clear all trips to 0 */}
          {onClearTrips && (
            <button
              onClick={onClearTrips}
              className="px-3 py-2 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              title="ล้างข้อมูลดิบ / เที่ยวรถทั้งหมดให้เป็น 0 รายการ (เคลียร์ LocalStorage)"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>ล้างข้อมูลดิบ (เป็น 0)</span>
            </button>
          )}

          {/* Upload Quotation AI OCR Button */}
          {onOpenQuotationUpload && (
            <button
              onClick={onOpenQuotationUpload}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
              title="อัปโหลดใบเสนอราคา (PDF / Excel / รูปภาพ) และสกัดข้อมูลด้วย AI OCR"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>ใบเสนอราคา (AI OCR)</span>
            </button>
          )}

          {/* Add New Trip Button */}
          {onAddNewTrip && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              title="เพิ่มเที่ยวรถใหม่เข้าสู่ระบบ"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มเที่ยวรถ</span>
            </button>
          )}



          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
            title="ดาวน์โหลดไฟล์ Excel (.xlsx) ผ่าน SheetJS"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          {/* Re-detect Branches */}
          {onReDetectBranches && (
            <button
              onClick={onReDetectBranches}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="ตรวจจับและแยกสาขาตามข้อมูลจริง (แยกสาขาบางบ่อและนวนครจากข้อมูลต้นทาง-ปลายทาง)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>แยก 2 สาขาตามข้อมูลจริง</span>
            </button>
          )}

          {/* Export / Print PDF */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
            title="พิมพ์หน้ารายงาน หรือบันทึกเป็น PDF"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ / PDF</span>
          </button>

          {/* Save to Google Drive */}
          {isDriveConnected ? (
            <button
              onClick={onOpenGoogleDriveModal}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
              title="บันทึกไฟล์รายงานขึ้น Google Drive"
            >
              <Cloud className="w-4 h-4" />
              <span>บันทึกลง Google Drive</span>
            </button>
          ) : (
            <button
              onClick={onGoogleSignIn}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
              title="เข้าสู่ระบบ Google เพื่อเปิดใช้บันทึก Drive"
            >
              <Cloud className="w-4 h-4 text-blue-500" />
              <span>เชื่อมต่อ Google Drive</span>
            </button>
          )}
        </div>
      </div>

      {/* DIAGNOSTIC & AUDIT BANNER: Answers why the amount might be lower */}
      {zeroRateTrips.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 p-4 rounded-xl shadow-xs text-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/60 rounded-lg text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-amber-900 dark:text-amber-100 text-sm flex items-center gap-2">
                  <span>ตรวจพบเที่ยวที่ยังไม่มีราคา (เรท 0 บาท) จำนวน {zeroRateTrips.length} เที่ยว</span>
                  <span className="text-[11px] font-normal text-amber-700 dark:text-amber-300">
                    (เป็นสาเหตุที่ทำให้ยอดรวมได้น้อยลง)
                  </span>
                </h4>
                <p className="text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                  มีเที่ยวขนส่ง {zeroRateTrips.length} รายการที่ติดสถานะ <strong>"ตรวจโซนปลายทาง"</strong> หรือยังไม่มีชื่อปลายทางใน Rate Card ทำให้คิดเป็น 0 บาท
                  หากคำนวณราคาครบถ้วน ยอดค่าขนส่งจะเพิ่มขึ้นอีกประมาณ{' '}
                  <span className="font-bold underline text-blue-700 dark:text-blue-300">
                    +฿{estimatedMissingAmount.toLocaleString('th-TH')} บาท
                  </span>
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={onAutoResolveAll}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-2 text-xs transition-colors"
                title="ระบบจะวิเคราะห์อำเภอ/จังหวัดของเที่ยวที่ราคาเป็น 0 และจับคู่ราคา Rate Card ที่เหมาะสมที่สุดให้ทันที"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>⚡ จับคู่โซนและเติมราคาอัตโนมัติ</span>
              </button>
              <button
                onClick={() => setFilterStatus('ตรวจโซนปลายทาง')}
                className="px-3 py-2 border border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg text-xs font-semibold transition-colors"
              >
                ดูกลุ่ม 0 บาท ({zeroRateTrips.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bracket Selector & Calculation Controls */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-800 dark:text-white">
              ช่วงราคาน้ำมันดีเซล / น้ำหนักที่ใช้คำนวณ (Rate Card Tier):
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              สลับช่วงราคาเพื่อดูการเปลี่ยนแปลงของยอดบิลรวม
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedBracket}
            onChange={(e) => onSelectBracket(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white font-medium text-xs focus:ring-2 focus:ring-blue-500"
          >
            <option value="auto">⚡ คำนวณอัตโนมัติตามราคาน้ำมันดีเซล PTT / บางจาก ประจำวัน (Recommended)</option>
            {RATE_CARD_BRACKETS.map((b) => (
              <option key={b.key} value={b.key}>
                ช่วงราคาดีเซล {b.label} บาท/ลิตร {b.key === 'c_30_32' ? '(เช่น ศรีมหาโพธิ 4W = 3,280 ฿)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white">
          <div className="flex items-center gap-2">
            <span>ตัวกรองข้อมูลรายงาน (Filter Bar)</span>
            <span className="text-slate-400 font-normal">
              (พบ {filteredTrips.length} จาก {trips.length} รายการ)
            </span>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 font-normal transition-colors text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            ล้างตัวกรอง
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 text-xs">
          {/* Keyword Search */}
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
              คำค้นหา (Job/Trip/สถานที่):
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ระบุคำค้น..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white focus:outline-hidden focus:border-blue-500 text-xs"
              />
            </div>
          </div>

          {/* Company / Shipper */}
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
              บริษัท (Consignee/Shipper):
            </label>
            <select
              value={filterCompany}
              onChange={(e) => {
                setFilterCompany(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white focus:outline-hidden focus:border-blue-500 text-xs"
            >
              {companyOptions.map((c) => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'ทุกบริษัท (ทั้งหมด)' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Branch (สาขา) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                สาขา (Branch):
              </label>
              {onReDetectBranches && (
                <button
                  type="button"
                  onClick={onReDetectBranches}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  title="ตรวจจับและแยกสาขาตามข้อมูลจริง (บางบ่อ / นวนคร)"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>แยก 2 สาขา</span>
                </button>
              )}
            </div>
            <select
              value={filterBranch}
              onChange={(e) => {
                setFilterBranch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white focus:outline-hidden focus:border-blue-500 text-xs font-medium"
            >
              {branchOptions.map((b) => {
                const count = b === 'ALL' ? trips.length : trips.filter((t) => t.branch === b).length;
                return (
                  <option key={b} value={b}>
                    {b === 'ALL' ? `ทุกสาขา (รวมทั้ง 2 สาขา ${count.toLocaleString()} เที่ยว)` : `สาขา${b} (${count.toLocaleString()} เที่ยว)`}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Truck Type */}
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
              ประเภทรถ:
            </label>
            <select
              value={filterTruckType}
              onChange={(e) => {
                setFilterTruckType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white focus:outline-hidden focus:border-blue-500 text-xs"
            >
              <option value="ALL">รถทุกประเภท (ทั้งหมด)</option>
              <option value="4W">รถ 4 ล้อ (4W)</option>
              <option value="6W">รถ 6 ล้อ (6W)</option>
              <option value="10W">รถ 10 ล้อ (10W)</option>
            </select>
          </div>

          {/* OD Type (รถซับ Sub Contractor) */}
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
              ประเภทรถซับ (OD Type):
            </label>
            <select
              value={filterODType}
              onChange={(e) => {
                setFilterODType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white focus:outline-hidden focus:border-blue-500 text-xs"
            >
              <option value="ALL">รถทุกกลุ่ม (บริษัท + ซับ)</option>
              <option value="Company Truck">รถบริษัท (Company Truck)</option>
              <option value="OD 4">OD 4 (รถซับ 4 ล้อ)</option>
              <option value="OD 6">OD 6 (รถซับ 6 ล้อ)</option>
              <option value="OD 10">OD 10 (รถซับ 10 ล้อ)</option>
            </select>
          </div>

          {/* Diff Reconciliation Filter */}
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
              ตรวจสอบส่วนต่าง (Diff):
            </label>
            <select
              value={filterDiff}
              onChange={(e) => {
                setFilterDiff(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white focus:outline-hidden focus:border-blue-500 text-xs"
            >
              <option value="ALL">แสดงทุกรายการ</option>
              <option value="Match">✅ ตรงกัน (Match 100%)</option>
              <option value="MinorDiff">⚠️ ต่างเล็กน้อย (Diff &lt; 5%)</option>
              <option value="MajorDiff">❌ ต่างมาก (Diff &ge; 5%)</option>
            </select>
          </div>

          {/* Review Status */}
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
              สถานะตรวจสอบราคา:
            </label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white focus:outline-hidden focus:border-blue-500 text-xs"
            >
              <option value="ALL">ทุกสถานะ (ทั้งหมด)</option>
              <option value="มีราคา">มีราคา (ครบถ้วน)</option>
              <option value="ตรวจโซนปลายทาง">ตรวจโซนปลายทาง</option>
              <option value="ไม่มีราคาน้ำมัน">ไม่มีราคาน้ำมัน</option>
            </select>
          </div>
        </div>

        {/* Extended Dimension Filters: Truck No, Driver, Contract Type, Zone, Dates */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 text-xs">
          {/* Truck No (ทะเบียนรถ) */}
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <Car className="w-3 h-3 text-blue-500" />
              <span>ทะเบียนรถ (Truck No):</span>
            </label>
            <select
              value={filterTruckNo}
              onChange={(e) => {
                setFilterTruckNo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white focus:outline-hidden focus:border-blue-500 text-xs"
            >
              {truckNoOptions.map((no) => (
                <option key={no} value={no}>
                  {no === 'ALL' ? 'ทุกทะเบียน (ทั้งหมด)' : no}
                </option>
              ))}
            </select>
          </div>

          {/* Driver (คนขับรถ) */}
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-emerald-500" />
              <span>พนักงานขับรถ:</span>
            </label>
            <select
              value={filterDriver}
              onChange={(e) => {
                setFilterDriver(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white focus:outline-hidden focus:border-blue-500 text-xs"
            >
              {driverOptions.map((d) => (
                <option key={d} value={d}>
                  {d === 'ALL' ? 'ทุกคนขับ (ทั้งหมด)' : d}
                </option>
              ))}
            </select>
          </div>

          {/* Special Contract Type (สัญญาพิเศษรายบริษัท) */}
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-500" />
              <span>สัญญาพิเศษ (Contract):</span>
            </label>
            <select
              value={filterContractType}
              onChange={(e) => {
                setFilterContractType(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white focus:outline-hidden focus:border-blue-500 text-xs"
            >
              <option value="ALL">สัญญาทุกประเภท (ทั้งหมด)</option>
              <option value="fixed_diesel">🛡️ ตรึงราคาน้ำมัน (Fixed Diesel เช่น SIEMENS)</option>
              <option value="quotation">📋 มีใบเสนอราคาพิเศษ (Quotation)</option>
            </select>
          </div>

          {/* Fuel Rate Cycle Filter */}
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <Fuel className="w-3 h-3 text-purple-500" />
              <span>รอบเรทน้ำมัน (Fuel Cycle):</span>
            </label>
            <select
              value={filterFuelCycle}
              onChange={(e) => {
                setFilterFuelCycle(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white focus:outline-hidden focus:border-blue-500 text-xs"
            >
              <option value="ALL">ทุกช่วงเรทน้ำมัน (ทั้งหมด)</option>
              <option value="cycle_21_20">⛽ รอบ 21 ชน 20 (Elematec: 21/9 - 20/10)</option>
              <option value="fixed_contract">🛡️ สัญญาเรทคงที่ (Fixed 38.00 ฿/L เช่น SIEMENS)</option>
              <option value="monthly_avg">📅 รอบปฏิทินมาตรฐาน 1-30 (Monthly Avg)</option>
            </select>
          </div>

          {/* Zone Destination */}
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3 text-rose-500" />
              <span>โซนปลายทาง (Zone Match):</span>
            </label>
            <select
              value={filterZone}
              onChange={(e) => {
                setFilterZone(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white focus:outline-hidden focus:border-blue-500 text-xs"
            >
              {zoneOptions.map((z) => (
                <option key={z} value={z}>
                  {z === 'ALL' ? 'ทุกโซนปลายทาง (ทั้งหมด)' : z}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
              ตั้งแต่วันที่:
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => {
                setFilterStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white focus:outline-hidden focus:border-blue-500 text-xs"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
              ถึงวันที่:
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => {
                setFilterEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white focus:outline-hidden focus:border-blue-500 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Summary Section: Interactive Multi-Dimension Analytics Tabs */}
      <div className="space-y-4">
        {/* Navigation Tabs for the 5 Inspection Structures */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <button
            onClick={() => setSummaryViewTab('truck')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              summaryViewTab === 'truck'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>1. ตามประเภทรถ (4W, 6W, 10W, OD4, OD6)</span>
          </button>
          <button
            onClick={() => setSummaryViewTab('vehicle')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              summaryViewTab === 'vehicle'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>2. ตามทะเบียนรถ / คัน ({vehicleSummaries.length} คัน)</span>
          </button>
          <button
            onClick={() => setSummaryViewTab('customer')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              summaryViewTab === 'customer'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>3. ตามลูกค้ารายบริษัท & สัญญาพิเศษ ({customerSummaries.length} ราย)</span>
          </button>
          <button
            onClick={() => setSummaryViewTab('branch')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              summaryViewTab === 'branch'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>4. ตามสาขา & ตรวจสอบผลต่าง Diff ({branchDiffSummaries.length} สาขา)</span>
          </button>
          <button
            onClick={() => setSummaryViewTab('zone')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              summaryViewTab === 'zone'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>5. ตามโซนปลายทาง ({zoneSummaries.length} โซน)</span>
          </button>
        </div>

        {/* Tab 1: By Truck Type */}
        {summaryViewTab === 'truck' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-700/60 px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                    AUTOMATED TRANSPORTATION BILLING REPORT (จำแนกตามประเภทรถมาตรฐาน 5 ประเภท)
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  คำนวณ Standard Trip Rate และค่าน้ำมันส่วนเพิ่ม (Fuel Surcharge Col I) ตามเรทประเภทรถแต่ละคัน
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {onLoad20StandardTrips && (
                  <button
                    onClick={onLoad20StandardTrips}
                    className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded font-semibold text-[11px] transition-colors"
                    title="โหลดชุดข้อมูล 20 คัน (4W: 14 คัน ฿18,790 | 6W: 6 คัน ฿12,400 | รวม ฿31,190)"
                  >
                    📋 โหลดชุด 20 คัน (฿31,190)
                  </button>
                )}
                {onSelectDieselMethod ? (
                  <div className="flex items-center bg-slate-200 dark:bg-slate-700/80 rounded-lg p-0.5 text-[11px]">
                    <button
                      onClick={() => onSelectDieselMethod('monthly_avg')}
                      className={`px-2.5 py-1 rounded font-bold transition-all ${
                        dieselMethod === 'monthly_avg'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="คำนวณตามราคาดีเซลเฉลี่ยทั้งเดือน (Monthly Average - มาตรฐาน ปตท.)"
                    >
                      ★ เฉลี่ยทั้งเดือน (Monthly Avg)
                    </button>
                    <button
                      onClick={() => onSelectDieselMethod('daily_spot')}
                      className={`px-2.5 py-1 rounded font-bold transition-all ${
                        dieselMethod === 'daily_spot'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="คำนวณตามราคา ณ วันที่เที่ยวรถ (Issue Date)"
                    >
                      ราคา ณ วันที่ (Daily Spot)
                    </button>
                  </div>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 font-semibold text-[11px]">
                    ราคาน้ำมัน: ดีเซลเฉลี่ยรายเดือน (Monthly Avg)
                  </span>
                )}
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  หน่วย: บาท (THB)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/70 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-6">ประเภทรถ</th>
                    <th className="py-2.5 px-6 text-center">จำนวน (คัน)</th>
                    <th className="py-2.5 px-6 text-right">ราคาเรทฐาน (Base)</th>
                    <th className="py-2.5 px-6 text-right">ค่าน้ำมัน (Fuel Col I)</th>
                    <th className="py-2.5 px-6 text-right">ค่าอื่นๆ</th>
                    <th className="py-2.5 px-6 text-right font-bold text-blue-600 dark:text-blue-400">Total Summary Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {filteredSummary.summaries.map((row, idx) => {
                    const isGrandTotal = row.truckType === 'รวมทั้งหมด';
                    return (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          isGrandTotal
                            ? 'bg-blue-50/70 dark:bg-blue-950/40 font-bold text-slate-900 dark:text-white text-xs'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                        }`}
                      >
                        <td className="py-2.5 px-6 font-semibold">
                          {row.truckType === '4W' && 'รถ 4 ล้อ (4W)'}
                          {row.truckType === '6W' && 'รถ 6 ล้อ (6W)'}
                          {row.truckType === '10W' && 'รถ 10 ล้อ (10W)'}
                          {isGrandTotal && 'รวมทั้งหมด'}
                        </td>
                        <td className="py-2.5 px-6 text-center font-mono font-medium">
                          {isGrandTotal ? Number(row.count).toFixed(2) : row.count}
                        </td>
                        <td className="py-2.5 px-6 text-right font-mono">
                          {row.baseRateAmount > 0
                            ? row.baseRateAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })
                            : '-'}
                        </td>
                        <td className="py-2.5 px-6 text-right font-mono text-amber-600 dark:text-amber-400">
                          {row.fuelSurchargeAmount > 0
                            ? row.fuelSurchargeAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })
                            : '-'}
                        </td>
                        <td className="py-2.5 px-6 text-right font-mono">
                          {row.otherFeesAmount > 0
                            ? row.otherFeesAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })
                            : '-'}
                        </td>
                        <td className="py-2.5 px-6 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                          {row.totalAmount > 0
                            ? row.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })
                            : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: By Vehicle & Truck No (ตรวจสอบตามทะเบียนรถ / คัน) */}
        {summaryViewTab === 'vehicle' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-700/60 px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                  <Car className="w-4 h-4 text-emerald-600" />
                  <span>2. ตรวจสอบตามทะเบียนรถ / คัน / พนักงานขับรถ (Truck No & Vehicle Summary)</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  จำแนกรายคัน คำนวณ Standard Trip Rate และค่าน้ำมันส่วนเพิ่ม พร้อมเปรียบเทียบยอดที่สาขาส่งมา vs ระบบ
                </p>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                พบรถทั้งหมด {vehicleSummaries.length} คัน / ทะเบียน
              </span>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/70 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-4">ทะเบียนรถ (คัน)</th>
                    <th className="py-2.5 px-3">พนักงานขับรถ</th>
                    <th className="py-2.5 px-3 text-center">ประเภทรถ</th>
                    <th className="py-2.5 px-3 text-center">สาขา</th>
                    <th className="py-2.5 px-3 text-center font-bold">จำนวนเที่ยว</th>
                    <th className="py-2.5 px-3 text-right">ค่าเรทฐาน</th>
                    <th className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400">ค่าน้ำมันส่วนเพิ่ม</th>
                    <th className="py-2.5 px-3 text-right">ค่าอื่นๆ</th>
                    <th className="py-2.5 px-4 text-right font-bold text-blue-600 dark:text-blue-400">ยอดคำนวณมาตรฐาน</th>
                    <th className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">ยอดสาขาส่งมา</th>
                    <th className="py-2.5 px-3 text-right font-bold">ผลต่าง (Diff)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {vehicleSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-6 text-center text-slate-400">
                        ไม่พบข้อมูลรถตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    vehicleSummaries.map((v, idx) => {
                      const hasDiff = Math.abs(v.diffAmount) > 0.01;
                      return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                          <td className="py-2 px-4 font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            <span>{v.truckNo}</span>
                          </td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{v.driverName}</td>
                          <td className="py-2 px-3 text-center font-mono">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {v.truckType}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center font-medium">สาขา{v.branch}</td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                            {v.tripCount}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            ฿{v.baseAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-amber-600 dark:text-amber-400 font-semibold">
                            ฿{v.fuelAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            ฿{v.otherAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                            ฿{v.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-500 dark:text-slate-400">
                            ฿{v.branchSentAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            {hasDiff ? (
                              <span className="text-rose-600 dark:text-rose-400 font-bold">
                                {v.diffAmount > 0 ? `+฿${v.diffAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : `-฿${Math.abs(v.diffAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`}
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Match</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: By Customer & Shipper (ตรวจสอบตามลูกค้ารายบริษัท) */}
        {summaryViewTab === 'customer' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-700/60 px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>3. ตรวจสอบตามลูกค้ารายบริษัท (Customer / Shipper & Special Contract Rules)</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  รองรับสัญญาพิเศษ เช่น Fixed Diesel Rate Contract (เช่น Siemens กำหนดเรทตรึง) และเชื่อมโยง Quotation สิทธิประโยชน์
                </p>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                พบ {customerSummaries.length} บริษัทลูกค้า
              </span>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/70 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-4">บริษัทลูกค้า (Customer / Shipper)</th>
                    <th className="py-2.5 px-3">ประเภทสัญญาพิเศษ</th>
                    <th className="py-2.5 px-3 text-center font-bold">จำนวนเที่ยว</th>
                    <th className="py-2.5 px-3 text-right">ค่าเรทฐาน</th>
                    <th className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400">ค่าน้ำมันส่วนเพิ่ม</th>
                    <th className="py-2.5 px-3 text-right">สิทธิประโยชน์ (ดรอป/รอ/คนยก)</th>
                    <th className="py-2.5 px-4 text-right font-bold text-blue-600 dark:text-blue-400">ยอดคำนวณมาตรฐาน</th>
                    <th className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">ยอดสาขาส่งมา</th>
                    <th className="py-2.5 px-3 text-right font-bold">ผลต่าง (Diff)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {customerSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-slate-400">
                        ไม่พบข้อมูลลูกค้า
                      </td>
                    </tr>
                  ) : (
                    customerSummaries.map((c, idx) => {
                      const hasDiff = Math.abs(c.diffAmount) > 0.01;
                      return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                          <td className="py-2 px-4 font-semibold text-slate-800 dark:text-white">
                            {c.customerName}
                          </td>
                          <td className="py-2 px-3">
                            {c.isFixedDiesel ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 flex items-center gap-1 w-fit">
                                <ShieldCheck className="w-3 h-3 text-amber-600" />
                                <span>Fixed Diesel Contract</span>
                              </span>
                            ) : c.quotationName ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 flex items-center gap-1 w-fit">
                                <Sparkles className="w-3 h-3 text-purple-600" />
                                <span>{c.quotationName}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">มาตรฐาน (Standard Card)</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                            {c.tripCount}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            ฿{c.baseAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-amber-600 dark:text-amber-400 font-semibold">
                            ฿{c.fuelAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            ฿{c.specialFees.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                            ฿{c.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-500 dark:text-slate-400">
                            ฿{c.branchSentAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            {hasDiff ? (
                              <span className="text-rose-600 dark:text-rose-400 font-bold">
                                {c.diffAmount > 0 ? `+฿${c.diffAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : `-฿${Math.abs(c.diffAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`}
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Match</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: By Branch & Diff Reconciliation (ตรวจสอบตามสาขา) */}
        {summaryViewTab === 'branch' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-700/60 px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                  <Scale className="w-4 h-4 text-blue-600" />
                  <span>4. ตรวจสอบตามสาขาในระบบ (Branch Sent Rate vs Calculated Rate & Diff Amount)</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  จำแนกข้อมูลทุกสาขา (เช่น นวนคร NLC, บางบ่อ BBO) เปรียบเทียบยอดที่สาขาส่งมา vs คำนวณมาตรฐานเพื่อหาผลต่าง
                </p>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                พบ {branchDiffSummaries.length} สาขา
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/70 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-5">สาขาในระบบ (Branch)</th>
                    <th className="py-2.5 px-4 text-center font-bold">จำนวนเที่ยว</th>
                    <th className="py-2.5 px-4 text-right font-bold text-blue-600 dark:text-blue-400">ยอดคำนวณมาตรฐาน (Calculated)</th>
                    <th className="py-2.5 px-4 text-right text-slate-700 dark:text-slate-300">ยอดที่สาขาส่งมา (Branch Sent)</th>
                    <th className="py-2.5 px-4 text-right font-bold">ผลต่างสุทธิ (Diff Amount)</th>
                    <th className="py-2.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-semibold">Match (ตรงกัน)</th>
                    <th className="py-2.5 px-4 text-center text-rose-600 dark:text-rose-400 font-semibold">Diff (พบส่วนต่าง)</th>
                    <th className="py-2.5 px-4 text-center">ความถูกต้อง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {branchDiffSummaries.map((b, idx) => {
                    const accuracyPct = b.tripCount > 0 ? ((b.matchCount / b.tripCount) * 100).toFixed(1) : '100.0';
                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                        <td className="py-3 px-5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-500" />
                          <span>สาขา{b.branch}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                          {b.tripCount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                          ฿{b.calculatedAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                          ฿{b.branchSentAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {Math.abs(b.diffAmount) < 0.01 ? (
                            <span className="text-emerald-600 dark:text-emerald-400">฿0.00 (Match)</span>
                          ) : (
                            <span className={b.diffAmount > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}>
                              {b.diffAmount > 0 ? `+฿${b.diffAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : `-฿${Math.abs(b.diffAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {b.matchCount} เที่ยว
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-rose-600 dark:text-rose-400 font-bold">
                          {b.diffCount} เที่ยว
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            Number(accuracyPct) >= 95
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {accuracyPct}% Match
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: By Delivery Zone (ตรวจสอบตามโซนปลายทาง) */}
        {summaryViewTab === 'zone' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-700/60 px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-rose-600" />
                  <span>5. สรุปคำนวณแยกตามแต่ละโซน & รถแต่ละประเภท (Zone & Truck Type Breakdown)</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  คำนวณจำนวนรถและยอดเงินรวมของแต่ละโซน/ปลายทาง แยกตามรถ 4 ล้อ, 6 ล้อ และ 10 ล้อ
                </p>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                พบ {zoneSummaries.length} โซนปลายทาง
              </span>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/70 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-4">โซน / อำเภอปลายทาง</th>
                    <th className="py-2.5 px-3">จังหวัด</th>
                    <th className="py-2.5 px-3 text-center">4W (คัน)</th>
                    <th className="py-2.5 px-3 text-center">6W (คัน)</th>
                    <th className="py-2.5 px-3 text-center">10W (คัน)</th>
                    <th className="py-2.5 px-3 text-center font-bold">รวม (คัน)</th>
                    <th className="py-2.5 px-3 text-right">ค่าเรทฐาน</th>
                    <th className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400">ค่าน้ำมัน (Col I)</th>
                    <th className="py-2.5 px-3 text-right">ค่าอื่นๆ</th>
                    <th className="py-2.5 px-4 text-right font-bold text-blue-600 dark:text-blue-400">Total Amount (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {zoneSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-6 text-center text-slate-400">
                        ไม่มีข้อมูลโซนขนส่ง
                      </td>
                    </tr>
                  ) : (
                    zoneSummaries.map((z, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                        <td className="py-2 px-4 font-semibold text-slate-800 dark:text-white">
                          {z.zone}
                        </td>
                        <td className="py-2 px-3 text-slate-500 dark:text-slate-400">
                          {z.province}
                        </td>
                        <td className="py-2 px-3 text-center font-mono">
                          {z.count4W > 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold">
                              {z.count4W}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-2 px-3 text-center font-mono">
                          {z.count6W > 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold">
                              {z.count6W}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-2 px-3 text-center font-mono">
                          {z.count10W > 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold">
                              {z.count10W}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold">
                          {z.totalCount}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {z.baseAmount > 0 ? z.baseAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-amber-600 dark:text-amber-400">
                          {z.fuelAmount > 0 ? z.fuelAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {z.otherAmount > 0 ? z.otherAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}
                        </td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                          ฿{z.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Breakdown Mini-Cards: Branches, Sub-Contractor OD, and Price Reconciliation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* 1. Branch Summary */}
          <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                🏢 แยกตามสาขา (Branches)
              </span>
              <span className="text-[10px] text-slate-400">นวนคร & บางบ่อ</span>
            </div>
            {filteredSummary.branchSummaries.map((b) => (
              <div key={b.branch} className="flex items-center justify-between py-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  สาขา{b.branch}:
                </span>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ฿{b.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-1.5">({b.count} เที่ยว)</span>
                </div>
              </div>
            ))}
          </div>

          {/* 2. Sub Contractor OD Summary */}
          <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                🚚 รถบริษัท vs รถซับ (OD)
              </span>
              <span className="text-[10px] text-slate-400">Company vs Sub</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">รถบริษัท (Company):</span>
              <div className="text-right">
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  ฿{filteredSummary.companyTruckAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-400 ml-1.5">({filteredSummary.companyTruckCount} เที่ยว)</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">รถซับ (Sub OD):</span>
              <div className="text-right">
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  ฿{filteredSummary.subContractorAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-400 ml-1.5">({filteredSummary.subContractorCount} เที่ยว)</span>
              </div>
            </div>
          </div>

          {/* 3. Price Reconciliation (Diff Status) */}
          <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                ⚖️ เช็ค Diff อัตโนมัติ (Reconciliation)
              </span>
              <span className="text-[10px] text-slate-400">vs ลูกค้า</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                ✅ ตรงกัน (Match):
              </span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                {filteredSummary.diffSummary.matchCount} เที่ยว
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1">
                ⚠️ ต่างเล็กน้อย (&lt;5%):
              </span>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                {filteredSummary.diffSummary.minorDiffCount} เที่ยว
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-rose-700 dark:text-rose-300 flex items-center gap-1">
                ❌ ต่างมาก (&ge;5%):
              </span>
              <span className="font-mono font-bold text-rose-700 dark:text-rose-300">
                {filteredSummary.diffSummary.majorDiffCount} เที่ยว
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Table: 24 Columns as Requested */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden space-y-3">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                ตารางรายละเอียดค่าขนส่ง (Detailed Trips Breakdown & Diff Reconciliation)
              </h3>
              {filterBranch === 'ALL' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                  แสดงทุกสาขา (นวนคร + บางบ่อ)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              ดึงออกมาทั้งหมด ทุกสาขาหากไม่ได้กดกรองให้แสดงทั้งหมด ทุกรายการ | ปรับให้แมบกับใบเสนอราคาแต่ละ Shipping 100%
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Auto-Sync 100% Quotation Button */}
            {onMapAllShippingQuotations100 && (
              <button
                onClick={onMapAllShippingQuotations100}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition-all"
                title="ปรับราคาแต่ละรายการให้แมบตรงกับใบเสนอราคาและ Rate Card แต่ละ Shipping แบบสมบูรณ์ 100%"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>⚡ แมบใบเสนอราคา Shipping 100%</span>
              </button>
            )}

            {/* Bulk Delete Button when items selected */}
            {selectedTripIds.length > 0 && onDeleteTripsBulk && (
              <button
                onClick={() => {
                  setDeleteModalState({
                    isOpen: true,
                    isBulk: true,
                    tripIds: selectedTripIds,
                    filterDescription: `เลือกจากตารางเที่ยวรถ ${selectedTripIds.length} รายการ`,
                  });
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition-all animate-scaleUp"
                title="ลบรายการที่เลือกทั้งหมดพร้อมกัน (Sync Supabase)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบที่เลือก ({selectedTripIds.length})</span>
              </button>
            )}

            {/* Delete All in Current Filter Button */}
            {filteredTrips.length > 0 && (
              <button
                onClick={() => {
                  const allFilterIds = filteredTrips.map((t) => t.id);
                  setDeleteModalState({
                    isOpen: true,
                    isBulk: true,
                    tripIds: allFilterIds,
                    filterDescription: `ลบตามเงื่อนไขตัวกรองปัจจุบัน (สาขา: ${filterBranch}, บริษัท: ${filterCompany}, ประเภทรถ: ${filterTruckType}) รวม ${allFilterIds.length} รายการ`,
                  });
                }}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-lg font-semibold flex items-center gap-1 transition-colors text-xs"
                title="ลบเที่ยวรถทั้งหมดตามผลการกรอง"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>ลบตามเงื่อนไข ({filteredTrips.length})</span>
              </button>
            )}

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">แสดง:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-xs font-semibold"
              >
                <option value={15}>15 แถว</option>
                <option value={30}>30 แถว</option>
                <option value={50}>50 แถว</option>
                <option value={100}>100 แถว</option>
                <option value={999999}>ทั้งหมด ({filteredTrips.length} แถว)</option>
              </select>
            </div>

            <div className="text-slate-500 dark:text-slate-400 text-[11px] pl-1 font-mono">
              {isShowAll ? (
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  แสดงทั้งหมด {filteredTrips.length} รายการ
                </span>
              ) : (
                <span>หน้า {currentPage} / {totalPages} ({filteredTrips.length} รายการ)</span>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[11px] text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-600">
              <tr>
                <th className="py-2.5 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={
                      paginatedTrips.length > 0 &&
                      paginatedTrips.every((t) => selectedTripIds.includes(t.id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        const newIds = Array.from(
                          new Set([...selectedTripIds, ...paginatedTrips.map((t) => t.id)])
                        );
                        setSelectedTripIds(newIds);
                      } else {
                        const pageIdSet = new Set(paginatedTrips.map((t) => t.id));
                        setSelectedTripIds(selectedTripIds.filter((id) => !pageIdSet.has(id)));
                      }
                    }}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer"
                    title="เลือกทั้งหมดในหน้านี้"
                  />
                </th>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Issue Date</th>
                <th className="py-2.5 px-3">Job No.</th>
                <th className="py-2.5 px-3">Trip No.</th>
                <th className="py-2.5 px-3">Branch (สาขา)</th>
                <th className="py-2.5 px-3">OD Type</th>
                <th className="py-2.5 px-3">Consignee/Shipper</th>
                <th className="py-2.5 px-3">Pick Up Name</th>
                <th className="py-2.5 px-3">Delivery Name</th>
                <th className="py-2.5 px-3">Zone Match</th>
                <th className="py-2.5 px-3">Truck Type (AW)</th>
                <th className="py-2.5 px-3 text-right">ราคาเรท (Base) ✎</th>
                <th className="py-2.5 px-3 text-right font-bold text-amber-600 dark:text-amber-400">
                  ค่าน้ำมัน (คอลัมน์ I)
                </th>
                <th className="py-2.5 px-3 text-right text-indigo-600 dark:text-indigo-400 font-semibold">
                  ค่าดรอป (Drop)
                </th>
                <th className="py-2.5 px-3 text-right text-teal-600 dark:text-teal-400 font-semibold">
                  ค่าคอนโซล (Consold)
                </th>
                <th className="py-2.5 px-3 text-right">ค่ารอ (Wait)</th>
                <th className="py-2.5 px-3 text-right">ทางด่วน (Toll)</th>
                <th className="py-2.5 px-3 text-right">Porter (คนยก)</th>
                <th className="py-2.5 px-3 text-right">ค่าอื่นๆ (Other)</th>
                <th className="py-2.5 px-3 text-right font-bold text-blue-600 dark:text-blue-400">
                  Total Amount (ราคารวม)
                </th>
                <th className="py-2.5 px-3 text-right font-medium text-slate-600 dark:text-slate-400">
                  ราคาลูกค้า (Quoted)
                </th>
                <th className="py-2.5 px-3 text-center">Diff (ส่วนต่าง)</th>
                <th className="py-2.5 px-3 font-semibold text-rose-600 dark:text-rose-400">
                  เหตุผลราคาไม่ขึ้น / ส่วนต่าง (คอลัมน์ J)
                </th>
                <th className="py-2.5 px-3 text-center">สถานะ</th>
                <th className="py-2.5 px-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
              {paginatedTrips.length === 0 ? (
                <tr>
                  <td colSpan={25} className="py-12 text-center">
                    {trips.length === 0 ? (
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <Truck className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                          ข้อมูลเที่ยวรถปัจจุบันเป็น 0 รายการ
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          ระบบเคลียร์ข้อมูล Data mock เป็น 0 เรียบร้อย พร้อมสำหรับการนำเข้าไฟล์งานจริง Daily Raw Data (69 คอลัมน์ / AW=Truck Type)
                        </p>
                        <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
                          {onFetchAllFromDatabase && (
                            <button
                              onClick={onFetchAllFromDatabase}
                              disabled={isFetchingDatabase}
                              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                            >
                              <DownloadCloud className={`w-4 h-4 ${isFetchingDatabase ? 'animate-bounce' : ''}`} />
                              <span>{isFetchingDatabase ? 'กำลังดึงข้อมูลจาก Cloud...' : '⚡ ดึงข้อมูลทั้งหมดจากฐานข้อมูล Supabase (4,102 รายการ)'}</span>
                            </button>
                          )}
                          <button
                            onClick={() => downloadRawData69TemplateExcel()}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>ดาวน์โหลด Template 69 คอลัมน์</span>
                          </button>
                          {onSimulateFullMonthTrips && (
                            <button
                              onClick={onSimulateFullMonthTrips}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                            >
                              <Sparkles className="w-4 h-4" />
                              <span>ทดสอบโหลดรอบเดือน 9 (3.78M / 507k)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-slate-400 text-xs">
                          ไม่พบรายการเที่ยวขนส่งที่ตรงกับเงื่อนไขการค้นหา
                        </p>
                        <button
                          onClick={handleResetFilters}
                          className="px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-md"
                        >
                          ล้างตัวกรอง
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedTrips.map((trip, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isSuccess = trip.reviewStatus === 'มีราคา';
                  const isZoneWarn = trip.reviewStatus === 'ตรวจโซนปลายทาง';
                  const isEditingThis = editingTripId === trip.id;

                  return (
                    <tr
                      key={trip.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors ${
                        selectedTripIds.includes(trip.id)
                          ? 'bg-blue-50/70 dark:bg-blue-950/30'
                          : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedTripIds.includes(trip.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTripIds([...selectedTripIds, trip.id]);
                            } else {
                              setSelectedTripIds(selectedTripIds.filter((id) => id !== trip.id));
                            }
                          }}
                          className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-2 px-3 text-slate-400 text-center font-mono">
                        {globalIdx}
                      </td>
                      <td className="py-2 px-3">{trip.issueDate}</td>
                      <td className="py-2 px-3 font-mono text-slate-900 dark:text-white font-medium">
                        {trip.jobNo}
                      </td>
                      <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">
                        {trip.tripNo}
                      </td>
                      {/* Branch Badge */}
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            trip.branch === 'บางบ่อ'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {trip.branch}
                        </span>
                      </td>
                      {/* OD Type Badge */}
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            trip.isSubContractor
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {trip.odType}
                        </span>
                      </td>
                      <td className="py-2 px-3 max-w-[180px] truncate" title={trip.consigneeShipper}>
                        {trip.consigneeShipper}
                      </td>
                      <td className="py-2 px-3 max-w-[150px] truncate" title={trip.pickUpName}>
                        {trip.pickUpName}
                      </td>
                      <td className="py-2 px-3 max-w-[180px] truncate" title={trip.deliveryName}>
                        {trip.deliveryName}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800 dark:text-white">
                        {trip.zoneLocationMatch}
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                          {trip.standardTruckType}
                        </span>
                      </td>

                      {/* Base Rate with Inline Editor */}
                      <td className="py-2 px-3 text-right font-mono font-semibold">
                        {isEditingThis ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              value={editRateValue}
                              onChange={(e) => setEditRateValue(e.target.value)}
                              className="w-20 px-1.5 py-0.5 text-right border border-blue-500 rounded bg-white dark:bg-slate-900 text-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInlineRate(trip.id);
                                if (e.key === 'Escape') setEditingTripId(null);
                              }}
                            />
                            <button
                              onClick={() => handleSaveInlineRate(trip.id)}
                              className="p-1 text-emerald-600 hover:text-emerald-700"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => {
                              setEditingTripId(trip.id);
                              setEditRateValue(String(trip.baseTripRate || ''));
                            }}
                            className={`cursor-pointer group flex items-center justify-end gap-1 hover:underline ${
                              trip.baseTripRate === 0
                                ? 'text-rose-600 dark:text-rose-400 font-bold'
                                : 'text-slate-900 dark:text-white'
                            }`}
                            title="คลิกเพื่อแก้ไขราคาเรทฐาน"
                          >
                            <span>
                              {trip.baseTripRate > 0
                                ? trip.baseTripRate.toLocaleString('th-TH', { minimumFractionDigits: 2 })
                                : <span className="text-slate-400 font-normal italic">(เว้นว่าง/รอระบุ)</span>}
                            </span>
                            <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                        )}
                      </td>

                      {/* Fuel Surcharge */}
                      <td className="py-2 px-3 text-right font-mono">
                        <div className="font-bold text-amber-600 dark:text-amber-400">
                          {trip.fuelSurcharge > 0 ? trip.fuelSurcharge.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}
                        </div>
                        {trip.dieselMethod === 'cycle_21_20' ? (
                          <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400" title={`รอบ ${trip.fuelCyclePeriod || '21 ชน 20'}`}>
                            ⛽ 21ชน20 {trip.dieselRate ? `(฿${trip.dieselRate.toFixed(2)})` : ''}
                          </div>
                        ) : trip.dieselMethod === 'fixed_contract' ? (
                          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400" title="สัญญาเรทน้ำมันคงที่">
                            🛡️ สัญญาคงที่ {trip.dieselRate ? `(฿${trip.dieselRate.toFixed(2)})` : ''}
                          </div>
                        ) : trip.dieselRate ? (
                          <div className="text-[9px] text-slate-400">
                            @{trip.dieselRate.toFixed(2)} ฿/L
                          </div>
                        ) : null}
                      </td>

                      {/* Drop Fee */}
                      <td className="py-2 px-3 text-right font-mono">
                        {trip.dropFee > 0 ? (
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            ฿{trip.dropFee.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Consold (Console Fee) */}
                      <td className="py-2 px-3 text-right font-mono">
                        {trip.consoleFee > 0 ? (
                          <span className="font-semibold text-teal-600 dark:text-teal-400">
                            ฿{trip.consoleFee.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Waiting Fee */}
                      <td className="py-2 px-3 text-right font-mono">
                        {trip.waitingFee > 0 ? trip.waitingFee.toLocaleString() : '-'}
                      </td>

                      {/* Toll Fee */}
                      <td className="py-2 px-3 text-right font-mono">
                        {trip.tollFee > 0 ? trip.tollFee.toLocaleString() : '-'}
                      </td>

                      {/* Porter Fee */}
                      <td className="py-2 px-3 text-right font-mono">
                        {trip.porterFee > 0 ? trip.porterFee.toLocaleString() : '-'}
                      </td>

                      {/* Other Fees */}
                      <td className="py-2 px-3 text-right font-mono">
                        {trip.otherFees > 0 ? trip.otherFees.toLocaleString() : '-'}
                      </td>

                      {/* Total Amount */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                        ฿{trip.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Customer Quoted */}
                      <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        ฿{trip.customerQuotedPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Diff Badge */}
                      <td className="py-2 px-3 text-center font-mono">
                        {trip.diffStatus === 'Match' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                            0.00 (Match)
                          </span>
                        ) : trip.diffStatus === 'MinorDiff' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                            {trip.diffAmount > 0 ? '+' : ''}{trip.diffAmount.toFixed(0)} ฿ ({trip.diffPercent.toFixed(1)}%)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300">
                            {trip.diffAmount > 0 ? '+' : ''}{trip.diffAmount.toFixed(0)} ฿ ({trip.diffPercent.toFixed(1)}%)
                          </span>
                        )}
                      </td>

                      {/* Diff Reason */}
                      <td className="py-2 px-3 max-w-[200px] truncate text-[11px]" title={trip.diffReason}>
                        <span className="text-slate-600 dark:text-slate-300">{trip.diffReason}</span>
                      </td>

                      {/* Review status */}
                      <td className="py-2 px-3 text-center">
                        {isSuccess && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                            <CheckCircle className="w-3 h-3" /> มีราคา
                          </span>
                        )}
                        {isZoneWarn && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                            <AlertTriangle className="w-3 h-3" /> ตรวจโซน
                          </span>
                        )}
                        {!isSuccess && !isZoneWarn && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300">
                            <XCircle className="w-3 h-3" /> ไม่มีราคา
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingTripId(trip.id);
                              setEditRateValue(String(trip.standardTripRate || ''));
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                            title="แก้ไขราคาเที่ยวนี้"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteTrip && (
                            <button
                              onClick={() => {
                                setDeleteModalState({
                                  isOpen: true,
                                  isBulk: false,
                                  tripIds: [trip.id],
                                  itemName: `Job: ${trip.jobNo || '-'} | Trip: ${trip.tripNo || '-'} (${trip.consigneeShipper})`,
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="ลบเที่ยวรถนี้ (Sync Supabase)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              แสดง {isShowAll ? 'ทั้งหมด' : `${(currentPage - 1) * pageSize + 1} - ${Math.min(currentPage * pageSize, filteredTrips.length)}`} จาก {filteredTrips.length.toLocaleString()} รายการ
            </span>

            <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-3">
              <span className="text-slate-400 text-[11px]">แถวต่อหน้า:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-semibold text-slate-800 dark:text-white"
              >
                <option value={15}>15 แถว/หน้า</option>
                <option value={50}>50 แถว/หน้า</option>
                <option value={100}>100 แถว/หน้า</option>
                <option value={500}>500 แถว/หน้า</option>
                <option value={1000}>1,000 แถว/หน้า</option>
                <option value={999999}>แสดงทั้งหมด ({filteredTrips.length.toLocaleString()} รายการ)</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && !isShowAll && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
                title="หน้าก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-semibold text-slate-800 dark:text-white">
                หน้า {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
                title="หน้าถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add New Trip Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Plus className="w-4 h-4" />
                เพิ่มเที่ยวขนส่งใหม่ (Add Trip Record)
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Job No. *
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น GTT-D260930999"
                    value={newJobNo}
                    onChange={(e) => setNewJobNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Trip No.
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น TRP-GTTD260930999"
                    value={newTripNo}
                    onChange={(e) => setNewTripNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Issue Date *
                  </label>
                  <input
                    type="text"
                    value={newIssueDate}
                    onChange={(e) => setNewIssueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    ประเภทรถ (Truck Type) *
                  </label>
                  <select
                    value={newTruckType}
                    onChange={(e) => setNewTruckType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  >
                    <option value="4W/Single Unit">4W/Single Unit (รถ 4 ล้อ)</option>
                    <option value="6W/Single Unit">6W/Single Unit (รถ 6 ล้อ)</option>
                    <option value="10W/Single Unit">10W/Single Unit (รถ 10 ล้อ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  บริษัทลูกค้า (Consignee/Shipper)
                </label>
                <input
                  type="text"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    อำเภอปลายทาง (District)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ศรีมหาโพธิ / พระพุทธบาท"
                    value={newDelivDistrict}
                    onChange={(e) => setNewDelivDistrict(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    จังหวัดปลายทาง (Province)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ปราจีนบุรี / สระบุรี"
                    value={newDelivProvince}
                    onChange={(e) => setNewDelivProvince(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Standard Trip Rate (THB)
                </label>
                <input
                  type="number"
                  placeholder="เช่น 3280"
                  value={newStandardRate}
                  onChange={(e) => setNewStandardRate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-mono font-bold text-blue-600"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 text-xs hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveNewTrip}
                disabled={!newJobNo.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-40"
              >
                บันทึกเที่ยวรถใหม่
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Single and Bulk Trip deletion */}
      {deleteModalState.isOpen && (
        <DeleteConfirmModal
          isOpen={deleteModalState.isOpen}
          onClose={() => setDeleteModalState((prev) => ({ ...prev, isOpen: false }))}
          targetType="transport_trips"
          targetLabel={deleteModalState.isBulk ? `เที่ยวรถขนส่ง (${deleteModalState.tripIds.length} รายการ)` : 'เที่ยวรถขนส่ง'}
          itemsCount={deleteModalState.tripIds.length}
          selectedIds={deleteModalState.tripIds}
          itemName={deleteModalState.itemName}
          isBulk={deleteModalState.isBulk}
          filterDescription={deleteModalState.filterDescription}
          onConfirmDelete={async (deleteMode) => {
            if (deleteModalState.isBulk) {
              if (onDeleteTripsBulk) {
                await onDeleteTripsBulk(deleteModalState.tripIds, deleteMode);
              }
              // clear selected
              setSelectedTripIds([]);
            } else {
              const singleId = deleteModalState.tripIds[0];
              if (singleId && onDeleteTrip) {
                await onDeleteTrip(singleId, deleteMode);
              }
              setSelectedTripIds((prev) => prev.filter((id) => id !== singleId));
            }
          }}
        />
      )}

      {/* Condition & Fuel Cycle Modal */}
      {isConditionModalOpen && (
        <ConditionFuelCycleModal
          isOpen={isConditionModalOpen}
          onClose={() => setIsConditionModalOpen(false)}
          fuelCycles={fuelCycles}
          onUpdateFuelCycles={onUpdateFuelCycles}
          fixedCustomers={fixedCustomers}
          onUpdateFixedCustomers={onUpdateFixedCustomers}
          customerRateConfigs={customerRateConfigs}
          onUpdateCustomerRateConfigs={onUpdateCustomerRateConfigs}
          dieselPrices={dieselPrices}
          companyOptions={companyOptions}
        />
      )}
    </div>
  );
};
