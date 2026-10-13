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
  Clock,
  Layers,
  FileText,
  DollarSign,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import {
  CustomerFuelCycle,
  CustomerRateConfig,
  FixedDieselCustomer,
  DieselPriceRecord,
} from '../../types';
import { saveCustomerRateConfigsToSupabase } from '../../services/supabaseService';

interface ConditionFuelCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  fuelCycles?: CustomerFuelCycle[];
  onUpdateFuelCycles?: (cycles: CustomerFuelCycle[]) => void;
  fixedCustomers?: FixedDieselCustomer[];
  onUpdateFixedCustomers?: (customers: FixedDieselCustomer[]) => void;
  customerRateConfigs?: CustomerRateConfig[];
  onUpdateCustomerRateConfigs?: (configs: CustomerRateConfig[]) => void;
  dieselPrices: DieselPriceRecord[];
  companyOptions: string[];
}

export const ConditionFuelCycleModal: React.FC<ConditionFuelCycleModalProps> = ({
  isOpen,
  onClose,
  fuelCycles = [],
  onUpdateFuelCycles,
  fixedCustomers = [],
  onUpdateFixedCustomers,
  customerRateConfigs = [],
  onUpdateCustomerRateConfigs,
  dieselPrices,
  companyOptions,
}) => {
  // Active Tab: 5 Fuel Modes vs Bang Bo (YBLC) Terms & Conditions
  const [activeTab, setActiveTab] = useState<'fuelModes' | 'bangboTerms'>('fuelModes');

  // Form State for 5 Customer Rate Modes
  const [selectedBranch, setSelectedBranch] = useState<'YNLC' | 'YBLC' | 'ทั้งหมด'>('YNLC');
  const [selectedCompany, setSelectedCompany] = useState('ROLAND');
  const [customCompanyName, setCustomCompanyName] = useState('');
  const [rateMode, setRateMode] = useState<'daily' | 'week' | 'monthly' | 'fix' | 'range'>('daily');
  const [fixFuelPrice, setFixFuelPrice] = useState('38.00');
  const [rangeStart, setRangeStart] = useState('2026-09-25');
  const [rangeEnd, setRangeEnd] = useState('2026-10-26');
  const [rangeNote, setRangeNote] = useState('25/9/26-26/10/26');
  const [remark, setRemark] = useState('');
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [copiedTerms, setCopiedTerms] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);

  if (!isOpen) return null;

  const effectiveCompany = selectedCompany === '__CUSTOM__' ? customCompanyName.trim() : selectedCompany;

  // Preset Presets
  const applyPreset = (presetKey: string) => {
    switch (presetKey) {
      case 'ROLAND':
        setSelectedBranch('YBLC');
        setSelectedCompany('ROLAND');
        setRateMode('daily');
        setRemark('สาขาบางบ่อ (YBLC) คิดเรทน้ำมันรายวันตาม Issue Date');
        break;
      case 'HITACHI_HIGH_TECH':
        setSelectedBranch('YNLC');
        setSelectedCompany('HITACHI HIGH-TECH');
        setRateMode('daily');
        setRemark('สาขานวนคร (YNLC) ใช้น้ำมันรายวัน Spot Price');
        break;
      case 'NICHICON':
        setSelectedBranch('YNLC');
        setSelectedCompany('NICHICON');
        setRateMode('week');
        setRemark('คิดเรทเฉลี่ยรายสัปดาห์ (Week Rate) จันทร์-อาทิตย์');
        break;
      case 'CHUKOH':
        setSelectedBranch('YNLC');
        setSelectedCompany('Chukoh Chemical');
        setRateMode('week');
        setRemark('คิดเรทเฉลี่ยรายสัปดาห์ (Weekly Average)');
        break;
      case 'MACNICA':
        setSelectedBranch('YNLC');
        setSelectedCompany('MACNICA');
        setRateMode('monthly');
        setRemark('เฉลี่ยรายเดือน (1-30)');
        break;
      case 'PANASONIC':
        setSelectedBranch('YNLC');
        setSelectedCompany('PANASONIC');
        setRateMode('monthly');
        setRemark('เฉลี่ยรายเดือน (1-30)');
        break;
      case 'HITACHI_ASIA':
        setSelectedBranch('YNLC');
        setSelectedCompany('HITACHI ASIA');
        setRateMode('monthly');
        setRemark('เฉลี่ยรายเดือน (1-30)');
        break;
      case 'SIEMENS':
        setSelectedBranch('YBLC');
        setSelectedCompany('SIEMENS');
        setRateMode('fix');
        setFixFuelPrice('38.00');
        setRemark('สัญญาตรึงราคาน้ำมัน 38.00 บาท/ลิตร บางบ่อ (YBLC)');
        break;
      case 'AISAN':
        setSelectedBranch('YNLC');
        setSelectedCompany('AISAN');
        setRateMode('fix');
        setFixFuelPrice('38.00');
        setRemark('สัญญาคงที่ตามที่ตกลงในสัญญา (Fix Rate 38.00 ฿/L)');
        break;
      case 'DAITRON':
        setSelectedBranch('YNLC');
        setSelectedCompany('DAITRON');
        setRateMode('fix');
        setFixFuelPrice('38.00');
        setRemark('สัญญาคงที่ตามที่ตกลงในสัญญา (Fix Rate 38.00 ฿/L)');
        break;
      case 'SENKO':
        setSelectedBranch('YNLC');
        setSelectedCompany('SENKO');
        setRateMode('range');
        setRangeStart('2026-09-25');
        setRangeEnd('2026-10-26');
        setRangeNote('25/9/26-26/10/26');
        setRemark('ใช้ราคาตามช่วงวันที่กำหนด 25/9/26 - 26/10/26');
        break;
      case 'ELEMATEC':
        setSelectedBranch('YNLC');
        setSelectedCompany('Elematec (Thailand) Co.,Ltd');
        setRateMode('range');
        setRangeStart('2026-09-21');
        setRangeEnd('2026-10-20');
        setRangeNote('21/9/26-20/10/26 (รอบ 21 ชน 20)');
        setRemark('รอบบิล 21 ชน 20 (21/9/26 - 20/10/26)');
        break;
      case 'AJITRADE':
        setSelectedBranch('YNLC');
        setSelectedCompany('AJITRADE (THAILAND) CO.,LTD.');
        setRateMode('monthly');
        setRemark('ศรีมหาโพธิ์ เรทน้ำมัน 40.69 วิ่งที่ 3520 บาท, ค่าดรอป 500 บาท, ค่าคอนโซล 500 บาท, ไม่มี Fuel Surcharge, ไม่มีค่าทางด่วน');
        break;
      default:
        break;
    }
  };

  const handleSaveCustomerConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveCompany || !onUpdateCustomerRateConfigs) return;

    const fixPriceNum = parseFloat(fixFuelPrice) || 38.0;

    const newConfig: CustomerRateConfig = {
      id: editingConfigId || `crc-${Date.now()}`,
      branch: selectedBranch,
      customer_name: effectiveCompany,
      daily_rate: rateMode === 'daily',
      week_rate: rateMode === 'week',
      monthly_rate: rateMode === 'monthly',
      fix_rate: rateMode === 'fix',
      fuel_range: rateMode === 'range',
      fix_fuel_price: rateMode === 'fix' ? fixPriceNum : undefined,
      fuel_range_start: rateMode === 'range' ? rangeStart : undefined,
      fuel_range_end: rateMode === 'range' ? rangeEnd : undefined,
      fuel_range_note: rateMode === 'range' ? rangeNote : undefined,
      remark: remark.trim() || undefined,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    let updatedConfigs: CustomerRateConfig[];
    if (editingConfigId) {
      updatedConfigs = customerRateConfigs.map((c) =>
        c.id === editingConfigId ? newConfig : c
      );
    } else {
      // Remove existing for same customer and branch if any, then prepend
      const filtered = customerRateConfigs.filter(
        (c) => !(c.customer_name.toLowerCase() === effectiveCompany.toLowerCase() && c.branch === selectedBranch)
      );
      updatedConfigs = [newConfig, ...filtered];
    }

    onUpdateCustomerRateConfigs(updatedConfigs);

    // Save to Supabase in background
    setIsSavingCloud(true);
    try {
      await saveCustomerRateConfigsToSupabase(updatedConfigs);
    } finally {
      setIsSavingCloud(false);
    }

    // Reset Form
    setEditingConfigId(null);
  };

  const handleStartEdit = (cfg: CustomerRateConfig) => {
    setEditingConfigId(cfg.id);
    setSelectedBranch(cfg.branch as any || 'YNLC');
    if (companyOptions.includes(cfg.customer_name)) {
      setSelectedCompany(cfg.customer_name);
      setCustomCompanyName('');
    } else {
      setSelectedCompany('__CUSTOM__');
      setCustomCompanyName(cfg.customer_name);
    }
    if (cfg.daily_rate) setRateMode('daily');
    else if (cfg.week_rate) setRateMode('week');
    else if (cfg.monthly_rate) setRateMode('monthly');
    else if (cfg.fix_rate) setRateMode('fix');
    else if (cfg.fuel_range) setRateMode('range');

    if (cfg.fix_fuel_price) setFixFuelPrice(String(cfg.fix_fuel_price));
    if (cfg.fuel_range_start) setRangeStart(cfg.fuel_range_start);
    if (cfg.fuel_range_end) setRangeEnd(cfg.fuel_range_end);
    if (cfg.fuel_range_note) setRangeNote(cfg.fuel_range_note);
    if (cfg.remark) setRemark(cfg.remark);
  };

  const handleToggleActive = async (id: string) => {
    if (!onUpdateCustomerRateConfigs) return;
    const updated = customerRateConfigs.map((c) =>
      c.id === id ? { ...c, is_active: !c.is_active } : c
    );
    onUpdateCustomerRateConfigs(updated);
    await saveCustomerRateConfigsToSupabase(updated);
  };

  const handleDeleteConfig = async (id: string) => {
    if (!onUpdateCustomerRateConfigs) return;
    if (confirm('คุณต้องการลบการตั้งค่าเรทลูกค้ารายนี้หรือไม่?')) {
      const updated = customerRateConfigs.filter((c) => c.id !== id);
      onUpdateCustomerRateConfigs(updated);
      await saveCustomerRateConfigsToSupabase(updated);
    }
  };

  // Yusen Bang Bo (YBLC) 12 Other Terms and Conditions
  const BANGBO_CONDITIONS = [
    {
      num: 1,
      title: 'Exclude Port Tariff & VAT (ยกเว้นค่าธรรมเนียมท่าเรือ/VAT)',
      content: 'Above rates are only transportation charges, which are excluded the port tariff (Gate charge, Terminal handling charge, etc.) and VAT.',
      thai: 'เรทข้างต้นเป็นเพียงค่าบริการขนส่งเท่านั้น ไม่รวมค่าธรรมเนียมท่าเรือ (Gate charge, THC ฯลฯ) และภาษีมูลค่าเพิ่ม VAT 7%',
    },
    {
      num: 2,
      title: 'Monthly Diesel Adjustment (ปรับตามราคาน้ำมันดีเซล BKK B7 เดือนก่อนหน้า)',
      content: 'The transportation rate of this month shall be adjusted monthly base on the average BKK\'s diesel B7 price of previous month.',
      thai: 'อัตราค่าขนส่งของเดือนนี้จะถูกปรับตามค่าเฉลี่ยราคาน้ำมันดีเซล B7 ในกรุงเทพฯ ของ "เดือนก่อนหน้า" (Previous Month Average)',
    },
    {
      num: 3,
      title: 'Working Hours & Overtime Rate (เวลาทำการและค่าล่วงเวลา OT)',
      content: 'YUSEN Logistics transportation service working day and hour is Monday to Friday 08:00 – 18:00 Hrs. In case requests other than normal hour, overtime fee:\n• Monday – Friday: 300 Baht/Trip/4W, 6W or 10W\n• Saturday, Sunday and National Holiday: 1,000 Baht/Trip/4W, 6W or 10W',
      thai: 'เวลาทำการ จันทร์–ศุกร์ 08:00–18:00 น. หากร้องขอนอกเวลาคิดค่า OT: จ-ศ 300 บาท/เที่ยว (4W, 6W, 10W) | ส-อา และวันหยุดนักขัตฤกษ์ 1,000 บาท/เที่ยว',
    },
    {
      num: 4,
      title: 'Multiple Drops in Same Province (ค่าดรอปในจังหวัดเดียวกัน)',
      content: 'If there are multiple drops in the same province, drop charge 500 Baht/drop will be applied.',
      thai: 'กรณีส่งหลายจุดในจังหวัดเดียวกัน คิดค่าดรอป 500 บาท/จุด (Drop Charge 500 Baht/drop)',
    },
    {
      num: 5,
      title: 'Loading & Unloading Manpower (ค่าแรงงานยกของขึ้น–ลง)',
      content: 'Loading and unloading should be managed by the customer. In case of using manpower, 500 Baht/manpower will be applied (1 manpower for 4W and 2 manpower for 6W, 10W).',
      thai: 'ลูกค้าจัดการขึ้น–ลงสินค้าเอง หากใช้คนยกคิด 500 บาท/คน (รถ 4W ใช้ 1 คน = 500 ฿, รถ 6W และ 10W ใช้ 2 คน = 1,000 ฿)',
    },
    {
      num: 6,
      title: 'Waiting Time Charge (ค่ารอโหลดเกิน 2 ชั่วโมง)',
      content: 'If waiting time from truck gate in until gate out is over 2 hour/4W, 6W, 10W, waiting charge 500 Baht/hour shall be applied.',
      thai: 'เวลารอจาก Gate in จนถึง Gate out เกิน 2 ชั่วโมง (4W, 6W, 10W) คิดค่ารอชั่วโมงละ 500 บาท',
    },
    {
      num: 7,
      title: 'Backhaul Trip Charge (เที่ยวขากลับ Backhaul)',
      content: 'Backhaul trip will be charge 50% of normal trip by truck type.',
      thai: 'เที่ยวขากลับคิด 50% ของเรทเที่ยวปกติ ตามประเภทรถ',
    },
    {
      num: 8,
      title: 'Cancellation Truck Charge (ค่ายกเลิกเที่ยวรถ)',
      content: 'Cancellation truck will be charge 50% of normal trip by truck type, 3 hours informed in advance.',
      thai: 'ยกเลิกรถคิด 50% ของเที่ยวปกติ โดยต้องแจ้งล่วงหน้าอย่างน้อย 3 ชั่วโมง',
    },
    {
      num: 9,
      title: 'Overnight Charge at Factory (ค่าค้างคืนที่โรงงาน)',
      content: 'Overnight charge at factory according to customer\'s request is 2,500 Baht/day/ 4W, 6W & 10W (start from 20:00 to 8:00 next day, besides that waiting time will apply).',
      thai: 'ค้างคืนที่โรงงานตามคำขอลูกค้า 2,500 บาท/วัน/คัน (เริ่ม 20:00 ถึง 08:00 วันถัดไป นอกเหนือจากนี้คิดค่ารอโหลด)',
    },
    {
      num: 10,
      title: 'Cargo Damage Liability Limit (วงเงินจำกัดความรับผิดจากอุบัติเหตุ)',
      content: 'The liability limit of cargo damage from an accident during transportation will be covered at 500,000 Baht per trip for 4W and 1,000,000 Baht per trip for 6W & 10W under QA/QC report from customer only.',
      thai: 'วงเงินคุ้มครองความเสียหาย 500,000 บาท/เที่ยว (4W) และ 1,000,000 บาท/เที่ยว (6W & 10W) ภายใต้รายงาน QA/QC ของลูกค้าเท่านั้น',
    },
    {
      num: 11,
      title: 'Outer Carton Damage & 24hr Notice (การแจ้งเคลมกล่องชำรุด)',
      content: 'If damage of outer carton found when receiving, customer shall note on returned Delivery Note for such incident, then check cargo and report to Yusen within 24 hours. Otherwise complete delivery with good condition.',
      thai: 'หากพบลักษณะกล่องภายนอกชำรุด ให้ระบุในใบส่งสินค้า (Delivery Note) และแจ้ง Yusen ภายใน 24 ชม. มิฉะนั้นถือว่าส่งมอบสินค้าสมบูรณ์',
    },
    {
      num: 12,
      title: 'Additional Charge at Actual Cost & Payment (ค่าใช้จ่ายจริงและกำหนดชำระ)',
      content: '• Additional charge (if any) at actual cost.\n• Payment shall be made to us within 30 days after receiving our debit note.\n• Rate effective until 31 December 2025.',
      thai: '• ค่าใช้จ่ายเพิ่มเติมคิดตามค่าใช้จ่ายจริง\n• ชำระเงินภายใน 30 วันหลังได้รับ Debit Note\n• อัตรานี้มีผลบังคับใช้จนถึง 31 ธันวาคม 2025',
    },
  ];

  const handleCopyBangBoTerms = () => {
    const text = BANGBO_CONDITIONS.map(
      (c) => `${c.num}. ${c.title}\n${c.content}\n(${c.thai})`
    ).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedTerms(true);
    setTimeout(() => setCopiedTerms(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <SlidersHorizontal className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider">
                  Transport Customer Rate Config
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-900">
                  5 โหมดค่าน้ำมัน + เรทบางบ่อ (YBLC)
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
                ตั้งค่าโหมดคิดเรทค่าน้ำมันรายลูกค้า & เงื่อนไขสัญญาบางบ่อ
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('fuelModes')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === 'fuelModes'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Fuel className="w-4 h-4" />
            <span>โหมดคิดเรทน้ำมันรายลูกค้า (5 โหมด: Daily/Week/Monthly/Fix/Range)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              {customerRateConfigs.length} บริษัท
            </span>
          </button>
          <button
            onClick={() => setActiveTab('bangboTerms')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === 'bangboTerms'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 border-purple-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-500" />
            <span>เงื่อนไขเรทบางบ่อ (YBLC Other Terms & Condition 12 ข้อ)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              12 ข้อกำหนด
            </span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'fuelModes' ? (
            <>
              {/* Quick Preset Buttons */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    ทางลัดตั้งค่าลูกค้ารายสำคัญ (Customer Presets ตามโจทย์):
                  </span>
                  <span className="text-[11px] text-slate-400">คลิกเพื่อโหลดการตั้งค่าของลูกค้ารายนั้น</span>
                </div>
                <div className="flex items-center flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('ROLAND')}
                    className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    ⚡ ROLAND (บางบ่อ Daily)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('HITACHI_HIGH_TECH')}
                    className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    ⚡ HITACHI HIGH-TECH (Daily)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('NICHICON')}
                    className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    📅 NICHICON (Week Rate)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('CHUKOH')}
                    className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    📅 Chukoh Chemical (Week Rate)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('MACNICA')}
                    className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    🗓️ MACNICA (Monthly 1-30)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('PANASONIC')}
                    className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    🗓️ PANASONIC (Monthly 1-30)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('SIEMENS')}
                    className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    🔒 SIEMENS (Fix 38.00 ฿/L บางบ่อ)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('AISAN')}
                    className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    🔒 AISAN (Fix 38.00 ฿/L)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('SENKO')}
                    className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    ⏱️ SENKO (25/9/26-26/10/26)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('ELEMATEC')}
                    className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    ⏱️ ELEMATEC (21/9/26-20/10/26)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('AJITRADE')}
                    className="px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    🎯 AJITRADE (ศรีมหาโพธิ์ 3,520฿ / Drop 500฿ / Consold 500฿)
                  </button>
                </div>
              </div>

              {/* Add / Edit Form */}
              <form onSubmit={handleSaveCustomerConfig} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span>{editingConfigId ? 'แก้ไขการตั้งค่าโหมดคิดเรทลูกค้า' : 'เพิ่มการตั้งค่าโหมดคิดเรทลูกค้า (New Customer Config)'}</span>
                  </h4>
                  {editingConfigId && (
                    <button
                      type="button"
                      onClick={() => setEditingConfigId(null)}
                      className="text-xs text-rose-500 hover:underline"
                    >
                      ยกเลิกการแก้ไข
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Branch */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      สาขา (Branch)
                    </label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold"
                    >
                      <option value="YNLC">YNLC - สาขานวนคร (Nava Nakorn)</option>
                      <option value="YBLC">YBLC - สาขาบางบ่อ (Bang Bo)</option>
                      <option value="ทั้งหมด">ทุกสาขา (All Branches)</option>
                    </select>
                  </div>

                  {/* Customer */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ชื่อบริษัทลูกค้า (Customer Name)
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-xs font-medium"
                      >
                        <option value="ROLAND">ROLAND</option>
                        <option value="HITACHI HIGH-TECH">HITACHI HIGH-TECH</option>
                        <option value="NICHICON">NICHICON</option>
                        <option value="Chukoh Chemical">Chukoh Chemical</option>
                        <option value="MACNICA">MACNICA</option>
                        <option value="PANASONIC">PANASONIC</option>
                        <option value="HITACHI ASIA">HITACHI ASIA</option>
                        <option value="SIEMENS">SIEMENS</option>
                        <option value="AISAN">AISAN</option>
                        <option value="DAITRON">DAITRON</option>
                        <option value="SENKO">SENKO</option>
                        <option value="Elematec (Thailand) Co.,Ltd">Elematec (Thailand) Co.,Ltd</option>
                        <option value="AJITRADE (THAILAND) CO.,LTD.">AJITRADE (THAILAND) CO.,LTD.</option>
                        {companyOptions.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        <option value="__CUSTOM__">➕ ระบุชื่อบริษัทอื่น...</option>
                      </select>
                      {selectedCompany === '__CUSTOM__' && (
                        <input
                          type="text"
                          placeholder="พิมพ์ชื่อบริษัท..."
                          value={customCompanyName}
                          onChange={(e) => setCustomCompanyName(e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-xs"
                          autoFocus
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* 5 Fuel Rate Modes (Cards) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    เลือกโหมดการคิดเรทน้ำมัน (Fuel Rate Mode - 5 รูปแบบ):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                    {/* Mode 1: Daily */}
                    <div
                      onClick={() => setRateMode('daily')}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        rateMode === 'daily'
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          ⚡ Daily Rate
                        </span>
                        {rateMode === 'daily' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        ใช้น้ำมันของวันนั้นตาม Issue Date (เช่น ROLAND, HITACHI HIGH-TECH)
                      </p>
                    </div>

                    {/* Mode 2: Week */}
                    <div
                      onClick={() => setRateMode('week')}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        rateMode === 'week'
                          ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          📅 Week Rate
                        </span>
                        {rateMode === 'week' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        ใช้น้ำมันเฉลี่ยรายสัปดาห์ จ-อา (เช่น NICHICON, Chukoh Chemical)
                      </p>
                    </div>

                    {/* Mode 3: Monthly */}
                    <div
                      onClick={() => setRateMode('monthly')}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        rateMode === 'monthly'
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          🗓️ Monthly Rate
                        </span>
                        {rateMode === 'monthly' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        เฉลี่ยทั้งเดือน 1-30 หรือเดือนก่อนหน้าบางบ่อ (MACNICA, PANASONIC)
                      </p>
                    </div>

                    {/* Mode 4: Fix */}
                    <div
                      onClick={() => setRateMode('fix')}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        rateMode === 'fix'
                          ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/40 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          🔒 Fix Rate
                        </span>
                        {rateMode === 'fix' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        ราคาคงที่ตามสัญญา ไม่ปรับตามตลาด (SIEMENS, AISAN, DAITRON)
                      </p>
                    </div>

                    {/* Mode 5: Range */}
                    <div
                      onClick={() => setRateMode('range')}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        rateMode === 'range'
                          ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          ⏱️ Fuel Range
                        </span>
                        {rateMode === 'range' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        ราคาตามช่วงวันที่กำหนด เช่น 25/9-26/10 หรือ 21-20 (SENKO, ELEMATEC)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Conditional Inputs depending on mode */}
                {rateMode === 'fix' && (
                  <div className="bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 flex items-center gap-4">
                    <div className="w-48">
                      <label className="block text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
                        ราคาน้ำมันคงที่ (บาท/ลิตร) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={fixFuelPrice}
                          onChange={(e) => setFixFuelPrice(e.target.value)}
                          className="w-full px-3 py-1.5 border border-amber-300 dark:border-amber-700 rounded-lg bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
                        />
                        <span className="absolute right-3 top-1.5 text-xs text-slate-400 font-bold">฿/L</span>
                      </div>
                    </div>
                    <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                      💡 สัญญาล็อคเรทน้ำมันคงที่ตามข้อตกลงสัญญา (เช่น Siemens ตรึงที่ 38.00 บาท/ลิตร) ระบบจะนำเรทนี้ไปค้นหา Bracket ทันที
                    </div>
                  </div>
                )}

                {rateMode === 'range' && (
                  <div className="bg-teal-50/60 dark:bg-teal-950/20 p-4 rounded-xl border border-teal-200 dark:border-teal-800/60 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-teal-900 dark:text-teal-200 mb-1">
                        วันที่เริ่มต้น (Start Date) *
                      </label>
                      <input
                        type="date"
                        value={rangeStart}
                        onChange={(e) => setRangeStart(e.target.value)}
                        className="w-full px-3 py-1.5 border border-teal-300 dark:border-teal-700 rounded-lg bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-teal-900 dark:text-teal-200 mb-1">
                        วันที่สิ้นสุด (End Date) *
                      </label>
                      <input
                        type="date"
                        value={rangeEnd}
                        onChange={(e) => setRangeEnd(e.target.value)}
                        className="w-full px-3 py-1.5 border border-teal-300 dark:border-teal-700 rounded-lg bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-teal-900 dark:text-teal-200 mb-1">
                        ข้อความแสดงผล (Note)
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น 25/9/26-26/10/26"
                        value={rangeNote}
                        onChange={(e) => setRangeNote(e.target.value)}
                        className="w-full px-3 py-1.5 border border-teal-300 dark:border-teal-700 rounded-lg bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Remark */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    หมายเหตุ / เงื่อนไขเฉพาะ (Remark)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ศรีมหาโพธิ์ 3,520 บาท, ค่าดรอป 500 บาท, ค่าคอนโซล 500 บาท..."
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={!effectiveCompany}
                    className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingConfigId ? 'บันทึกการแก้ไข' : 'บันทึกโหมดคิดเรทลูกค้า (Sync Cloud)'}</span>
                  </button>
                </div>
              </form>

              {/* Table of Customer Rate Configs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>ตารางการตั้งค่ารายบริษัท (Customer Rate Configs)</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    ข้อมูลซิงค์กับตาราง transport_customer_rate_config ใน Supabase
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">สาขา</th>
                          <th className="py-2.5 px-3">ชื่อบริษัทลูกค้า</th>
                          <th className="py-2.5 px-3">โหมดที่เลือก (Fuel Mode)</th>
                          <th className="py-2.5 px-3">รายละเอียดเรท / ช่วงเวลา</th>
                          <th className="py-2.5 px-3">หมายเหตุ</th>
                          <th className="py-2.5 px-3 text-center">สถานะ</th>
                          <th className="py-2.5 px-3 text-center">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                        {customerRateConfigs.map((cfg, idx) => {
                          const modeBadge = cfg.daily_rate
                            ? { label: '⚡ Daily Rate', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' }
                            : cfg.week_rate
                            ? { label: '📅 Week Rate', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' }
                            : cfg.monthly_rate
                            ? { label: '🗓️ Monthly Rate', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' }
                            : cfg.fix_rate
                            ? { label: '🔒 Fix Rate', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' }
                            : cfg.fuel_range
                            ? { label: '⏱️ Fuel Range', color: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' }
                            : { label: 'มาตรฐาน', color: 'bg-slate-100 text-slate-700' };

                          return (
                            <tr key={cfg.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                              <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  cfg.branch === 'YBLC' || cfg.branch === 'บางบ่อ'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                }`}>
                                  {cfg.branch}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                                {cfg.customer_name}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${modeBadge.color}`}>
                                  {modeBadge.label}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono">
                                {cfg.fix_rate && cfg.fix_fuel_price ? (
                                  <span className="font-bold text-amber-600 dark:text-amber-400">
                                    ฿{cfg.fix_fuel_price.toFixed(2)} / L
                                  </span>
                                ) : cfg.fuel_range ? (
                                  <span className="text-teal-600 dark:text-teal-400 font-semibold">
                                    {cfg.fuel_range_note || `${cfg.fuel_range_start} ถึง ${cfg.fuel_range_end}`}
                                  </span>
                                ) : cfg.daily_rate ? (
                                  <span className="text-blue-600 dark:text-blue-400">ราคา ณ วันออกบิล</span>
                                ) : cfg.week_rate ? (
                                  <span className="text-emerald-600 dark:text-emerald-400">เฉลี่ยรอบสัปดาห์</span>
                                ) : (
                                  <span className="text-indigo-600 dark:text-indigo-400">เฉลี่ย 1-30</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-[11px] text-slate-500 max-w-xs truncate" title={cfg.remark}>
                                {cfg.remark || '-'}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleActive(cfg.id)}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                    cfg.is_active
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                  }`}
                                >
                                  {cfg.is_active ? 'Active' : 'ปิดใช้งาน'}
                                </button>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(cfg)}
                                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                    title="แก้ไข"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteConfig(cfg.id)}
                                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                    title="ลบ"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Bang Bo (YBLC) Terms & Conditions 12 Rules */
            <div className="space-y-4">
              <div className="p-4 bg-purple-50/70 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-purple-950 dark:text-purple-200 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-purple-600" />
                    <span>YUSEN Logistics (Thailand) — สาขาบางบ่อ (YBLC) Other Terms & Condition</span>
                  </h4>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                    เงื่อนไขและข้อกำหนดมาตรฐาน 12 ข้อ มีผลบังคับใช้จนถึง 31 ธันวาคม 2025
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyBangBoTerms}
                  className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  {copiedTerms ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedTerms ? 'คัดลอกเรียบร้อย!' : 'คัดลอกเงื่อนไขทั้งหมด'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {BANGBO_CONDITIONS.map((cond) => (
                  <div
                    key={cond.num}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs hover:border-purple-300 transition-all"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {cond.num}
                      </span>
                      <div className="space-y-1">
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                          {cond.title}
                        </h5>
                        <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                          {cond.content}
                        </p>
                        <p className="text-[11px] text-purple-700 dark:text-purple-400 bg-purple-50/60 dark:bg-purple-950/40 p-1.5 rounded-lg">
                          🇹🇭 {cond.thai}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-purple-500" />
            <span>การปรับเปลี่ยนโหมดค่าน้ำมันและเงื่อนไขจะมีผลต่อการคำนวณบิลของลูกค้าแต่ละรายทันที</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
