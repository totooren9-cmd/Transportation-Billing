import React from 'react';
import {
  LayoutDashboard,
  Upload,
  Receipt,
  Settings,
  BarChart3,
  Truck,
  HardDrive,
  CheckCircle,
  FileText,
  Scale,
  BookOpen,
  Database,
} from 'lucide-react';

export type PageTab =
  | 'dashboard'
  | 'billing'
  | 'reconciliation'
  | 'quotation'
  | 'import'
  | 'reports'
  | 'master'
  | 'supabase-crud'
  | 'manual';

interface SidebarProps {
  currentTab: PageTab;
  setCurrentTab: (tab: PageTab) => void;
  isOpen: boolean;
  totalTripsCount: number;
  totalAmountSum: number;
  onOpenSupabaseModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpen,
  totalTripsCount,
  onOpenSupabaseModal,
}) => {
  const navItems: { id: PageTab; label: string; icon: React.ReactNode; badge?: string; badgeColor?: string }[] = [
    {
      id: 'dashboard',
      label: 'แดชบอร์ดค่าน้ำมัน (Fuel Dashboard)',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'billing',
      label: 'ตรวจสอบค่าน้ำมันประจำเที่ยว (Trip Fuel Report)',
      icon: <Receipt className="w-5 h-5" />,
      badge: totalTripsCount > 0 ? totalTripsCount.toLocaleString() : undefined,
    },
    {
      id: 'reconciliation',
      label: 'ตรวจสอบส่วนต่างค่าน้ำมัน (Fuel Diff Check)',
      icon: <Scale className="w-5 h-5 text-emerald-400" />,
      badge: 'Diff Check',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    },
    {
      id: 'quotation',
      label: 'ตารางเรทน้ำมัน & AI OCR (Fuel Rates)',
      icon: <FileText className="w-5 h-5 text-purple-400" />,
      badge: 'AI OCR',
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    },
    {
      id: 'import',
      label: 'นำเข้าข้อมูลเที่ยวรถ & ราคาน้ำมัน (Import Trips)',
      icon: <Upload className="w-5 h-5" />,
    },
    {
      id: 'reports',
      label: 'วิเคราะห์ค่าน้ำมัน (Fuel Analytics)',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      id: 'master',
      label: 'ตั้งค่าเรทน้ำมัน & Rate Cards (Fuel Master)',
      icon: <Settings className="w-5 h-5" />,
    },
    {
      id: 'supabase-crud',
      label: 'จัดการ Supabase CRUD',
      icon: <Database className="w-5 h-5 text-emerald-400" />,
      badge: '7 Tables',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    },
    {
      id: 'manual',
      label: 'คู่มือการใช้งานระบบ (User Manual)',
      icon: <BookOpen className="w-5 h-5 text-amber-400" />,
      badge: 'ละเอียด',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
  ];

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static`}
      >
        {/* Brand / Logo Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800 bg-slate-950/40">
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-md shadow-blue-600/30">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-wider uppercase text-white block">
              GTT LOGISTICS
            </span>
            <span className="text-[10px] text-emerald-400 font-medium block">
              Trip Fuel Rate System
            </span>
          </div>
        </div>

        {/* User Mini Profile / System status */}
        <div className="px-4 py-3 bg-slate-800/40 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px]">System Online</span>
          </div>
          <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono">
            v5.0 AdminLTE
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Main Navigation
          </div>

          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/20">
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              Database Loaded
            </span>
            <span className="font-mono text-[10px] text-slate-300">{totalTripsCount.toLocaleString()} รายการ</span>
          </div>
          <p className="text-[10px] text-slate-500">
            ระบบตรวจสอบค่าขนส่งอัตโนมัติ © 2026
          </p>
        </div>
      </aside>
    </>
  );
};
