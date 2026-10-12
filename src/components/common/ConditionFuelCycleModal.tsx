import React, { useState } from 'react';
import {
  X,
  Fuel,
  Building2,
  Calendar,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  ShieldCheck,
  Settings,
  HelpCircle,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import { CustomerFuelCycle, FixedDieselCustomer, DieselPriceRecord } from '../../types';

interface ConditionFuelCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  fuelCycles: CustomerFuelCycle[];
  onUpdateFuelCycles: (cycles: CustomerFuelCycle[]) => void;
  fixedCustomers: FixedDieselCustomer[];
  onUpdateFixedCustomers: (customers: FixedDieselCustomer[]) => void;
  dieselPrices: DieselPriceRecord[];
  companyOptions: string[];
}

export const ConditionFuelCycleModal: React.FC<ConditionFuelCycleModalProps> = ({
  isOpen,
  onClose,
  fuelCycles,
  onUpdateFuelCycles,
  fixedCustomers,
  onUpdateFixedCustomers,
  dieselPrices,
  companyOptions,
}) => {
  // Form State
  const [selectedBranch, setSelectedBranch] = useState<'ทั้งหมด' | 'นวนคร' | 'บางบ่อ'>('นวนคร');
  const [selectedCompany, setSelectedCompany] = useState('Elematec (Thailand) Co.,Ltd');
  const [customCompanyName, setCustomCompanyName] = useState('');
  const [cycleType, setCycleType] = useState<'cycle_21_20' | 'cycle_1_30' | 'fixed_rate' | 'custom_range'>('cycle_21_20');
  const [customRate, setCustomRate] = useState('');
  const [startDay, setStartDay] = useState(21);
  const [endDay, setEndDay] = useState(20);
  const [notes, setNotes] = useState('คำนวณค่าน้ำมันรอบ 21 ชน 20 (เช่น 21/9/2026 - 20/10/2026)');
  const [samplePeriod, setSamplePeriod] = useState('21/9/2026 - 20/10/2026');

  // Edit state
  const [editingCycleId, setEditingCycleId] = useState<string | null>(null);

  if (!isOpen) return null;

  const effectiveCompany = selectedCompany === '__CUSTOM__' ? customCompanyName.trim() : selectedCompany;

  // Handle Quick Presets
  const handleApplyElematecPreset = () => {
    setSelectedBranch('นวนคร');
    setSelectedCompany('Elematec (Thailand) Co.,Ltd');
    setCycleType('cycle_21_20');
    setStartDay(21);
    setEndDay(20);
    setCustomRate('');
    setSamplePeriod('21/9/2026 - 20/10/2026');
    setNotes('ปรับเรทค่าน้ำมันของ Elematec (Thailand) ใช้เรทระหว่าง 21 ชน 20 เช่น 21/9/2026 - 20/10/2026');
  };

  const handleApplySiemensPreset = () => {
    setSelectedBranch('ทั้งหมด');
    setSelectedCompany('SIEMENS');
    setCycleType('fixed_rate');
    setCustomRate('38.00');
    setStartDay(1);
    setEndDay(31);
    setSamplePeriod('สัญญาประจำปี (Fixed 38.00 ฿/L)');
    setNotes('ใช้เรทน้ำมัน 38.00 บาท/ลิตร ตามสัญญา ไม่ผันแปรตามราคาตลาด');
  };

  const handleSaveCondition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveCompany) return;

    const rateVal = parseFloat(customRate);
    const cycleName =
      cycleType === 'cycle_21_20'
        ? `รอบบิล 21 ชน 20 (${effectiveCompany})`
        : cycleType === 'fixed_rate'
        ? `สัญญาเรทน้ำมันคงที่ ${rateVal ? `฿${rateVal.toFixed(2)}` : '38.00'} บาท/ลิตร`
        : cycleType === 'cycle_1_30'
        ? `รอบปฏิทิน 1-30 (${effectiveCompany})`
        : `รอบกำหนดเอง ${startDay}-${endDay}`;

    if (cycleType === 'fixed_rate' && rateVal > 0) {
      // Also ensure fixedCustomers has this company
      const existingFixed = fixedCustomers.find(
        (f) => f.customerName.toLowerCase() === effectiveCompany.toLowerCase()
      );
      if (existingFixed) {
        onUpdateFixedCustomers(
          fixedCustomers.map((f) =>
            f.id === existingFixed.id ? { ...f, fixedDieselRate: rateVal, active: true } : f
          )
        );
      } else {
        onUpdateFixedCustomers([
          {
            id: `fdc-${Date.now()}`,
            customerName: effectiveCompany,
            fixedDieselRate: rateVal,
            notes: notes || 'สัญญาเรทน้ำมันคงที่ตามข้อตกลง',
            active: true,
          },
          ...fixedCustomers,
        ]);
      }
    }

    if (editingCycleId) {
      const updated = fuelCycles.map((c) =>
        c.id === editingCycleId
          ? {
              ...c,
              customerName: effectiveCompany,
              branch: selectedBranch,
              cycleName,
              cycleType,
              startDay: cycleType === 'cycle_21_20' ? 21 : startDay,
              endDay: cycleType === 'cycle_21_20' ? 20 : endDay,
              customRate: !isNaN(rateVal) && rateVal > 0 ? rateVal : undefined,
              samplePeriod: samplePeriod.trim() || undefined,
              notes: notes.trim(),
              updatedAt: new Date().toISOString(),
            }
          : c
      );
      onUpdateFuelCycles(updated);
      setEditingCycleId(null);
    } else {
      const newCycle: CustomerFuelCycle = {
        id: `cycle-${Date.now()}`,
        customerName: effectiveCompany,
        branch: selectedBranch,
        cycleName,
        cycleType,
        startDay: cycleType === 'cycle_21_20' ? 21 : startDay,
        endDay: cycleType === 'cycle_21_20' ? 20 : endDay,
        customRate: !isNaN(rateVal) && rateVal > 0 ? rateVal : undefined,
        samplePeriod: samplePeriod.trim() || (cycleType === 'cycle_21_20' ? '21/9/2026 - 20/10/2026' : undefined),
        notes: notes.trim(),
        active: true,
        updatedAt: new Date().toISOString(),
      };
      onUpdateFuelCycles([newCycle, ...fuelCycles]);
    }

    // Reset Form
    setEditingCycleId(null);
  };

  const handleStartEdit = (cycle: CustomerFuelCycle) => {
    setEditingCycleId(cycle.id);
    setSelectedBranch(cycle.branch || 'ทั้งหมด');
    if (companyOptions.includes(cycle.customerName)) {
      setSelectedCompany(cycle.customerName);
      setCustomCompanyName('');
    } else {
      setSelectedCompany('__CUSTOM__');
      setCustomCompanyName(cycle.customerName);
    }
    setCycleType(cycle.cycleType || (cycle.startDay === 21 && cycle.endDay === 20 ? 'cycle_21_20' : 'cycle_21_20'));
    setStartDay(cycle.startDay);
    setEndDay(cycle.endDay);
    setCustomRate(cycle.customRate ? String(cycle.customRate) : '');
    setSamplePeriod(cycle.samplePeriod || '');
    setNotes(cycle.notes || '');
  };

  const handleToggleCycle = (id: string) => {
    onUpdateFuelCycles(fuelCycles.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
  };

  const handleDeleteCycle = (id: string) => {
    onUpdateFuelCycles(fuelCycles.filter((c) => c.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <SlidersHorizontal className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider">
                  MASTER CONDITION RULES
                </span>
                <span className="text-xs text-white/80">ระบบควบคุมเงื่อนไขราคาและรอบบิล</span>
              </div>
              <h3 className="font-extrabold text-base tracking-tight text-white mt-0.5">
                หน้าต่างเงื่อนไข & เลือกรอบค่าน้ำมัน (Fuel Rate & Condition Rules Selector)
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Quick Presets Bar */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>คำสั่งลัดปรับเงื่อนไขด่วน (Quick Presets):</span>
              </span>
              <span className="text-[11px] text-slate-400">คลิกเพื่อเลือกและกรอกข้อมูลทันที</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleApplyElematecPreset}
                className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 transition-colors"
              >
                <Fuel className="w-3.5 h-3.5 text-purple-600" />
                <span>⚡ Elematec (Thailand) รอบ 21 ชน 20 (เช่น 21/9/2026 - 20/10/2026)</span>
              </button>

              <button
                type="button"
                onClick={handleApplySiemensPreset}
                className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>⚡ SIEMENS สัญญาเรทน้ำมันคงที่ 38.00 บาท/ลิตร</span>
              </button>
            </div>
          </div>

          {/* Form: Add or Edit Condition Rule */}
          <form onSubmit={handleSaveCondition} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600" />
                <span>{editingCycleId ? 'แก้ไขข้อมูลเงื่อนไข' : 'เพิ่ม / กำหนดเงื่อนไขรอบค่าน้ำมัน (Add Condition Rule)'}</span>
              </h4>
              {editingCycleId && (
                <button
                  type="button"
                  onClick={() => setEditingCycleId(null)}
                  className="text-xs text-rose-500 hover:underline"
                >
                  ยกเลิกการแก้ไข
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Branch */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>1. เลือก สาขา (Branch):</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                  {(['ทั้งหมด', 'นวนคร', 'บางบ่อ'] as const).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedBranch(b)}
                      className={`py-1.5 text-center rounded font-semibold text-xs transition-all ${
                        selectedBranch === b
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Company */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-500" />
                  <span>2. เลือก บริษัท (Company):</span>
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Elematec (Thailand) Co.,Ltd">Elematec (Thailand) Co.,Ltd</option>
                  <option value="SIEMENS">SIEMENS / SIEMENS LIMITED</option>
                  <option value="ROLAND">ROLAND (BLC บางบ่อ)</option>
                  <option value="AJITRADE (THAILAND) CO.,LTD.">AJITRADE (THAILAND) CO.,LTD.</option>
                  {companyOptions
                    .filter(
                      (c) =>
                        c !== 'ALL' &&
                        !['Elematec (Thailand) Co.,Ltd', 'SIEMENS', 'ROLAND', 'AJITRADE (THAILAND) CO.,LTD.'].includes(c)
                    )
                    .slice(0, 15)
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  <option value="__CUSTOM__">+ ระบุชื่อบริษัทอื่น...</option>
                </select>

                {selectedCompany === '__CUSTOM__' && (
                  <input
                    type="text"
                    placeholder="พิมพ์ชื่อบริษัทที่ต้องการ..."
                    value={customCompanyName}
                    onChange={(e) => setCustomCompanyName(e.target.value)}
                    className="w-full mt-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white"
                  />
                )}
              </div>

              {/* Cycle Type */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5 text-amber-500" />
                  <span>3. เลือกช่วงเรท / รอบราคาน้ำมัน:</span>
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={cycleType}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setCycleType(val);
                    if (val === 'cycle_21_20') {
                      setStartDay(21);
                      setEndDay(20);
                      setSamplePeriod('21/9/2026 - 20/10/2026');
                    } else if (val === 'fixed_rate') {
                      setCustomRate('38.00');
                      setSamplePeriod('ตามสัญญา (Fixed Rate)');
                    } else if (val === 'cycle_1_30') {
                      setStartDay(1);
                      setEndDay(30);
                      setSamplePeriod('1/9/2026 - 30/9/2026');
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cycle_21_20">⛽ รอบ 21 ชน 20 (เช่น 21/9/2026 - 20/10/2026)</option>
                  <option value="fixed_rate">🛡️ สัญญาเรทคงที่ (Fixed Diesel Contract เช่น 38.00 ฿/L)</option>
                  <option value="cycle_1_30">📅 รอบปฏิทิน 1 ชน สิ้นเดือน (Monthly Calendar Avg)</option>
                  <option value="custom_range">✏️ กำหนดวันเริ่มต้น - สิ้นสุดเอง</option>
                </select>
              </div>
            </div>

            {/* Row 2: Detail parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
              {/* Sample Period or Days */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>ตัวอย่างงวด / วันรอบบิล:</span>
                </label>
                <input
                  type="text"
                  value={samplePeriod}
                  onChange={(e) => setSamplePeriod(e.target.value)}
                  placeholder="เช่น 21/9/2026 - 20/10/2026"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white"
                />
              </div>

              {/* Custom Diesel Rate override */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>เรทน้ำมันสัญญาคงที่ / กำหนดเอง (฿/L):</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={customRate}
                    onChange={(e) => setCustomRate(e.target.value)}
                    placeholder={cycleType === 'fixed_rate' ? '38.00' : 'ปล่อยว่างหากคำนวณตามจริง'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white font-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 text-xs">บาท/ลิตร</span>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  หมายเหตุ / เงื่อนไข:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="เช่น ใช้เรทน้ำมัน 21 ชน 20 ตามสัญญา Elematec"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                <span>
                  {cycleType === 'cycle_21_20'
                    ? 'ระบบจะนำราคาน้ำมันระหว่างวันที่ 21 ถึง 20 มาเฉลี่ยแล้วใช้ค้นหา Bracket ใน Rate Card อัตโนมัติ'
                    : cycleType === 'fixed_rate'
                    ? 'ระบบจะใช้เรทนี้เป็นตัวเลขตรงๆ ไปค้นหา Bracket ใน Rate Card โดยตรง ไม่ผันแปรตามตลาด'
                    : 'ระบบจะนำค่าเฉลี่ยรายเดือนมาคำนวณ'}
                </span>
              </div>

              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{editingCycleId ? 'บันทึกการแก้ไข' : '➕ เพิ่มข้อมูลเงื่อนไข (Add Condition)'}</span>
              </button>
            </div>
          </form>

          {/* Active Condition Rules List Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>รายการเงื่อนไขและรอบค่าน้ำมันที่เปิดใช้งานอยู่ ({fuelCycles.length} รายการ)</span>
              </h4>
              <span className="text-[11px] text-slate-400">มีผลต่อการคำนวณบิลของบริษัทและสาขาที่ระบุทันที</span>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">บริษัท / ลูกค้า</th>
                      <th className="py-2.5 px-3">สาขา</th>
                      <th className="py-2.5 px-3">รูปแบบรอบน้ำมัน / เงื่อนไข</th>
                      <th className="py-2.5 px-3 text-center">ตัวอย่างงวด / เรท</th>
                      <th className="py-2.5 px-3 text-center">สถานะ</th>
                      <th className="py-2.5 px-3 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                    {fuelCycles.map((cycle, idx) => (
                      <tr key={cycle.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                          {cycle.customerName}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {cycle.branch || 'ทั้งหมด'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-blue-600 dark:text-blue-400">
                            {cycle.cycleName}
                          </div>
                          {cycle.notes && (
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">{cycle.notes}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {cycle.customRate ? (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              ฿{cycle.customRate.toFixed(2)} / L
                            </span>
                          ) : (
                            <span className="text-slate-600 dark:text-slate-300 font-semibold">
                              {cycle.samplePeriod || `${cycle.startDay} ชน ${cycle.endDay}`}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleCycle(cycle.id)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                              cycle.active
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                            }`}
                          >
                            {cycle.active ? 'ใช้งาน (Active)' : 'ปิดใช้งาน'}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(cycle)}
                              className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                              title="แก้ไขเงื่อนไข"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCycle(cycle.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                              title="ลบเงื่อนไข"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-purple-500" />
            <span>การปรับเปลี่ยนเงื่อนไขจะมีผลต่อการคำนวณเรทและ Bracket ของเที่ยวรถทันที</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
