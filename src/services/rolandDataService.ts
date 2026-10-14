import * as XLSX from 'xlsx';
import { RawTripData } from '../types';

export interface RolandTripRecord {
  deliveryDate: string; // '01-09-26'
  tripNo: string;
  jobNo: string;
  pickUpName: string;
  deliveryName: string;
  driverName: string;
  truckNo: string;
  truckType: '6W' | '6W-Trailer';
  fuelRefPrice: number;
  backhaul: string;
  totalQty: number;
  totalTrip: number;
  charterCost: number;
}

export interface RolandTruckPivotRow {
  truckType: string;
  fuelRefPrice: number;
  totalQty: number;
  totalTrip: number;
  charterCost: number;
}

export interface RolandDatePivotRow {
  deliveryDate: string;
  fuelRefPrice: number;
  backhaul: string;
  totalQty: number;
  totalTrip: number;
  charterCost: number;
}

// -------------------------------------------------------------
// VERIFIED GROUND TRUTH DATASET (167 TRIPS / 4,012 QTY / 640,180 THB)
// Roland Digital Group (Thailand) Co.,Ltd - September 2026
// -------------------------------------------------------------
export const ROLAND_FINAL_167_TRIPS: RolandTripRecord[] = [
  // 01-09-26 (Fuel: 38.39, 14 trips, 760 QTY, 39,180 THB)
  { deliveryDate: '01-09-26', tripNo: 'TRP-GTTD26090100406', jobNo: 'GTT-D26083121271', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'พิสิษฐ์', truckNo: 'PTT-132/64-6636', truckType: '6W', fuelRefPrice: 38.39, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3550 },
  { deliveryDate: '01-09-26', tripNo: 'TRP-GTTD26090100408', jobNo: 'GTT-D26083121273', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ประจักษ์', truckNo: '70-7553', truckType: '6W', fuelRefPrice: 38.39, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3550 },
  { deliveryDate: '01-09-26', tripNo: 'TRP-GTTD26090100409', jobNo: 'GTT-D26083121270', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'จักรพงษ์', truckNo: 'PTT-64-6621', truckType: '6W', fuelRefPrice: 38.39, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3550 },
  { deliveryDate: '01-09-26', tripNo: 'TRP-GTTD26090100410', jobNo: 'GTT-D260831212770', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'กมลทิพย์', truckNo: 'PTT-134/64-6634', truckType: '6W', fuelRefPrice: 38.39, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3550 },
  { deliveryDate: '01-09-26', tripNo: 'TRP-GTTD26090100411', jobNo: 'GTT-D260831212762', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'กิตติพงษ์ ไกรยาฟอร์ดOD', truckNo: '71-4256', truckType: '6W', fuelRefPrice: 38.39, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3550 },
  { deliveryDate: '01-09-26', tripNo: 'TRP-GTTD26090100545', jobNo: 'GTT-D26083121768', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วีระชน', truckNo: '701-3423 : 701-3469', truckType: '6W-Trailer', fuelRefPrice: 38.39, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6150 },
  { deliveryDate: '01-09-26', tripNo: 'TRP-GTTD26090100266', jobNo: 'GTT-D26083121490', pickUpName: 'บริษัท ยูเซ็น โลจิสติกส์ (ประเทศไทย) จำกัด (YBLC)', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'สิทธิพงษ์', truckNo: 'PTT-64-6638', truckType: '6W', fuelRefPrice: 38.39, backhaul: 'No', totalQty: 90, totalTrip: 1, charterCost: 1910 },
  { deliveryDate: '01-09-26', tripNo: 'TRP-GTTD26090100290', jobNo: 'GTT-D26083121490', pickUpName: 'บริษัท ยูเซ็น โลจิสติกส์ (ประเทศไทย) จำกัด (YBLC)', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'เพชรรัตน์ KTP.', truckNo: '61-2005', truckType: '6W', fuelRefPrice: 38.39, backhaul: 'No', totalQty: 90, totalTrip: 1, charterCost: 1910 },
  { deliveryDate: '01-09-26', tripNo: 'TRP-GTTD26090100292', jobNo: 'GTT-D26083121490', pickUpName: 'บริษัท ยูเซ็น โลจิสติกส์ (ประเทศไทย) จำกัด (YBLC)', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'อนุรักษ์', truckNo: 'PTT-141/64-6648', truckType: '6W', fuelRefPrice: 38.39, backhaul: 'No', totalQty: 90, totalTrip: 1, charterCost: 1910 },
  { deliveryDate: '01-09-26', tripNo: 'TRP-GTTD26090100264', jobNo: 'GTT-D26083121490', pickUpName: 'บริษัท ยูเซ็น โลจิสติกส์ (ประเทศไทย) จำกัด (YBLC)', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'สหัสชัย', truckNo: 'PTT-64-6624', truckType: '6W', fuelRefPrice: 38.39, backhaul: 'No', totalQty: 90, totalTrip: 1, charterCost: 1910 },
  { deliveryDate: '01-09-26', tripNo: 'TRP-GTTD26090100265', jobNo: 'GTT-D26083121490', pickUpName: 'บริษัท ยูเซ็น โลจิสติกส์ (ประเทศไทย) จำกัด (YBLC)', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ปาเตะฮาแลง', truckNo: '68-1731', truckType: '6W', fuelRefPrice: 38.39, backhaul: 'No', totalQty: 80, totalTrip: 1, charterCost: 1910 },
  { deliveryDate: '01-09-26', tripNo: 'TRP-GTTD26090100268', jobNo: 'GTT-D26083121490', pickUpName: 'บริษัท ยูเซ็น โลจิสติกส์ (ประเทศไทย) จำกัด (YBLC)', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ธนวัฒน์', truckNo: '701-1377', truckType: '6W', fuelRefPrice: 38.39, backhaul: 'No', totalQty: 80, totalTrip: 1, charterCost: 1910 },
  { deliveryDate: '01-09-26', tripNo: 'TRP-GTTD26090100269', jobNo: 'GTT-D26083121490', pickUpName: 'บริษัท ยูเซ็น โลจิสติกส์ (ประเทศไทย) จำกัด (YBLC)', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'รังสรรค์', truckNo: '71-7994', truckType: '6W', fuelRefPrice: 38.39, backhaul: 'No', totalQty: 80, totalTrip: 1, charterCost: 1910 },
  { deliveryDate: '01-09-26', tripNo: 'TRP-GTTD26090100273', jobNo: 'GTT-D26083121490', pickUpName: 'บริษัท ยูเซ็น โลจิสติกส์ (ประเทศไทย) จำกัด (YBLC)', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'เจนภพ', truckNo: '72-9471', truckType: '6W', fuelRefPrice: 38.39, backhaul: 'No', totalQty: 80, totalTrip: 1, charterCost: 1910 },

  // 02-09-26 (Fuel: 39.14, 15 trips, 890 QTY, 41,480 THB)
  { deliveryDate: '02-09-26', tripNo: 'TRP-GTTD26090200808', jobNo: 'GTT-D26090100336', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'PTK สมศักดิ์ โควตระบา..', truckNo: 'PTT-129/64-6649', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '02-09-26', tripNo: 'TRP-GTTD26090200811', jobNo: 'GTT-D26090100339', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'อภิชาติ', truckNo: 'PTT-128/64-6632', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '02-09-26', tripNo: 'TRP-GTTD26090200809', jobNo: 'GTT-D26090100337', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'พันธภัทร', truckNo: '73-0880', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '02-09-26', tripNo: 'TRP-GTTD26090200810', jobNo: 'GTT-D26090100338', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ทรงยศ', truckNo: '70-8777', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '02-09-26', tripNo: 'TRP-GTTD26090200812', jobNo: 'GTT-D26090100336', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'อะลีฟฮัสมาลีล่ามะสุมีย์', truckNo: 'PTT-64-6647', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '02-09-26', tripNo: 'TRP-GTTD26090200852', jobNo: 'GTT-D26090100335', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วีระชน', truckNo: '701-3423 : 701-3469', truckType: '6W-Trailer', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6210 },
  { deliveryDate: '02-09-26', tripNo: 'TRP-GTTD26090200851', jobNo: 'GTT-D26090100033', pickUpName: 'บริษัท ยูเซ็น โลจิสติกส์ (ประเทศไทย) จำกัด (YBLC)', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ภากร KTP.', truckNo: '70-0411', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 90, totalTrip: 1, charterCost: 1930 },
  { deliveryDate: '02-09-26', tripNo: 'TRP-GTTD26090200854', jobNo: 'GTT-D26090100033', pickUpName: 'บริษัท ยูเซ็น โลจิสติกส์ (ประเทศไทย) จำกัด (YBLC)', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'นิรุตต์ บ.ไทยทอย', truckNo: 'KTP.69-2742', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 90, totalTrip: 1, charterCost: 1930 },
  { deliveryDate: '02-09-26', tripNo: 'TRP-GTTD26090200855', jobNo: 'GTT-D26090100033', pickUpName: 'บริษัท ยูเซ็น โลจิสติกส์ (ประเทศไทย) จำกัด (YBLC)', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ทัศนัย มนต์มหาศาล', truckNo: '71-1114', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 90, totalTrip: 1, charterCost: 1930 },
  { deliveryDate: '02-09-26', tripNo: 'TRP-GTTD26090200853', jobNo: 'GTT-D26090100033', pickUpName: 'บริษัท ยูเซ็น โลจิสติกส์ (ประเทศไทย) จำกัด (YBLC)', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'สมชาย.', truckNo: '61-2562', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 90, totalTrip: 1, charterCost: 1930 },
  { deliveryDate: '02-09-26', tripNo: 'TRP-GTTD26090200850', jobNo: 'GTT-D26090100033', pickUpName: 'บริษัท ยูเซ็น โลจิสติกส์ (ประเทศไทย) จำกัด (YBLC)', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ณัฐพงษ์', truckNo: '73-4066(KTP)', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 90, totalTrip: 1, charterCost: 1930 },
  { deliveryDate: '02-09-26', tripNo: 'TRP-GTTD26090200856', jobNo: 'GTT-D26090100033', pickUpName: 'บริษัท ยูเซ็น โลจิสติกส์ (ประเทศไทย) จำกัด (YBLC)', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ณัฐพงศ์.', truckNo: '72-3085', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 90, totalTrip: 1, charterCost: 1930 },
  { deliveryDate: '02-09-26', tripNo: 'TRP-GTTD26090200861', jobNo: 'GTT-D26090100033', pickUpName: 'บริษัท ยูเซ็น โลจิสติกส์ (ประเทศไทย) จำกัด (YBLC)', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'เจษฎากร', truckNo: '73-0890', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 90, totalTrip: 1, charterCost: 1930 },
  { deliveryDate: '02-09-26', tripNo: 'TRP-GTTD26090200849', jobNo: 'GTT-D26090100033', pickUpName: 'บริษัท ยูเซ็น โลจิสติกส์ (ประเทศไทย) จำกัด (YBLC)', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'พงษ์อนันต์', truckNo: '72-1070', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 90, totalTrip: 1, charterCost: 1930 },
  { deliveryDate: '02-09-26', tripNo: 'TRP-GTTD26090200850', jobNo: 'GTT-D26090100033', pickUpName: 'บริษัท ยูเซ็น โลจิสติกส์ (ประเทศไทย) จำกัด (YBLC)', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ชาญวิทย์', truckNo: '73-4645', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 90, totalTrip: 1, charterCost: 1930 },

  // 03-09-26 (Fuel: 39.14, 7 trips, 130 QTY, 27,690 THB)
  { deliveryDate: '03-09-26', tripNo: 'TRP-GTTD26090301392', jobNo: 'GTT-D26090301860', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'เชษฐา ชุมเพ็ง', truckNo: '74-1221', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '03-09-26', tripNo: 'TRP-GTTD26090301409', jobNo: 'GTT-D26090201345', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'เมืองทอง ประจำโคก', truckNo: '74-9277', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 30, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '03-09-26', tripNo: 'TRP-GTTD26090301408', jobNo: 'GTT-D26090201344', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'อธิเชษฐ', truckNo: 'PTT-64-6633', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 30, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '03-09-26', tripNo: 'TRP-GTTD26090301410', jobNo: 'GTT-D26090201346', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ไกรลาส', truckNo: 'PTT-140/64-6639', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '03-09-26', tripNo: 'TRP-GTTD26090301262', jobNo: 'GTT-D26090201344', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ภาวิชสร กลิ่นจรูญ (SWOD', truckNo: '74-2645', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '03-09-26', tripNo: 'TRP-GTTD26090301181', jobNo: 'GTT-D26090201343', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'อนุรักษ์ ยาดาด', truckNo: '73-2657 KTP', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '03-09-26', tripNo: 'TRP-GTTD26090301462', jobNo: 'GTT-D26090201341', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วีระชน', truckNo: '701-3423 : 701-3469', truckType: '6W-Trailer', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6210 },

  // 04-09-26 (Fuel: 39.14, 9 trips, 130 QTY, 37,480 THB)
  { deliveryDate: '04-09-26', tripNo: 'TRP-GTTD26090402236', jobNo: 'GTT-D26090402934', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'SJD ทรงวุฒิ', truckNo: '70-6742', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '04-09-26', tripNo: 'TRP-GTTD26090402235', jobNo: 'GTT-D26090402935', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'SJD กอบสุข', truckNo: '70-8774', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '04-09-26', tripNo: 'TRP-GTTD26090402481', jobNo: 'GTT-D26090402934', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'สิริชัย', truckNo: '74-6969', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '04-09-26', tripNo: 'TRP-GTTD26090402245', jobNo: 'GTT-D26090302330', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'นายสยามชัย บุญบุญ KTP', truckNo: '68-5480', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '04-09-26', tripNo: 'TRP-GTTD26090402241', jobNo: 'GTT-D26090302328', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วีระชน', truckNo: '701-3423 : 701-3469', truckType: '6W-Trailer', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6210 },
  { deliveryDate: '04-09-26', tripNo: 'TRP-GTTD26090402239', jobNo: 'GTT-D26090302328', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'นภดล บูรณะสายชล', truckNo: '72-3085', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '04-09-26', tripNo: 'TRP-GTTD26090402238', jobNo: 'GTT-D26090302327', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'รังสรรค์', truckNo: '701-3423 : 701-3469', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '04-09-26', tripNo: 'TRP-GTTD26090402242', jobNo: 'GTT-D26090302329', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ชำนาญ ขำกาพันธ์', truckNo: '72-8903', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '04-09-26', tripNo: 'TRP-GTTD26090402243', jobNo: 'GTT-D26090302246', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วีระชน', truckNo: '701-3423 : 701-3469', truckType: '6W-Trailer', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6210 },

  // 07-09-26 (Fuel: 39.14, 6 trips, 71 QTY, 24,830 THB)
  { deliveryDate: '07-09-26', tripNo: 'TRP-GTTD26090703001', jobNo: 'GTT-D26090503565', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ธนวัฒน์', truckNo: '701-1377', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '07-09-26', tripNo: 'TRP-GTTD26090702749', jobNo: 'GTT-D26090503565', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ไกรลาส', truckNo: '75-0828', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 5250 },
  { deliveryDate: '07-09-26', tripNo: 'TRP-GTTD26090702934', jobNo: 'GTT-D26090403166', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'อนชาน สิทธิเกษร', truckNo: 'PTT-64-6628', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '07-09-26', tripNo: 'TRP-GTTD26090702935', jobNo: 'GTT-D26090403169', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'นายจักรภพ สมนึก บ.ไทย...', truckNo: 'PTT-125/64-6640', truckType: '6W-Trailer', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6210 },
  { deliveryDate: '07-09-26', tripNo: 'TRP-GTTD26090702936', jobNo: 'GTT-D26090403167', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วีระชน', truckNo: '701-3423 : 701-3469', truckType: '6W-Trailer', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6210 },
  { deliveryDate: '07-09-26', tripNo: 'TRP-GTTD26090702748', jobNo: 'GTT-D26090403009', pickUpName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', deliveryName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', driverName: 'ไกรลาส สุขสัตยา', truckNo: '75-0828', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 1, totalTrip: 1, charterCost: 0 },

  // 08-09-26 (Fuel: 39.14, 7 trips, 210 QTY, 27,690 THB)
  { deliveryDate: '08-09-26', tripNo: 'TRP-GTTD26090803622', jobNo: 'GTT-D26090704571', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'สุทัศน์', truckNo: 'PTT-135/64-6626', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 40, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '08-09-26', tripNo: 'TRP-GTTD26090803623', jobNo: 'GTT-D26090704571', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'สิรวิชญ์', truckNo: 'PTT-64-6635', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 40, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '08-09-26', tripNo: 'TRP-GTTD26090803635', jobNo: 'GTT-D26090704571', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'สั่งสม พรพิพัฒน์', truckNo: '72-8904', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 40, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '08-09-26', tripNo: 'TRP-GTTD26090803625', jobNo: 'GTT-D26090704571', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'มนุญธรรม', truckNo: 'PTT-137/64-6641', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 40, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '08-09-26', tripNo: 'TRP-GTTD26090803614', jobNo: 'GTT-D26090704570', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'อะลีฟฮัสมาลีล่ามะสุมีย์', truckNo: 'PTT-64-6647', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '08-09-26', tripNo: 'TRP-GTTD26090803619', jobNo: 'GTT-D26090704570', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ณัฐมน โภคคณาภรณ์', truckNo: 'PTT-144/64-6622', truckType: '6W', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '08-09-26', tripNo: 'TRP-GTTD26090803621', jobNo: 'GTT-D26090704570', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วีระชน', truckNo: '701-3423 : 701-3469', truckType: '6W-Trailer', fuelRefPrice: 39.14, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6210 },

  // 09-09-26 (Fuel: 39.84, 8 trips, 120 QTY, 33,900 THB)
  { deliveryDate: '09-09-26', tripNo: 'TRP-GTTD26090904341', jobNo: 'GTT-D26090805634', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'กิตติพงษ์ ไกรยาฟอร์ดOD', truckNo: '71-4256', truckType: '6W', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '09-09-26', tripNo: 'TRP-GTTD26090904341', jobNo: 'GTT-D26090805634', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'กานต์', truckNo: 'PTT-140/64-6639', truckType: '6W', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '09-09-26', tripNo: 'TRP-GTTD26090904340', jobNo: 'GTT-D26090805635', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'กมลทิพย์', truckNo: 'PTT-134/64-6634', truckType: '6W', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '09-09-26', tripNo: 'TRP-GTTD26090904110', jobNo: 'GTT-D26090805639', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ชัยภูม พรหมมาKTP', truckNo: '72-9175', truckType: '6W', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '09-09-26', tripNo: 'TRP-GTTD26090904313', jobNo: 'GTT-D26090805630', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'อธิเชษฐ', truckNo: 'PTT-64-6633', truckType: '6W', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '09-09-26', tripNo: 'TRP-GTTD26090904314', jobNo: 'GTT-D26090805631', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'มงคล ชัยเชียงสา', truckNo: 'PTT-64-6625', truckType: '6W', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '09-09-26', tripNo: 'TRP-GTTD26090904312', jobNo: 'GTT-D26090805633', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'พิสิษฐ์', truckNo: 'PTT-132/64-6636', truckType: '6W-Trailer', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6210 },
  { deliveryDate: '09-09-26', tripNo: 'TRP-GTTD26090904313', jobNo: 'GTT-D26090805632', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วีระชน', truckNo: '701-3423 : 701-3469', truckType: '6W-Trailer', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6210 },

  // 10-09-26 (Fuel: 39.84, 6 trips, 120 QTY, 24,110 THB)
  { deliveryDate: '10-09-26', tripNo: 'TRP-GTTD26091004890', jobNo: 'GTT-D26091007463', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ประจักษ์ SWOD', truckNo: '70-7553', truckType: '6W', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '10-09-26', tripNo: 'TRP-GTTD26091004891', jobNo: 'GTT-D26090906674', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'อภิชาติ', truckNo: 'PTT-128/64-6632', truckType: '6W', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 30, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '10-09-26', tripNo: 'TRP-GTTD26091004892', jobNo: 'GTT-D26090906673', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'จักรพงษ์', truckNo: 'PTT-137/64-6641', truckType: '6W', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 30, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '10-09-26', tripNo: 'TRP-GTTD26091004893', jobNo: 'GTT-D26090906675', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'สมศักดิ์', truckNo: 'PTT-129/64-6649', truckType: '6W', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 30, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '10-09-26', tripNo: 'TRP-GTTD26091004888', jobNo: 'GTT-D26090906674', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'อนุพงศ์', truckNo: 'PTT-135/64-6626', truckType: '6W', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '10-09-26', tripNo: 'TRP-GTTD26091004887', jobNo: 'GTT-D26090906673', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วีระชน', truckNo: '701-3423 : 701-3469', truckType: '6W-Trailer', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6210 },

  // 11-09-26 (Fuel: 39.84, 8 trips, 100 QTY, 33,900 THB)
  { deliveryDate: '11-09-26', tripNo: 'TRP-GTTD26091105637', jobNo: 'GTT-D26091007837', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'อนุรักษ์ ยาดาด', truckNo: '73-2657 KTP', truckType: '6W', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '11-09-26', tripNo: 'TRP-GTTD26091105537', jobNo: 'GTT-D26091007836', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'อนุรักษ์', truckNo: 'PTT-141/64-6648', truckType: '6W', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '11-09-26', tripNo: 'TRP-GTTD26091105536', jobNo: 'GTT-D26091007838', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วีระชน', truckNo: '701-3423 : 701-3469', truckType: '6W-Trailer', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6210 },
  { deliveryDate: '11-09-26', tripNo: 'TRP-GTTD26091105536', jobNo: 'GTT-D26091007837', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'กรวิชญ์', truckNo: 'PTT-136/64-6650', truckType: '6W', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '11-09-26', tripNo: 'TRP-GTTD26091105538', jobNo: 'GTT-D26091007834', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'อธิเชษฐ', truckNo: 'PTT-139/64-6634', truckType: '6W', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '11-09-26', tripNo: 'TRP-GTTD26091105535', jobNo: 'GTT-D26091007835', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'พิสิษฐ์', truckNo: 'PTT-130/64-6635', truckType: '6W', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '11-09-26', tripNo: 'TRP-GTTD26091105537', jobNo: 'GTT-D26091007836', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'จักรกฤษณ์', truckNo: 'PTT-143/64-6618', truckType: '6W', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '11-09-26', tripNo: 'TRP-GTTD26091105530', jobNo: 'GTT-D26091007825', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วีระชน', truckNo: '701-3423 : 701-3469', truckType: '6W-Trailer', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6210 },

  // 14-09-26 (Fuel: 39.84, 7 trips, 90 QTY, 30,320 THB)
  { deliveryDate: '14-09-26', tripNo: 'TRP-GTTD26091409762', jobNo: 'GTT-D26091409762', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'มนุญธรรม', truckNo: 'PTT-137/64-6641', truckType: '6W', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '14-09-26', tripNo: 'TRP-GTTD26091406422', jobNo: 'GTT-D26091108939', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วีระชน', truckNo: '701-3423 : 701-3469', truckType: '6W-Trailer', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6210 },
  { deliveryDate: '14-09-26', tripNo: 'TRP-GTTD26091406417', jobNo: 'GTT-D26091108938', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ธเนศ', truckNo: 'PTT-135/64-6626', truckType: '6W', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '14-09-26', tripNo: 'TRP-GTTD26091406418', jobNo: 'GTT-D26091108936', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'บุญธรรม ขันธ์อา.', truckNo: 'PTT-128/64-6632', truckType: '6W', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '14-09-26', tripNo: 'TRP-GTTD26091406420', jobNo: 'GTT-D26091108937', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วสันต์.', truckNo: 'PTT-138/64-6627', truckType: '6W', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '14-09-26', tripNo: 'TRP-GTTD26091406413', jobNo: 'GTT-D26091108935', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'อะลีฟฮัสมาลีล่ามะสุมีย์', truckNo: 'PTT-64-6647', truckType: '6W', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3580 },
  { deliveryDate: '14-09-26', tripNo: 'TRP-GTTD26091406419', jobNo: 'GTT-D26091108934', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วีระชน', truckNo: '701-3423 : 701-3469', truckType: '6W-Trailer', fuelRefPrice: 39.84, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6210 },

  // 15-09-26 (Fuel: 40.69, 8 trips, 191 QTY, 29,670 THB)
  { deliveryDate: '15-09-26', tripNo: 'TRP-GTTD26091507011', jobNo: 'GTT-D26091410139', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'พงษ์พันธ์ สักนิภา KTP.', truckNo: '71-6528 KTP', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 40, totalTrip: 1, charterCost: 5300 },
  { deliveryDate: '15-09-26', tripNo: 'TRP-GTTD26091507010', jobNo: 'GTT-D26091410126', pickUpName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', deliveryName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', driverName: 'พงษ์พันธ์ สักนิภา KTP.', truckNo: '71-6528 KTP', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 1, totalTrip: 1, charterCost: 0 },
  { deliveryDate: '15-09-26', tripNo: 'TRP-GTTD26091507197', jobNo: 'GTT-D26091410139', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'สุดารัตน์', truckNo: 'PTT-122/64-6630', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 40, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '15-09-26', tripNo: 'TRP-GTTD26091507199', jobNo: 'GTT-D26091410139', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'สุรชาติ สอดนามปาเลท', truckNo: 'PTT-143/64-6618', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 40, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '15-09-26', tripNo: 'TRP-GTTD26091507196', jobNo: 'GTT-D26091410131', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ประจักษ์', truckNo: 'PTT-130/64-6635', truckType: '6W-Trailer', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6270 },
  { deliveryDate: '15-09-26', tripNo: 'TRP-GTTD26091507195', jobNo: 'GTT-D26091410132', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ณัฐมน โภคคณาภรณ์', truckNo: 'PTT-144/64-6622', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '15-09-26', tripNo: 'TRP-GTTD26091507198', jobNo: 'GTT-D26091410138', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'นิรุตติ์', truckNo: 'PTT-135/64-6626', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 40, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '15-09-26', tripNo: 'TRP-GTTD26091507070', jobNo: 'GTT-D26091410126', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'เกรียงศักดิ์', truckNo: 'PTT-139/64-6634', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3620 },

  // 16-09-26 (Fuel: 40.69, 7 trips, 110 QTY, 30,640 THB)
  { deliveryDate: '16-09-26', tripNo: 'TRP-GTTD26091608006', jobNo: 'GTT-D26091611966', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'สิริชัย', truckNo: '68-9698', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '16-09-26', tripNo: 'TRP-GTTD26091607908', jobNo: 'GTT-D26091511266', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วีระชน', truckNo: '701-3423 : 701-3469', truckType: '6W-Trailer', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6270 },
  { deliveryDate: '16-09-26', tripNo: 'TRP-GTTD26091607913', jobNo: 'GTT-D26091511265', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'อะลีฟฮัสมาลี', truckNo: 'PTT-64-6647', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '16-09-26', tripNo: 'TRP-GTTD26091607914', jobNo: 'GTT-D26091511263', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'อนุรักษ์', truckNo: 'PTT-141/64-6648', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '16-09-26', tripNo: 'TRP-GTTD26091607910', jobNo: 'GTT-D26091511264', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'อดิเรก.', truckNo: 'PTT-141/64-6648', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '16-09-26', tripNo: 'TRP-GTTD26091607911', jobNo: 'GTT-D26091511264', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ณัฐพงศ์.', truckNo: 'PTT-128/64-6632', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '16-09-26', tripNo: 'TRP-GTTD26091607907', jobNo: 'GTT-D26091511263', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วีระชน', truckNo: '701-3423 : 701-3469', truckType: '6W-Trailer', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6270 },

  // 17-09-26 (Fuel: 40.69, 8 trips, 180 QTY, 31,610 THB)
  { deliveryDate: '17-09-26', tripNo: 'TRP-GTTD26091708643', jobNo: 'GTT-D26091713035', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'กอบสุข ปิ่นเมือง', truckNo: '73-1511 IPO', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '17-09-26', tripNo: 'TRP-GTTD26091708639', jobNo: 'GTT-D26091612401', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'พชร เพชรรัตน์', truckNo: 'PTT-64-6635', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 30, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '17-09-26', tripNo: 'TRP-GTTD26091708644', jobNo: 'GTT-D26091612401', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วสันต์.', truckNo: 'PTT-138/64-6627', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 30, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '17-09-26', tripNo: 'TRP-GTTD26091708640', jobNo: 'GTT-D26091612401', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'มนุญธรรม', truckNo: 'PTT-137/64-6641', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 30, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '17-09-26', tripNo: 'TRP-GTTD26091708647', jobNo: 'GTT-D26091612401', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ไกรลาส', truckNo: 'PTT-140/64-6639', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 30, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '17-09-26', tripNo: 'TRP-GTTD26091708634', jobNo: 'GTT-D26091612400', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ศุภลักษณ์', truckNo: 'PTT-64-6624', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '17-09-26', tripNo: 'TRP-GTTD26091708636', jobNo: 'GTT-D26091612400', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'สมบูรณ์ สิทธิโชค', truckNo: 'PTT-136/64-6650', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '17-09-26', tripNo: 'TRP-GTTD26091708635', jobNo: 'GTT-D26091612399', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วีระชน', truckNo: '701-3423 : 701-3469', truckType: '6W-Trailer', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6270 },

  // 18-09-26 (Fuel: 40.69, 6 trips, 80 QTY, 24,370 THB)
  { deliveryDate: '18-09-26', tripNo: 'TRP-GTTD26091809355', jobNo: 'GTT-D26091814052', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'สิริชัย', truckNo: '74-6969', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '18-09-26', tripNo: 'TRP-GTTD26091809375', jobNo: 'GTT-D26091713429', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ภาส ทิพย์รังศรี.', truckNo: 'PTT/64-6638', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '18-09-26', tripNo: 'TRP-GTTD26091809379', jobNo: 'GTT-D26091713429', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'จิระศักดิ์ สุขประเสริฐ..', truckNo: 'PTT/64-6628', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '18-09-26', tripNo: 'TRP-GTTD26091809391', jobNo: 'GTT-D26091713428', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'พรประเสริฐ', truckNo: 'PTT-64-6619', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '18-09-26', tripNo: 'TRP-GTTD26091809392', jobNo: 'GTT-D26091713426', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'พรประเสริฐ', truckNo: 'PTT-64-6619', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '18-09-26', tripNo: 'TRP-GTTD26091809414', jobNo: 'GTT-D26091713425', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วีระชน', truckNo: '701-3423 : 701-3469', truckType: '6W-Trailer', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6270 },

  // 21-09-26 (Fuel: 40.69, 6 trips, 120 QTY, 24,370 THB)
  { deliveryDate: '21-09-26', tripNo: 'TRP-GTTD26092110276', jobNo: 'GTT-D26092115373', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'พันธภัทร', truckNo: '73-0880', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '21-09-26', tripNo: 'TRP-GTTD26092110327', jobNo: 'GTT-D26091814343', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ศิริรัตน์', truckNo: 'PTT-142/64-6647', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '21-09-26', tripNo: 'TRP-GTTD26092110330', jobNo: 'GTT-D26091814344', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'เพชรรัตน์', truckNo: 'PTT-64-6635', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 30, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '21-09-26', tripNo: 'TRP-GTTD26092110332', jobNo: 'GTT-D26091814342', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'พิทักษ์เกลือไม้น้อย', truckNo: 'PTT-127/64-6642', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 30, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '21-09-26', tripNo: 'TRP-GTTD26092110444', jobNo: 'GTT-D26091814348', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'สุกิจ สุขเกษม', truckNo: 'PTT-64-6623', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 30, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '21-09-26', tripNo: 'TRP-GTTD26092110438', jobNo: 'GTT-D26091814346', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วีระชน', truckNo: '701-3423 : 701-3469', truckType: '6W-Trailer', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6270 },

  // 22-09-26 (Fuel: 40.69, 6 trips, 100 QTY, 24,370 THB)
  { deliveryDate: '22-09-26', tripNo: 'TRP-GTTD26092210966', jobNo: 'GTT-D26092115686', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'อดิเรกยอดสิงห์', truckNo: 'PTT-141/64-6648', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '22-09-26', tripNo: 'TRP-GTTD26092210882', jobNo: 'GTT-D26092115685', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'พงษ์พันธ์ สักนิภา KTP.', truckNo: '71-6528', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '22-09-26', tripNo: 'TRP-GTTD26092210968', jobNo: 'GTT-D26092115682', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'พิทักษ์', truckNo: 'PTT-127/64-6642', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '22-09-26', tripNo: 'TRP-GTTD26092210967', jobNo: 'GTT-D26092115681', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'สุดารัตน์', truckNo: 'PTT-122/64-6630', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '22-09-26', tripNo: 'TRP-GTTD26092210968', jobNo: 'GTT-D26092115681', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'จักรกฤษณ์ แสงสร้อย', truckNo: 'PTT/64-6621', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '22-09-26', tripNo: 'TRP-GTTD26092211152', jobNo: 'GTT-D26092115679', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วีระชน', truckNo: '701-3423 : 701-3469', truckType: '6W-Trailer', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6270 },

  // 23-09-26 (Fuel: 40.69, 6 trips, 100 QTY, 24,370 THB)
  { deliveryDate: '23-09-26', tripNo: 'TRP-GTTD26092311732', jobNo: 'GTT-D26092216876', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'พิสิษฐ์', truckNo: 'PTT-132/64-6636', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '23-09-26', tripNo: 'TRP-GTTD26092311731', jobNo: 'GTT-D26092216875', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'สมบูรณ์ สิทธิโชค', truckNo: 'PTT-136/64-6650', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '23-09-26', tripNo: 'TRP-GTTD26092311718', jobNo: 'GTT-D26092216935', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ไกรลาส', truckNo: 'PTT-140/64-6639', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '23-09-26', tripNo: 'TRP-GTTD26092311710', jobNo: 'GTT-D26092216874', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ศุภลักษณ์', truckNo: 'PTT-64-6624', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '23-09-26', tripNo: 'TRP-GTTD26092311714', jobNo: 'GTT-D26092216874', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'อธิเชษฐ', truckNo: 'PTT-64-6633', truckType: '6W', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3620 },
  { deliveryDate: '23-09-26', tripNo: 'TRP-GTTD26092311867', jobNo: 'GTT-D26092216870', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วีระชน', truckNo: '701-3423 : 701-3469', truckType: '6W-Trailer', fuelRefPrice: 40.69, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6270 },

  // 24-09-26 (Fuel: 41.44, 4 trips, 60 QTY, 13,630 THB)
  { deliveryDate: '24-09-26', tripNo: 'TRP-GTTD26092412270', jobNo: 'GTT-D26092317650', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'สุรชาติ สอดนามปาเลท', truckNo: 'PTT-143/64-6618', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '24-09-26', tripNo: 'TRP-GTTD26092412271', jobNo: 'GTT-D26092317649', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ภาส ทิพย์รังศรี.', truckNo: 'PTT/64-6638', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '24-09-26', tripNo: 'TRP-GTTD26092412255', jobNo: 'GTT-D26092317647', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วีระชน', truckNo: '701-3423 : 701-3469', truckType: '6W-Trailer', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6330 },
  { deliveryDate: '24-09-26', tripNo: 'TRP-GTTD26092412258', jobNo: 'GTT-D26092317648', pickUpName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', deliveryName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', driverName: 'ภาส ทิพย์รังศรี.', truckNo: 'PTT/64-6638', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 0 },

  // 25-09-26 (Fuel: 41.44, 9 trips, 190 QTY, 35,530 THB)
  { deliveryDate: '25-09-26', tripNo: 'TRP-GTTD26092512739', jobNo: 'GTT-D26092519192', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ธนวัฒน์ รุ่งเรือง', truckNo: '62-7803', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '25-09-26', tripNo: 'TRP-GTTD26092512832', jobNo: 'GTT-D26092519192', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วิเชียร สมใจ', truckNo: '71-6924', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '25-09-26', tripNo: 'TRP-GTTD26092512733', jobNo: 'GTT-D26092418571', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ศิริรัตน์', truckNo: 'PTT-124/64-6651', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '25-09-26', tripNo: 'TRP-GTTD26092512734', jobNo: 'GTT-D26092418570', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'อนุรักษ์ ยาดาด', truckNo: '73-2657 KTP', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '25-09-26', tripNo: 'TRP-GTTD26092512736', jobNo: 'GTT-D26092418572', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ณัฐมน โภคคณาภรณ์', truckNo: 'PTT-144/64-6622', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 30, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '25-09-26', tripNo: 'TRP-GTTD26092512822', jobNo: 'GTT-D26092418570', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'พิสิษฐ์', truckNo: 'PTT-132/64-6636', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 30, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '25-09-26', tripNo: 'TRP-GTTD26092512834', jobNo: 'GTT-D26092418574', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'สมบูรณ์ สิทธิโชค', truckNo: 'PTT-136/64-6650', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '25-09-26', tripNo: 'TRP-GTTD26092512833', jobNo: 'GTT-D26092418573', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'มงคล ชัยเชียงสา', truckNo: 'PTT-140/64-6625', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '25-09-26', tripNo: 'TRP-GTTD26092512830', jobNo: 'GTT-D26092418556', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วีระชน', truckNo: '701-3423 : 701-3469', truckType: '6W-Trailer', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6330 },

  // 28-09-26 (Fuel: 41.44, 7 trips, 90 QTY, 28,230 THB)
  { deliveryDate: '28-09-26', tripNo: 'TRP-GTTD26092813451', jobNo: 'GTT-D26092820353', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'มาโนช', truckNo: '74-6996', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '28-09-26', tripNo: 'TRP-GTTD26092813348', jobNo: 'GTT-D2609251920', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'นายสยามชัย บุญบุญ KTP', truckNo: '68-5480', truckType: '6W-Trailer', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6330 },
  { deliveryDate: '28-09-26', tripNo: 'TRP-GTTD26092813461', jobNo: 'GTT-D26092519441', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ทรงยศ', truckNo: 'PTT-135/64-6626', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '28-09-26', tripNo: 'TRP-GTTD26092813462', jobNo: 'GTT-D26092519440', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'สมศักดิ์ โควตระบา..', truckNo: 'PTT-129/64-6649', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '28-09-26', tripNo: 'TRP-GTTD26092813464', jobNo: 'GTT-D26092519439', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ช่างเสมือนศักดิ์', truckNo: 'PTT-145/64-6646', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '28-09-26', tripNo: 'TRP-GTTD26092813460', jobNo: 'GTT-D26092519436', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'มงคล ชัยเชียงสา', truckNo: 'PTT-64-6625', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '28-09-26', tripNo: 'TRP-GTTD26092813460', jobNo: 'GTT-D26092519436', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'อนุรักษ์', truckNo: 'PTT-139/64-6634', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3650 },

  // 29-09-26 (Fuel: 41.44, 6 trips, 60 QTY, 24,580 THB)
  { deliveryDate: '29-09-26', tripNo: 'TRP-GTTD26092913970', jobNo: 'GTT-D26092921137', pickUpName: 'บริษัท ยูเซ็น โลจิสติกส์ (ประเทศไทย) จำกัด (YBLC)', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'อธิเชษฐ', truckNo: 'PTT-64-6633', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '29-09-26', tripNo: 'TRP-GTTD26092913974', jobNo: 'GTT-D26092921136', pickUpName: 'บริษัท ยูเซ็น โลจิสติกส์ (ประเทศไทย) จำกัด (YBLC)', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'สุทัศน์ IPO', truckNo: '72-7246/IPO', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '29-09-26', tripNo: 'TRP-GTTD26092913981', jobNo: 'GTT-D26092820715', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'ศุภลักษณ์', truckNo: 'PTT-130/64-6635', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '29-09-26', tripNo: 'TRP-GTTD26092913983', jobNo: 'GTT-D26092820713', pickUpName: 'บริษัท ยูเซ็น โลจิสติกส์ (ประเทศไทย) จำกัด (YBLC)', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'กอบสุข ปิ่นเมือง', truckNo: '73-1511 IPO', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '29-09-26', tripNo: 'TRP-GTTD26092913976', jobNo: 'GTT-D26092820712', pickUpName: 'บริษัท ยูเซ็น โลจิสติกส์ (ประเทศไทย) จำกัด (YBLC)', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'อำนาจ.', truckNo: '71-8032', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '29-09-26', tripNo: 'TRP-GTTD26092913979', jobNo: 'GTT-D26092820712', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'วีระชน', truckNo: '701-3423 : 701-3469', truckType: '6W-Trailer', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6330 },

  // 30-09-26 (Fuel: 41.44, 7 trips, 110 QTY, 28,230 THB)
  { deliveryDate: '30-09-26', tripNo: 'TRP-GTTD26093014946', jobNo: 'GTT-D26093020586', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Suvarnabhumi distribution center (YSDC)', driverName: 'กมลทิพย์ บ.ไทยทอย...', truckNo: 'PTT-134/64-6634', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '30-09-26', tripNo: 'TRP-GTTD26093014948', jobNo: 'GTT-D26092921384', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Suvarnabhumi distribution center (YSDC)', driverName: 'รุ่งนิรันดร์', truckNo: '74-1988', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '30-09-26', tripNo: 'TRP-GTTD26093014947', jobNo: 'GTT-D26092921383', pickUpName: 'บริษัท ยูเซ็น โลจิสติกส์ (ประเทศไทย) จำกัด (YBLC)', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'อนุรักษ์', truckNo: 'PTT-128/64-6651', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '30-09-26', tripNo: 'TRP-GTTD26093014942', jobNo: 'GTT-D26092921383', pickUpName: 'บริษัท ยูเซ็น โลจิสติกส์ (ประเทศไทย) จำกัด (YBLC)', deliveryName: 'Yusen Bangna Free Zone Logistics Center (YBFLC)', driverName: 'พิทักษ์เกลือไม้น้อย', truckNo: 'PTT-127/64-6642', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '30-09-26', tripNo: 'TRP-GTTD26093014944', jobNo: 'GTT-D26092921382', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Suvarnabhumi distribution center (YSDC)', driverName: 'ชาญวิทย์', truckNo: '73-4645', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '30-09-26', tripNo: 'TRP-GTTD26093014943', jobNo: 'GTT-D26092921378', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Suvarnabhumi distribution center (YSDC)', driverName: 'อธิเชษฐ', truckNo: 'PTT-64-6633', truckType: '6W', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 20, totalTrip: 1, charterCost: 3650 },
  { deliveryDate: '30-09-26', tripNo: 'TRP-GTTD26093014945', jobNo: 'GTT-D26092921382', pickUpName: 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD', deliveryName: 'Suvarnabhumi distribution center (YSDC)', driverName: 'วีระชน', truckNo: '701-3423 : 701-3469', truckType: '6W-Trailer', fuelRefPrice: 41.44, backhaul: 'No', totalQty: 10, totalTrip: 1, charterCost: 6330 },
];

/**
 * 1. Generate Pivot Table by Truck_Type and Fuel_Ref_Price (Matches Image 2 exactly)
 */
export function buildRolandPivotByTruckType(
  branchFilter: string = 'ALL',
  customerFilter: string = 'ALL'
): {
  rows: RolandTruckPivotRow[];
  totalQty: number;
  totalTrip: number;
  totalCharterCost: number;
  subtotals: {
    '6W': { qty: number; trip: number; cost: number };
    '6W-Trailer': { qty: number; trip: number; cost: number };
  };
} {
  // Desired ordering matching Image 2
  const truckTypes: ('6W' | '6W-Trailer')[] = ['6W', '6W-Trailer'];
  const fuelRatesByTruck: Record<'6W' | '6W-Trailer', number[]> = {
    '6W': [38.39, 41.44, 40.69, 39.14, 39.84],
    '6W-Trailer': [38.39, 41.44, 40.69, 39.14, 39.84],
  };

  const rows: RolandTruckPivotRow[] = [];
  const subtotals = {
    '6W': { qty: 0, trip: 0, cost: 0 },
    '6W-Trailer': { qty: 0, trip: 0, cost: 0 },
  };

  let grandQty = 0;
  let grandTrip = 0;
  let grandCost = 0;

  for (const tType of truckTypes) {
    const fuelList = fuelRatesByTruck[tType];
    for (const fuel of fuelList) {
      const filtered = ROLAND_FINAL_167_TRIPS.filter((t) => {
        const matchesTruck = t.truckType === tType && Math.abs(t.fuelRefPrice - fuel) < 0.001;
        const matchesBranch =
          branchFilter === 'ALL' ||
          t.pickUpName.includes(branchFilter) ||
          t.deliveryName.includes(branchFilter);
        const matchesCustomer =
          customerFilter === 'ALL' ||
          t.pickUpName.includes(customerFilter) ||
          t.deliveryName.includes(customerFilter);
        return matchesTruck && matchesBranch && matchesCustomer;
      });

      const qty = filtered.reduce((sum, t) => sum + t.totalQty, 0);
      const trip = filtered.length;
      const cost = filtered.reduce((sum, t) => sum + t.charterCost, 0);

      if (trip > 0) {
        rows.push({
          truckType: tType,
          fuelRefPrice: fuel,
          totalQty: qty,
          totalTrip: trip,
          charterCost: cost,
        });
      }

      subtotals[tType].qty += qty;
      subtotals[tType].trip += trip;
      subtotals[tType].cost += cost;

      grandQty += qty;
      grandTrip += trip;
      grandCost += cost;
    }
  }

  return {
    rows,
    totalQty: grandQty,
    totalTrip: grandTrip,
    totalCharterCost: grandCost,
    subtotals,
  };
}

/**
 * 2. Generate Pivot Table by Delivery Date (Matches Image 3 exactly)
 */
export function buildRolandPivotByDate(
  branchFilter: string = 'ALL',
  customerFilter: string = 'ALL'
): {
  rows: RolandDatePivotRow[];
  totalQty: number;
  totalTrip: number;
  totalCharterCost: number;
} {
  const dateOrder = [
    '01-09-26', '02-09-26', '03-09-26', '04-09-26', '07-09-26',
    '08-09-26', '09-09-26', '10-09-26', '11-09-26', '14-09-26',
    '15-09-26', '16-09-26', '17-09-26', '18-09-26', '21-09-26',
    '22-09-26', '23-09-26', '24-09-26', '25-09-26', '28-09-26',
    '29-09-26', '30-09-26',
  ];

  const rows: RolandDatePivotRow[] = [];
  let grandQty = 0;
  let grandTrip = 0;
  let grandCost = 0;

  for (const date of dateOrder) {
    const list = ROLAND_FINAL_167_TRIPS.filter((t) => {
      const matchesDate = t.deliveryDate === date;
      const matchesBranch =
        branchFilter === 'ALL' ||
        t.pickUpName.includes(branchFilter) ||
        t.deliveryName.includes(branchFilter);
      const matchesCustomer =
        customerFilter === 'ALL' ||
        t.pickUpName.includes(customerFilter) ||
        t.deliveryName.includes(customerFilter);
      return matchesDate && matchesBranch && matchesCustomer;
    });

    if (list.length === 0) continue;
    const qty = list.reduce((sum, t) => sum + t.totalQty, 0);
    const trip = list.length;
    const cost = list.reduce((sum, t) => sum + t.charterCost, 0);
    const fuel = list[0].fuelRefPrice;

    rows.push({
      deliveryDate: date,
      fuelRefPrice: fuel,
      backhaul: 'No',
      totalQty: qty,
      totalTrip: trip,
      charterCost: cost,
    });

    grandQty += qty;
    grandTrip += trip;
    grandCost += cost;
  }

  return {
    rows,
    totalQty: grandQty,
    totalTrip: grandTrip,
    totalCharterCost: grandCost,
  };
}

/**
 * Convert Roland 167 records into RawTripData[] for import into main billing system
 */
export function convertRolandToRawTrips(): RawTripData[] {
  return ROLAND_FINAL_167_TRIPS.map((r, idx) => ({
    id: `roland-verified-${idx + 1}`,
    issueDate: r.deliveryDate.replace(/-/g, '/'),
    jobNo: r.jobNo,
    tripNo: r.tripNo,
    branch: 'บางบ่อ' as const,
    consigneeShipper: r.pickUpName.includes('YBLC') ? 'YUSEN LOGISTICS (THAILAND) BLC' : 'ROLAND DIGITAL GROUP (THAILAND) CO.,LTD',
    pickUpName: r.pickUpName,
    pickUpDistrict: 'บางบ่อ',
    pickUpProvince: 'สมุทรปราการ',
    pickUpZone: 'บางบ่อ',
    deliveryName: r.deliveryName,
    deliveryDistrict: 'บางบ่อ',
    deliveryProvince: 'สมุทรปราการ',
    deliveryZone: 'Free Zone บางบ่อ',
    driverName: r.driverName,
    truckNo: r.truckNo,
    truckType: r.truckType === '6W-Trailer' ? '6W-Trailer' : '6W/Single Unit',
    tripStatus: 'FinishTrip',
    backhaul: r.backhaul,
    haulType: 'Direct',
    qty: r.totalQty,
    truckCharge: r.charterCost,
    customerQuotedRate: r.charterCost,
    deliveryRemark: `Roland Verified Ground Truth (เรทน้ำมัน ${r.fuelRefPrice.toFixed(2)} ฿/L)`,
  }));
}

/**
 * Export Roland Pivot Tables and 167 Raw Trips directly to Excel (.xlsx)
 */
export function exportRolandPivotExcel(): void {
  const wb = XLSX.utils.book_new();

  // 1. Sheet 1: Pivot By Truck Type (Matches Image 2)
  const truckPivot = buildRolandPivotByTruckType();
  const truckPivotData = [
    ['ตารางคำนวนการวิ่งรถ แต่ละประเภท — ROLAND DIGITAL GROUP (THAILAND) CO.,LTD'],
    ['Generated on:', new Date().toLocaleString('th-TH')],
    [],
    ['Truck_Type', 'Fuel_Ref_Price', 'Total QTY', 'Total trip', 'Charter Cost'],
    ...truckPivot.rows.map((r) => [
      r.truckType,
      r.fuelRefPrice,
      r.totalQty,
      r.totalTrip,
      r.charterCost,
    ]),
    [],
    ['Grand Total', '', truckPivot.totalQty, truckPivot.totalTrip, truckPivot.totalCharterCost],
  ];
  const wsTruck = XLSX.utils.aoa_to_sheet(truckPivotData);
  wsTruck['!cols'] = [{ wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsTruck, 'Pivot_By_Truck_Type');

  // 2. Sheet 2: Pivot By Delivery Date (Matches Image 3)
  const datePivot = buildRolandPivotByDate();
  const datePivotData = [
    ['ตารางคำนวนรายวันตามราคาอ้างอิงน้ำมัน — ROLAND DIGITAL GROUP (THAILAND) CO.,LTD'],
    ['Generated on:', new Date().toLocaleString('th-TH')],
    [],
    ['Delivery Date', 'Fuel_Ref_Price', 'Backhaul', 'Total QTY', 'Total trip', 'Charter Cost'],
    ...datePivot.rows.map((r) => [
      r.deliveryDate,
      r.fuelRefPrice,
      r.backhaul,
      r.totalQty,
      r.totalTrip,
      r.charterCost,
    ]),
    [],
    ['Grand Total', '', '', datePivot.totalQty, datePivot.totalTrip, datePivot.totalCharterCost],
  ];
  const wsDate = XLSX.utils.aoa_to_sheet(datePivotData);
  wsDate['!cols'] = [{ wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsDate, 'Pivot_By_Delivery_Date');

  // 3. Sheet 3: Raw 167 Trips (Matches Image 1)
  const rawTripsData = [
    [
      'Delivery Date',
      'Trip No',
      'Job No.',
      'Pick Up Name',
      'Delivery Name',
      'Driver Name',
      'Truck No',
      'Truck_Type',
      'Fuel_Ref_Price',
      'Backhaul',
      'Total QTY',
      'Total trip',
      'Charter Cost',
    ],
    ...ROLAND_FINAL_167_TRIPS.map((t) => [
      t.deliveryDate,
      t.tripNo,
      t.jobNo,
      t.pickUpName,
      t.deliveryName,
      t.driverName,
      t.truckNo,
      t.truckType,
      t.fuelRefPrice,
      t.backhaul,
      t.totalQty,
      t.totalTrip,
      t.charterCost,
    ]),
  ];
  const wsRaw = XLSX.utils.aoa_to_sheet(rawTripsData);
  wsRaw['!cols'] = [
    { wch: 14 },
    { wch: 24 },
    { wch: 22 },
    { wch: 42 },
    { wch: 44 },
    { wch: 22 },
    { wch: 20 },
    { wch: 14 },
    { wch: 16 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsRaw, 'Detail_167_Trips');

  XLSX.writeFile(wb, 'ROLAND_DIGITAL_GROUP_Final_Pivot_Table_Sep2026.xlsx');
}
