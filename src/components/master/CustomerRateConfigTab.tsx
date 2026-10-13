import React, { useState } from 'react';
import {
  CustomerRateConfig,
  DieselPriceRecord,
} from '../../types';
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  Search,
  Check,
  Copy,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  Info,
  Clock,
  Layers,
  FileText,
  DollarSign,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { saveCustomerRateConfigsToSupabase } from '../../services/supabaseService';

interface CustomerRateConfigTabProps {
  customerRateConfigs: CustomerRateConfig[];
  onUpdateCustomerRateConfigs: (configs: CustomerRateConfig[]) => void;
  dieselPrices?: DieselPriceRecord[];
}

export const CustomerRateConfigTab: React.FC<CustomerRateConfigTabProps> = ({
  customerRateConfigs,
  onUpdateCustomerRateConfigs,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'fuelModes' | 'bangboTerms'>('fuelModes');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState<'ทั้งหมด' | 'YNLC' | 'YBLC'>('ทั้งหมด');

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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [copiedTerms, setCopiedTerms] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

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

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveCompany) return;

    const newConfig: CustomerRateConfig = {
      id: editingConfigId || `crc-${Date.now()}`,
      branch: selectedBranch,
      customer_name: effectiveCompany,
      daily_rate: rateMode === 'daily',
      week_rate: rateMode === 'week',
      monthly_rate: rateMode === 'monthly',
      fix_rate: rateMode === 'fix',
      fuel_range: rateMode === 'range',
      fix_fuel_price: rateMode === 'fix' ? parseFloat(fixFuelPrice) || 38.0 : undefined,
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
      const existingIdx = customerRateConfigs.findIndex(
        (c) =>
          c.customer_name.toUpperCase() === effectiveCompany.toUpperCase() &&
          c.branch === selectedBranch
      );
      if (existingIdx >= 0) {
        updatedConfigs = [...customerRateConfigs];
        updatedConfigs[existingIdx] = newConfig;
      } else {
        updatedConfigs = [newConfig, ...customerRateConfigs];
      }
    }

    onUpdateCustomerRateConfigs(updatedConfigs);
    setSaveStatus('กำลังบันทึกไปยัง Supabase...');
    try {
      await saveCustomerRateConfigsToSupabase(updatedConfigs);
      setSaveStatus('บันทึกเรียบร้อย!');
    } catch {
      setSaveStatus('บันทึกในระบบเรียบร้อย');
    }
    setTimeout(() => setSaveStatus(null), 3000);

    setEditingConfigId(null);
    setIsFormOpen(false);
  };

  const handleStartEdit = (cfg: CustomerRateConfig) => {
    setEditingConfigId(cfg.id);
    setSelectedBranch(cfg.branch as any || 'YNLC');
    setSelectedCompany('__CUSTOM__');
    setCustomCompanyName(cfg.customer_name);
    if (cfg.fix_rate) {
      setRateMode('fix');
      setFixFuelPrice(cfg.fix_fuel_price ? String(cfg.fix_fuel_price) : '38.00');
    } else if (cfg.fuel_range) {
      setRateMode('range');
      setRangeStart(cfg.fuel_range_start || '2026-09-25');
      setRangeEnd(cfg.fuel_range_end || '2026-10-26');
      setRangeNote(cfg.fuel_range_note || '25/9/26-26/10/26');
    } else if (cfg.week_rate) {
      setRateMode('week');
    } else if (cfg.monthly_rate) {
      setRateMode('monthly');
    } else {
      setRateMode('daily');
    }
    setRemark(cfg.remark || '');
    setIsFormOpen(true);
  };

  const handleToggleActive = async (id: string) => {
    const updated = customerRateConfigs.map((c) =>
      c.id === id ? { ...c, is_active: !c.is_active } : c
    );
    onUpdateCustomerRateConfigs(updated);
    await saveCustomerRateConfigsToSupabase(updated);
  };

  const handleDeleteConfig = async (id: string) => {
    if (confirm('ยืนยันการลบการตั้งค่าโหมดคิดเรทลูกค้ารายนี้หรือไม่?')) {
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
      thai: 'วงเงินความรับผิดชอบความเสียหายจากอุบัติเหตุ: 500,000 บาท/เที่ยว (4W) และ 1,000,000 บาท/เที่ยว (6W & 10W) ภายใต้รายงาน QA/QC ของลูกค้า',
    },
    {
      num: 11,
      title: 'Outer Carton Damage Reporting (การแจ้งเหตุกล่องพัสดุชำรุด)',
      content: 'If there is damage of outer carton found when receiving, customer shall note on returned Delivery Note for such incident, then check cargo and report to Yusen within 24 hours. Otherwise it will be considered as complete delivery with good condition of cargo.',
      thai: 'หากพบกล่องด้านนอกชำรุดตอนรับของ ต้องระบุในใบส่งสินค้าและแจ้ง Yusen ภายใน 24 ชม. มิฉะนั้นจะถือว่าส่งมอบสมบูรณ์ในสภาพเรียบร้อย',
    },
    {
      num: 12,
      title: 'Additional Charge & Payment Terms (ค่าใช้จ่ายตามจริงและเครดิตชำระเงิน)',
      content: '• Additional charges at actual cost\n• Payment within 30 days after receiving debit note\n• Rate effective until 31 December 2025',
      thai: 'ค่าใช้จ่ายเพิ่มเติมคิดตามจริง (Actual Cost) • ชำระเงินภายใน 30 วันหลังรับ Debit Note • เรทมีผลบังคับใช้จนถึง 31 ธันวาคม 2025',
    },
  ];

  const handleCopyBangBoTerms = () => {
    const text = BANGBO_CONDITIONS.map(
      (c) => `${c.num}. ${c.title}\n${c.content}\nไทย: ${c.thai}\n`
    ).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedTerms(true);
    setTimeout(() => setCopiedTerms(false), 2500);
  };

  const filteredConfigs = customerRateConfigs.filter((c) => {
    if (filterBranch !== 'ทั้งหมด' && c.branch !== filterBranch && c.branch !== 'ทั้งหมด') {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        c.customer_name.toLowerCase().includes(q) ||
        (c.remark || '').toLowerCase().includes(q) ||
        (c.fuel_range_note || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 uppercase tracking-wider">
              MULTI-MODE RATE ENGINE
            </span>
            <span className="text-xs text-blue-100">
              ตาราง transport_customer_rate_config (Supabase)
            </span>
          </div>
          <h2 className="text-xl font-bold flex items-center gap-2.5">
            <SlidersHorizontal className="w-6 h-6 text-amber-300" />
            <span>ระบบคิดเรทค่าน้ำมันตามช่วงเวลา + โหมดรายลูกค้า (5 โหมด)</span>
          </h2>
          <p className="text-xs text-blue-100/90 max-w-2xl leading-relaxed">
            แก้ปัญหาราคาต่อลูกค้าแต่ละรายกระโดด โดยแยกโหมดคิดเรทน้ำมันรายบริษัท:
            <strong> Daily Rate</strong>, <strong>Week Rate</strong>, <strong>Monthly Rate</strong>, <strong>Fix Rate</strong> และ <strong>Fuel Range</strong>
            พร้อมเงื่อนไขค่าคอนโซลและค่าดรอป
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsFormOpen(!isFormOpen);
              if (isFormOpen) setEditingConfigId(null);
            }}
            className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isFormOpen ? 'ซ่อนแบบฟอร์ม' : '➕ เพิ่ม/แก้ไขโหมดรายบริษัท'}</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs: 5 Modes vs Bang Bo (YBLC) Terms */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('fuelModes')}
            className={`pb-3 px-4 border-b-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'fuelModes'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>โหมดคิดเรทน้ำมัน 5 โหมดรายบริษัท ({customerRateConfigs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('bangboTerms')}
            className={`pb-3 px-4 border-b-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'bangboTerms'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>ข้อกำหนดและเรทสาขาบางบ่อ 12 ข้อ (Bang Bo YBLC Terms)</span>
          </button>
        </div>

        {saveStatus && (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pb-2">
            <Check className="w-4 h-4" />
            <span>{saveStatus}</span>
          </span>
        )}
      </div>

      {activeSubTab === 'fuelModes' ? (
        <div className="space-y-6">
          {/* Quick Presets Bar */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>คลิกเลือกบริษัทตัวอย่างเพื่อโหลด Preset อัตโนมัติ:</span>
              </span>
              <span className="text-[11px] text-slate-400">
                1 คลิกเพื่อตั้งค่าโหมดและเงื่อนไขตามข้อกำหนดของลูกค้ารายนั้น
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'ROLAND', label: 'ROLAND (Daily/YBLC)', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
                { key: 'HITACHI_HIGH_TECH', label: 'HITACHI HIGH-TECH (Daily)', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
                { key: 'NICHICON', label: 'NICHICON (Week Rate)', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
                { key: 'CHUKOH', label: 'Chukoh Chemical (Week Rate)', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
                { key: 'MACNICA', label: 'MACNICA (Monthly 1-30)', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' },
                { key: 'PANASONIC', label: 'PANASONIC (Monthly 1-30)', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' },
                { key: 'HITACHI_ASIA', label: 'HITACHI ASIA (Monthly)', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' },
                { key: 'AJITRADE', label: 'AJITRADE (ศรีมหาโพธิ์ 3,520฿)', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' },
                { key: 'SIEMENS', label: 'SIEMENS (Fix 38.00฿/BLC)', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
                { key: 'AISAN', label: 'AISAN (Fix Rate)', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
                { key: 'DAITRON', label: 'DAITRON (Fix Rate)', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
                { key: 'SENKO', label: 'SENKO (Range 25/9-26/10)', color: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' },
                { key: 'ELEMATEC', label: 'ELEMATEC (รอบ 21 ชน 20)', color: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    applyPreset(p.key);
                    setIsFormOpen(true);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold hover:opacity-90 transition-all cursor-pointer shadow-2xs ${p.color}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Section */}
          {isFormOpen && (
            <form
              onSubmit={handleSaveConfig}
              className="p-5 bg-white dark:bg-slate-800 rounded-2xl border-2 border-blue-500/30 dark:border-blue-500/40 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                  <span>{editingConfigId ? 'แก้ไขการตั้งค่าโหมดคิดเรท' : 'เพิ่มการตั้งค่าโหมดคิดเรทรายลูกค้าใหม่'}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingConfigId(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  ปิดแบบฟอร์ม
                </button>
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
                    <option value="YNLC">YNLC (นวนคร)</option>
                    <option value="YBLC">YBLC (บางบ่อ)</option>
                    <option value="ทั้งหมด">ทั้งหมด (All Branches)</option>
                  </select>
                </div>

                {/* Company Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อบริษัทลูกค้า (Customer Name)
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedCompany}
                      onChange={(e) => setSelectedCompany(e.target.value)}
                      className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold w-1/2"
                    >
                      <option value="ROLAND">ROLAND</option>
                      <option value="HITACHI HIGH-TECH">HITACHI HIGH-TECH</option>
                      <option value="NICHICON">NICHICON</option>
                      <option value="Chukoh Chemical">Chukoh Chemical</option>
                      <option value="MACNICA">MACNICA</option>
                      <option value="PANASONIC">PANASONIC</option>
                      <option value="HITACHI ASIA">HITACHI ASIA</option>
                      <option value="AJITRADE (THAILAND) CO.,LTD.">AJITRADE (THAILAND) CO.,LTD.</option>
                      <option value="SIEMENS">SIEMENS</option>
                      <option value="AISAN">AISAN</option>
                      <option value="DAITRON">DAITRON</option>
                      <option value="SENKO">SENKO</option>
                      <option value="Elematec (Thailand) Co.,Ltd">Elematec (Thailand) Co.,Ltd</option>
                      <option value="__CUSTOM__">✍️ ระบุชื่อบริษัทเอง...</option>
                    </select>

                    {selectedCompany === '__CUSTOM__' && (
                      <input
                        type="text"
                        placeholder="กรอกชื่อบริษัท เช่น TOSHIBA..."
                        value={customCompanyName}
                        onChange={(e) => setCustomCompanyName(e.target.value)}
                        className="flex-1 px-3 py-2 border border-blue-400 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-bold"
                        required
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Rate Mode Selector (5 Modes) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  โหมดการคิดเรทน้ำมัน (Fuel Rate Mode — 5 โหมด):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  {/* Mode 1 */}
                  <label
                    className={`p-3 rounded-xl border-2 flex flex-col justify-between cursor-pointer transition-all ${
                      rateMode === 'daily'
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="rateMode"
                        checked={rateMode === 'daily'}
                        onChange={() => setRateMode('daily')}
                        className="text-blue-600"
                      />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">1. Daily Rate</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      ใช้น้ำมันวันนั้น (Issue Date)
                    </p>
                    <span className="text-[9px] text-blue-600 dark:text-blue-400 font-mono mt-1">
                      ROLAND, HITACHI HIGH-TECH
                    </span>
                  </label>

                  {/* Mode 2 */}
                  <label
                    className={`p-3 rounded-xl border-2 flex flex-col justify-between cursor-pointer transition-all ${
                      rateMode === 'week'
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="rateMode"
                        checked={rateMode === 'week'}
                        onChange={() => setRateMode('week')}
                        className="text-emerald-600"
                      />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">2. Week Rate</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      น้ำมันเฉลี่ยรายสัปดาห์ (Mon-Sun)
                    </p>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                      NICHICON, Chukoh Chemical
                    </span>
                  </label>

                  {/* Mode 3 */}
                  <label
                    className={`p-3 rounded-xl border-2 flex flex-col justify-between cursor-pointer transition-all ${
                      rateMode === 'monthly'
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="rateMode"
                        checked={rateMode === 'monthly'}
                        onChange={() => setRateMode('monthly')}
                        className="text-indigo-600"
                      />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">3. Monthly Rate</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      เฉลี่ยรายเดือน (1-30) / เดือนก่อน
                    </p>
                    <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                      MACNICA, PANASONIC, AJITRADE
                    </span>
                  </label>

                  {/* Mode 4 */}
                  <label
                    className={`p-3 rounded-xl border-2 flex flex-col justify-between cursor-pointer transition-all ${
                      rateMode === 'fix'
                        ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="rateMode"
                        checked={rateMode === 'fix'}
                        onChange={() => setRateMode('fix')}
                        className="text-amber-600"
                      />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">4. Fix Rate</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      ราคาคงที่ตามสัญญา (Fix ฿/L)
                    </p>
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-mono mt-1">
                      SIEMENS, AISAN, DAITRON
                    </span>
                  </label>

                  {/* Mode 5 */}
                  <label
                    className={`p-3 rounded-xl border-2 flex flex-col justify-between cursor-pointer transition-all ${
                      rateMode === 'range'
                        ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="rateMode"
                        checked={rateMode === 'range'}
                        onChange={() => setRateMode('range')}
                        className="text-teal-600"
                      />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">5. Fuel Range</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      ช่วงวันที่กำหนด (เช่น 25/9-26/10)
                    </p>
                    <span className="text-[9px] text-teal-600 dark:text-teal-400 font-mono mt-1">
                      SENKO, ELEMATEC
                    </span>
                  </label>
                </div>
              </div>

              {/* Mode Specific Inputs */}
              {rateMode === 'fix' && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300 mb-1">
                    ราคาน้ำมันคงที่ (Fix Diesel Price - บาท/ลิตร)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="เช่น 38.00"
                    value={fixFuelPrice}
                    onChange={(e) => setFixFuelPrice(e.target.value)}
                    className="w-48 px-3 py-1.5 border border-amber-300 dark:border-amber-700 rounded-lg bg-white dark:bg-slate-800 font-mono font-bold text-amber-700 dark:text-amber-400 text-xs"
                    required
                  />
                </div>
              )}

              {rateMode === 'range' && (
                <div className="p-3 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-teal-900 dark:text-teal-300 mb-1">
                      วันที่เริ่มต้น (Start Date)
                    </label>
                    <input
                      type="date"
                      value={rangeStart}
                      onChange={(e) => setRangeStart(e.target.value)}
                      className="w-full px-3 py-1.5 border border-teal-300 dark:border-teal-700 rounded-lg bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-teal-900 dark:text-teal-300 mb-1">
                      วันที่สิ้นสุด (End Date)
                    </label>
                    <input
                      type="date"
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(e.target.value)}
                      className="w-full px-3 py-1.5 border border-teal-300 dark:border-teal-700 rounded-lg bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-teal-900 dark:text-teal-300 mb-1">
                      ข้อความรอบบิล (Range Note)
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
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
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
          )}

          {/* Search bar & Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อบริษัท / โหมด..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                />
              </div>

              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value as any)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-semibold"
              >
                <option value="ทั้งหมด">ทุกสาขา</option>
                <option value="YNLC">YNLC (นวนคร)</option>
                <option value="YBLC">YBLC (บางบ่อ)</option>
              </select>
            </div>

            <span className="text-slate-400 text-xs font-semibold">
              แสดง {filteredConfigs.length} จากทั้งหมด {customerRateConfigs.length} บริษัท
            </span>
          </div>

          {/* Table of Customer Rate Configs */}
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
                  {filteredConfigs.map((cfg, idx) => {
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
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              cfg.branch === 'YBLC' || cfg.branch === 'บางบ่อ'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
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
      ) : (
        /* Bang Bo (YBLC) Terms & Conditions 12 Rules */
        <div className="space-y-4">
          <div className="p-4 bg-purple-50/70 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0"
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
  );
};
