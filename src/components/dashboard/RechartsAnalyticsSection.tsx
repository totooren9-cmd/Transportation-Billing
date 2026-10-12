import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Truck,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  Filter,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { CalculatedBillingTrip, BillingReportSummary } from '../../types';

interface RechartsAnalyticsSectionProps {
  trips: CalculatedBillingTrip[];
  summary: BillingReportSummary;
  onNavigateToBilling: () => void;
}

// Branch Color Palette
const BRANCH_COLORS: { [branch: string]: string } = {
  'นวนคร': '#2563eb', // Royal Blue
  'บางบ่อ': '#9333ea', // Purple
  'อยุธยา': '#059669', // Emerald
  'แหลมฉบัง': '#d97706', // Amber
  'อื่นๆ': '#64748b', // Slate
};

const COLOR_PALETTE = ['#2563eb', '#9333ea', '#059669', '#d97706', '#ec4899', '#06b6d4', '#f97316'];

// Custom Currency Formatter
const formatCurrency = (val: number): string => {
  if (val >= 1000000) return `฿${(val / 1000000).toFixed(2)}M`;
  if (val >= 1000) return `฿${(val / 1000).toFixed(0)}k`;
  return `฿${val.toLocaleString()}`;
};

export const RechartsAnalyticsSection: React.FC<RechartsAnalyticsSectionProps> = ({
  trips,
  summary,
  onNavigateToBilling,
}) => {
  // Filter States
  const [selectedBranch, setSelectedBranch] = useState<string>('ทั้งหมด');
  const [timeGranularity, setTimeGranularity] = useState<'monthly' | 'daily'>('daily');
  const [activeChartTab, setActiveChartTab] = useState<'revenue_volume' | 'truck_type' | 'sub_contractor'>('revenue_volume');

  // Available Branches
  const availableBranches = useMemo(() => {
    const list = Array.from(new Set(trips.map((t) => t.branch).filter(Boolean)));
    return ['ทั้งหมด', ...list];
  }, [trips]);

  // Filtered Trips based on Branch Filter
  const filteredTrips = useMemo(() => {
    if (selectedBranch === 'ทั้งหมด') return trips;
    return trips.filter((t) => t.branch === selectedBranch);
  }, [trips, selectedBranch]);

  // 1. Monthly & Daily Volume & Revenue Trend Data
  const trendData = useMemo(() => {
    if (timeGranularity === 'monthly') {
      // Group by Month (Extract Month/Year from issueDate)
      const map = new Map<string, { label: string; tripCount: number; totalRevenue: number; avgRate: number }>();
      
      filteredTrips.forEach((t) => {
        const rawDate = t.issueDate || '';
        let monthKey = '09/2026';
        let label = 'กันยายน 2026';

        if (rawDate.includes('-')) {
          const parts = rawDate.split('-');
          if (parts.length >= 2) {
            monthKey = `${parts[1]}/${parts[0]}`;
            const mNum = parseInt(parts[1], 10);
            const thaiMonths = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
            label = `${thaiMonths[mNum] || parts[1]} ${parts[0]}`;
          }
        } else if (rawDate.includes('/')) {
          const parts = rawDate.split('/');
          if (parts.length >= 2) {
            monthKey = `${parts[1]}/${parts[2] || '2026'}`;
            const mNum = parseInt(parts[1], 10);
            const thaiMonths = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
            label = `${thaiMonths[mNum] || parts[1]} ${parts[2] || '2026'}`;
          }
        }

        const cur = map.get(monthKey) || { label, tripCount: 0, totalRevenue: 0, avgRate: 0 };
        cur.tripCount += 1;
        cur.totalRevenue += t.totalAmount || 0;
        map.set(monthKey, cur);
      });

      return Array.from(map.entries()).map(([key, val]) => ({
        key,
        name: val.label,
        tripCount: val.tripCount,
        totalRevenue: Math.round(val.totalRevenue),
        avgRate: val.tripCount > 0 ? Math.round(val.totalRevenue / val.tripCount) : 0,
      }));
    } else {
      // Group by Day (Daily sequence)
      const map = new Map<string, { tripCount: number; totalRevenue: number }>();

      filteredTrips.forEach((t) => {
        const d = (t.issueDate || '').split(' ')[0];
        if (!d) return;
        const cur = map.get(d) || { tripCount: 0, totalRevenue: 0 };
        cur.tripCount += 1;
        cur.totalRevenue += t.totalAmount || 0;
        map.set(d, cur);
      });

      // Sort chronological
      const entries = Array.from(map.entries()).sort((a, b) => {
        const parseD = (str: string) => {
          if (str.includes('-')) {
            const [y, m, d] = str.split('-').map(Number);
            return new Date(y, m - 1, d).getTime();
          }
          const [d, m, y] = str.split('/').map(Number);
          return new Date(y, m - 1, d).getTime();
        };
        return parseD(a[0]) - parseD(b[0]);
      });

      return entries.map(([date, val]) => {
        // Shorter label for chart axis
        let shortDate = date;
        if (date.includes('-')) {
          const parts = date.split('-');
          shortDate = `${parts[2]}/${parts[1]}`;
        } else if (date.includes('/')) {
          const parts = date.split('/');
          shortDate = `${parts[0]}/${parts[1]}`;
        }

        return {
          key: date,
          name: shortDate,
          fullDate: date,
          tripCount: val.tripCount,
          totalRevenue: Math.round(val.totalRevenue),
          avgRate: val.tripCount > 0 ? Math.round(val.totalRevenue / val.tripCount) : 0,
        };
      });
    }
  }, [filteredTrips, timeGranularity]);

  // 2. Branch-wise Revenue & Workload Breakdown Data
  const branchData = useMemo(() => {
    const branchMap = new Map<
      string,
      {
        count: number;
        revenue: number;
        trips4W: number;
        trips6W: number;
        trips10W: number;
        revenue4W: number;
        revenue6W: number;
        revenue10W: number;
        companyTrips: number;
        subTrips: number;
      }
    >();

    trips.forEach((t) => {
      const b = t.branch || 'นวนคร';
      const cur = branchMap.get(b) || {
        count: 0,
        revenue: 0,
        trips4W: 0,
        trips6W: 0,
        trips10W: 0,
        revenue4W: 0,
        revenue6W: 0,
        revenue10W: 0,
        companyTrips: 0,
        subTrips: 0,
      };

      cur.count += 1;
      cur.revenue += t.totalAmount || 0;

      if (t.standardTruckType === '4W') {
        cur.trips4W += 1;
        cur.revenue4W += t.totalAmount || 0;
      } else if (t.standardTruckType === '6W') {
        cur.trips6W += 1;
        cur.revenue6W += t.totalAmount || 0;
      } else if (t.standardTruckType === '10W') {
        cur.trips10W += 1;
        cur.revenue10W += t.totalAmount || 0;
      }

      if (t.isSubContractor) {
        cur.subTrips += 1;
      } else {
        cur.companyTrips += 1;
      }

      branchMap.set(b, cur);
    });

    const totalRev = Array.from(branchMap.values()).reduce((sum, item) => sum + item.revenue, 0);

    return Array.from(branchMap.entries()).map(([name, data]) => ({
      name,
      amount: Math.round(data.revenue),
      count: data.count,
      percent: totalRev > 0 ? Math.round((data.revenue / totalRev) * 1000) / 10 : 0,
      avgPerTrip: data.count > 0 ? Math.round(data.revenue / data.count) : 0,
      trips4W: data.trips4W,
      trips6W: data.trips6W,
      trips10W: data.trips10W,
      revenue4W: Math.round(data.revenue4W),
      revenue6W: Math.round(data.revenue6W),
      revenue10W: Math.round(data.revenue10W),
      companyTrips: data.companyTrips,
      subTrips: data.subTrips,
      color: BRANCH_COLORS[name] || '#64748b',
    })).sort((a, b) => b.amount - a.amount);
  }, [trips]);

  // 3. Truck Type (4W, 6W, 10W) Breakdown Data
  const truckTypeData = useMemo(() => {
    const list = [
      { type: '4W', label: 'รถ 4 ล้อ (4W)', color: '#2563eb' },
      { type: '6W', label: 'รถ 6 ล้อ (6W)', color: '#9333ea' },
      { type: '10W', label: 'รถ 10 ล้อ (10W)', color: '#d97706' },
    ];

    const total = filteredTrips.length || 1;

    return list.map((item) => {
      const match = filteredTrips.filter((t) => t.standardTruckType === item.type);
      const rev = match.reduce((s, t) => s + (t.totalAmount || 0), 0);
      return {
        name: item.label,
        truckType: item.type,
        count: match.length,
        revenue: Math.round(rev),
        percent: Math.round((match.length / total) * 1000) / 10,
        avgRate: match.length > 0 ? Math.round(rev / match.length) : 0,
        color: item.color,
      };
    });
  }, [filteredTrips]);

  // Total filtered revenue and trips
  const currentTotalRevenue = useMemo(() => {
    return filteredTrips.reduce((s, t) => s + (t.totalAmount || 0), 0);
  }, [filteredTrips]);

  const currentTotalTrips = filteredTrips.length;
  const currentAvgRevenue = currentTotalTrips > 0 ? Math.round(currentTotalRevenue / currentTotalTrips) : 0;

  // Custom Tooltip Component for Revenue & Volume
  const CustomDualTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[210px] space-y-2">
          <div className="font-bold border-b border-slate-800 pb-1 text-slate-200 flex items-center justify-between">
            <span>📅 {data.fullDate || data.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
              {timeGranularity === 'monthly' ? 'รายเดือน' : 'รายวัน'}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                ยอดรวมค่าขนส่ง:
              </span>
              <span className="font-mono font-extrabold text-emerald-400">
                ฿{(data.totalRevenue || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                ปริมาณเที่ยว:
              </span>
              <span className="font-mono font-bold text-blue-300">
                {(data.tripCount || 0).toLocaleString()} เที่ยว
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400">เฉลี่ยต่อเที่ยว:</span>
              <span className="font-mono text-amber-300 font-semibold">
                ฿{(data.avgRate || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip Component for Pie Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1 min-w-[170px]">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1">
            🏢 สาขา{data.name}
          </div>
          <div className="flex justify-between items-center text-emerald-400 font-mono font-bold">
            <span>ยอดรวม:</span>
            <span>฿{(data.amount || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-blue-300 font-mono">
            <span>ปริมาณงาน:</span>
            <span>{(data.count || 0).toLocaleString()} เที่ยว ({data.percent}%)</span>
          </div>
          <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1 border-t border-slate-800">
            <span>เฉลี่ย/เที่ยว:</span>
            <span>฿{(data.avgPerTrip || 0).toLocaleString()}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER & INTERACTIVE FILTER BAR */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                RECHARTS ANALYTICS
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                <Activity className="w-3.5 h-3.5 text-blue-600" /> การวิเคราะห์ปริมาณงาน & ยอดรวมค่าขนส่ง
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              กราฟวิเคราะห์ปริมาณเที่ยวขนส่งและยอดรวมรายเดือน
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ติดตามภาพรวมของรายได้และปริมาณงานในแต่ละสาขาแบบ Real-time พร้อมกราฟเชิงลึก
            </p>
          </div>

          {/* Granularity & View Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTimeGranularity('daily')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  timeGranularity === 'daily'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>รายวัน (Daily)</span>
              </button>
              <button
                type="button"
                onClick={() => setTimeGranularity('monthly')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  timeGranularity === 'monthly'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>รายเดือน (Monthly)</span>
              </button>
            </div>
          </div>
        </div>

        {/* BRANCH FILTER TABS */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> เลือกสาขา:
            </span>
            {availableBranches.map((bName) => {
              const isSelected = selectedBranch === bName;
              return (
                <button
                  key={bName}
                  type="button"
                  onClick={() => setSelectedBranch(bName)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <Building2 className="w-3 h-3" />
                  <span>{bName}</span>
                  {bName !== 'ทั้งหมด' && (
                    <span className="text-[10px] opacity-80 font-mono">
                      ({trips.filter((t) => t.branch === bName).length})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* KPI Snapshot Pills */}
          <div className="flex items-center gap-2 text-xs font-mono shrink-0">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
              💰 ฿{currentTotalRevenue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold">
              🚚 {currentTotalTrips.toLocaleString()} เที่ยว
            </span>
          </div>
        </div>
      </div>

      {/* KPI STAT CARDS (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent bg-white dark:bg-slate-800 p-4.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>ยอดรวมค่าขนส่งสุทธิ</span>
            <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
            ฿{currentTotalRevenue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-1">
            {selectedBranch === 'ทั้งหมด' ? 'ยอดรวมทุกสาขาในระบบ' : `เฉพาะสาขา ${selectedBranch}`}
          </p>
        </div>

        {/* Card 2: Trip Volume */}
        <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent bg-white dark:bg-slate-800 p-4.5 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>ปริมาณเที่ยวขนส่ง</span>
            <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Truck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
            {currentTotalTrips.toLocaleString()} <span className="text-xs font-normal text-slate-500">เที่ยว</span>
          </div>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium pt-1">
            อัตราเฉลี่ย ฿{currentAvgRevenue.toLocaleString()} / เที่ยว
          </p>
        </div>

        {/* Card 3: Top Performing Branch */}
        <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent bg-white dark:bg-slate-800 p-4.5 rounded-2xl border border-purple-200/80 dark:border-purple-900/40 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>สาขาที่มีรายได้สูงสุด</span>
            <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white truncate">
            {branchData[0] ? `สาขา${branchData[0].name}` : '-'}
          </div>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-mono font-bold pt-1">
            {branchData[0] ? `฿${branchData[0].amount.toLocaleString()} (${branchData[0].percent}%)` : '-'}
          </p>
        </div>

        {/* Card 4: Fleet vs Sub Workload Ratio */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent bg-white dark:bg-slate-800 p-4.5 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>สัดส่วนรถบริษัท vs รถซับ</span>
            <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
            {filteredTrips.length > 0
              ? `${Math.round((filteredTrips.filter((t) => !t.isSubContractor).length / filteredTrips.length) * 100)}% : ${Math.round((filteredTrips.filter((t) => t.isSubContractor).length / filteredTrips.length) * 100)}%`
              : '0% : 0%'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            รถบริษัท {filteredTrips.filter((t) => !t.isSubContractor).length} | รถซับ {filteredTrips.filter((t) => t.isSubContractor).length} เที่ยว
          </p>
        </div>
      </div>

      {/* MAIN CHART 1: MONTHLY & DAILY VOLUME & REVENUE DUAL-AXIS (RECHARTS) */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              {timeGranularity === 'monthly'
                ? 'วิเคราะห์ปริมาณเที่ยวขนส่งและยอดรวมรายเดือน (Monthly Revenue & Volume)'
                : 'วิเคราะห์แนวโน้มเที่ยวขนส่งและยอดรวมรายวัน (Daily Revenue & Volume Trend)'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              แกนซ้าย: ยอดรวมค่าขนส่ง (บาท) | แกนขวา: ปริมาณเที่ยวขนส่ง (เที่ยว)
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-3 h-3 rounded-xs bg-blue-500" />
              ปริมาณเที่ยว (Bar)
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              ยอดรวมค่าขนส่ง (Line)
            </span>
          </div>
        </div>

        {/* Dual Axis ComposedChart Container */}
        <div className="w-full h-80 pt-2">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  dy={8}
                />
                {/* Left Y Axis: Revenue (Currency) */}
                <YAxis
                  yAxisId="left"
                  stroke="#10b981"
                  fontSize={11}
                  tickFormatter={formatCurrency}
                  tickLine={false}
                  dx={-5}
                />
                {/* Right Y Axis: Trip Volume (Count) */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#3b82f6"
                  fontSize={11}
                  tickFormatter={(val) => `${val}`}
                  tickLine={false}
                  dx={5}
                />
                <Tooltip content={<CustomDualTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                />
                {/* Bar for Volume */}
                <Bar
                  yAxisId="right"
                  dataKey="tripCount"
                  name="ปริมาณเที่ยวขนส่ง (เที่ยว)"
                  fill="#3b82f6"
                  radius={[5, 5, 0, 0]}
                  barSize={timeGranularity === 'monthly' ? 48 : 22}
                />
                {/* Line for Revenue */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalRevenue"
                  name="ยอดรวมค่าขนส่ง (บาท)"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, stroke: '#10b981', fill: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 7, stroke: '#10b981', strokeWidth: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              ไม่พบข้อมูลเที่ยวขนส่งสำหรับเงื่อนไขที่เลือก
            </div>
          )}
        </div>
      </div>

      {/* ROW 2: BRANCH BREAKDOWN (BAR CHART + DONUT CHART SIDE-BY-SIDE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 2A: Branch Volume & Revenue Comparison (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                เปรียบเทียบยอดรวมค่าขนส่งในแต่ละสาขา
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                เปรียบเทียบมูลค่ารายได้ (บาท) และปริมาณเที่ยวตามสาขา
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
              {branchData.length} สาขา
            </span>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchData} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} dy={5} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={formatCurrency} tickLine={false} />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    name === 'ยอดเงินรวม' ? `฿${Number(value).toLocaleString()}` : `${value} เที่ยว`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    color: '#ffffff',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="amount" name="ยอดเงินรวม" radius={[6, 6, 0, 0]}>
                  {branchData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Branch Legend Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 dark:border-slate-700 text-xs">
            {branchData.map((b) => (
              <div
                key={b.name}
                onClick={() => setSelectedBranch(selectedBranch === b.name ? 'ทั้งหมด' : b.name)}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  selectedBranch === b.name
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold truncate" style={{ color: b.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                  {b.name}
                </div>
                <div className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">
                  ฿{(b.amount / 1000).toFixed(0)}k ({b.percent}%)
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {b.count} เที่ยว
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2B: Branch Revenue Share (Donut Chart - 5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-indigo-600" />
                สัดส่วนรายได้แยกตามสาขา (Revenue Share)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                เปอร์เซ็นต์ส่วนแบ่งยอดเงินค่าขนส่ง
              </p>
            </div>
          </div>

          <div className="w-full h-72 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={branchData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={4}
                  dataKey="amount"
                  nameKey="name"
                >
                  {branchData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[11px] font-semibold text-slate-400">ยอดรวมสาขา</span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                {formatCurrency(summary.grandTotalAmount)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {summary.grandTotalCount} เที่ยว
              </span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
            {branchData.map((b) => (
              <div key={b.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                  สาขา{b.name}
                </span>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">{b.count} เที่ยว</span>
                  <span className="font-bold text-slate-900 dark:text-white">฿{b.amount.toLocaleString()}</span>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 w-12 text-right">
                    {b.percent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 3: TRUCK TYPE ANALYSIS & BRANCH WORKLOAD DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 3A: Truck Type Breakdown (4W / 6W / 10W) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                ปริมาณงานและรายได้แยกตามประเภทรถ (4W, 6W, 10W)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                เปรียบเทียบเที่ยววิ่งและมูลค่าค่าขนส่งตามขนาดรถ
              </p>
            </div>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={truckTypeData} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} dy={5} />
                <YAxis yAxisId="left" stroke="#2563eb" fontSize={11} tickLine={false} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#10b981"
                  fontSize={11}
                  tickFormatter={formatCurrency}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    name === 'ยอดรวมค่าขนส่ง' ? `฿${Number(value).toLocaleString()}` : `${value} เที่ยว`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    color: '#ffffff',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar yAxisId="left" dataKey="count" name="จำนวนเที่ยว (เที่ยว)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="right" dataKey="revenue" name="ยอดรวมค่าขนส่ง (บาท)" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
            {truckTypeData.map((t) => (
              <div key={t.truckType} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">{t.name}</span>
                <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white block mt-0.5">
                  {t.count} เที่ยว ({t.percent}%)
                </span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 block font-semibold">
                  ฿{t.revenue.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3B: Branch Performance Deep-Dive Table */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                ตารางสรุปภาพรวมรายได้และปริมาณงานในแต่ละสาขา
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                จำแนกประเภทรถ สัดส่วนรถบริษัท/รถซับ และรายได้เฉลี่ย
              </p>
            </div>
            <button
              onClick={onNavigateToBilling}
              className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              ดู Billing Report เต็ม <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">สาขา</th>
                  <th className="py-2.5 px-3 text-center">เที่ยวรวม</th>
                  <th className="py-2.5 px-3 text-center">สัดส่วนรถ</th>
                  <th className="py-2.5 px-3 text-right">ยอดค่าขนส่ง (THB)</th>
                  <th className="py-2.5 px-3 text-right">เฉลี่ย/เที่ยว</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                {branchData.map((b) => (
                  <tr key={b.name} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                      สาขา{b.name}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      {b.count} <span className="text-[10px] text-slate-400 font-normal">เที่ยว</span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      4W:{b.trips4W} | 6W:{b.trips6W} | 10W:{b.trips10W}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900 dark:text-white">
                      ฿{b.amount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      ฿{b.avgPerTrip.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
