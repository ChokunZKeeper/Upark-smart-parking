
/* ------------------------------ Types ------------------------------ */

import * as Icons from "@/styles/Icons";

export type NavIconName = keyof typeof Icons;

export interface NavItem {
  label: string;
  path: string;
  icon: NavIconName;
}

export type Period = 'today' | 'week' | 'month' | 'year';

export interface SummaryItem {
  label: string;
  value: string;
  left?: string;
  trend?: { text: string; up: boolean };
}

export interface OccupancyPoint {
  time: string;
  value: number;
}

export interface VehicleType {
  name: string;
  count: number;
}

export interface Activity {
  id: number;
  floor: Floor;
  type: 'entered' | 'left';
  message: string;
  time: string;
}

export type Floor = 'A' | 'B' | 'C' | 'D';

export type ParkingStatus = 'occupied' | 'available' | 'offline';

export interface ParkingFilter {
  value: 'all' | ParkingStatus;
  label: string;
}

export interface ParkingStats {
  total: number;
  occupied: number;
  available: number;
  offline: number;
}

export interface ParkingSpot {
  id: string;
  status: ParkingStatus;
}

export interface ParkingBlock {
  key: string;
  area: string;
  top: ParkingSpot[];
  bottom: ParkingSpot[];
}

export interface HeatSummaryItem {
  floor: Floor;
  percent: number | null;
  used?: number;
  total?: number;
}

export type HeatPaletteName = 'Blue' | 'Green' | 'Purple' | 'Orange';

export interface HeatPalette {
  low: string;
  mid: string;
  high: string;
  dot: string;
}

export type HeatLevel = 'low' | 'mid' | 'high';

export type ReportMetricKey =
  | 'revenue'
  | 'vehicles'
  | 'parkTime'
  | 'occupancy';

export interface ReportRow {
  day: number;
  vehicles: number;
  occupancy: number;
  peak: number;
  parkTime: number;
  revenue: number;
}

export interface QrCode {
  id: number;
  name: string;
  url: string;
  zone: string;
  floor: Floor;
  created: string;
}

export interface TaxMonthly {
  month: string;
  revenue: number;
  tax: number;
}

export interface TaxTransaction {
  id: number;
  date: string;
  message: string;
  type: 'income' | 'expense';
}

export interface TaxDeadline {
  id: number;
  code: string;
  date: string;
  title: string;
  status: 'Overdue' | 'Due Soon' | 'Upcoming';
}

export interface Vehicle {
  id: number;
  plate: string;
  type: string;
  floor: Floor;
  zone: string;
  timeIn: string;
  timeOut: string;
  date: string;
  image: string;
}

export interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  gradientProfile: string;
}

/* ------------------------------ Common ------------------------------ */

// เปลี่ยน HAS_DATA เป็น false เพื่อลองข้อมูลแบบมีกับไม่มี
export const HAS_DATA: boolean = true;

export const company = {
  name: 'Company',
  email: 'Company@hotmail.com',
};

export const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard_icon' },
  { label: 'Parking', path: '/parking', icon: 'parking_icon' },
  { label: 'Heat Map', path: '/heatmap', icon: 'heatmap_icon' },
  { label: 'Reports', path: '/reports', icon: 'reports_icon' },
  { label: 'QR code', path: '/qrcode', icon: 'qrcode_icon' },
];

export const secondaryNavItems: NavItem[] = [
  { label: 'Permissions', path: '/permissions', icon: 'permissions_icon' },
  { label: 'Vehicle Search', path: '/vehicle-search', icon: 'vehicle_search_icon' },
  { label: 'System Settings', path: '/system-settings', icon: 'system_settings_icon' },
];

export const footerNavItems: NavItem[] = [
  { label: 'Settings', path: '/settings', icon: 'settings_icon' },
  { label: 'Notifications', path: '/notifications', icon: 'notifications_icon' },
];



/* ------------------------------ Profile ------------------------------ */

// ห้ามเปลี่ยนค่า Gradient ชุดนี้
export const colorProfile = {
  red:    "linear-gradient(180deg, #FF0000 0%, #FFFF00 90%)",
  orange: "linear-gradient(180deg, #ff7300 7%, #FFAA00 40%, #FFD700 62%, #FFFF00 90%)",
  green:  "linear-gradient(180deg, #00c54c 10%, #FFFF00 87%)",
  blue:   "linear-gradient(180deg, #0057da 10%, #00FFE1 90%)",
  purple: "linear-gradient(180deg, #5827fc 10%, #FDA4FF 90%)",
  dark:   "linear-gradient(180deg, #0A1647 10%, #918CA9 90%)",
} as const;

export type ColorName = keyof typeof colorProfile;

const AvatarColors = Object.keys(colorProfile) as ColorName[];

export const getRandomColor = (): ColorName => {
  if (AvatarColors.length === 0) {
    return "dark";
  }

  const randomColor =
    AvatarColors[Math.floor(Math.random() * AvatarColors.length)];

  return randomColor;
};

/* ---------------------------- Dashboard ---------------------------- */

export const periods: { value: Period; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

const defaultSummaryByPeriod: Record<Period, SummaryItem[]> = {
  today: [
    { label: 'Total Revenue', value: 'THB 18,450', left: 'Previous Day Revenue', trend: { text: '12.1% vs last day', up: true } },
    { label: 'Current Vehicles', value: '33', left: 'Previous Day Cars', trend: { text: '2.3% vs last day', up: true } },
    { label: 'Today Revenue', value: 'THB 1,120', left: 'Previous Day Revenue', trend: { text: '0.8% vs last day', up: false } },
    { label: 'Avg. Park time', value: '3.4 Hours', left: 'Previous Day Park time', trend: { text: '0.6% vs last day', up: false } },
  ],
  week: [
    { label: 'Total Revenue', value: 'THB 124,300', left: 'Previous Week Revenue', trend: { text: '28.4% vs last week', up: true } },
    { label: 'Current Vehicles', value: '33', left: 'Previous Week Cars', trend: { text: '2.3% vs last week', up: true } },
    { label: 'This Week Revenue', value: 'THB 2,260', left: 'Previous Week Revenue', trend: { text: '1.2% vs last week', up: false } },
    { label: 'Avg. Park time', value: '3.7 Hours', left: 'Previous Week Park time', trend: { text: '1.2% vs last week', up: false } },
  ],
  month: [
    { label: 'Total Revenue', value: 'THB 512,900', left: 'Previous Month Revenue', trend: { text: '9.7% vs last month', up: true } },
    { label: 'Current Vehicles', value: '33', left: 'Previous Month Cars', trend: { text: '4.1% vs last month', up: true } },
    { label: 'This Month Revenue', value: 'THB 9,840', left: 'Previous Month Revenue', trend: { text: '2.2% vs last month', up: false } },
    { label: 'Avg. Park time', value: '3.9 Hours', left: 'Previous Month Park time', trend: { text: '3.0% vs last month', up: true } },
  ],
  year: [
    { label: 'Total Revenue', value: 'THB 6.1M', left: 'Previous Year Revenue', trend: { text: '17.5% vs last year', up: true } },
    { label: 'Current Vehicles', value: '33', left: 'Previous Year Cars', trend: { text: '6.4% vs last year', up: true } },
    { label: 'This Year Revenue', value: 'THB 118,400', left: 'Previous Year Revenue', trend: { text: '1.9% vs last year', up: false } },
    { label: 'Avg. Park time', value: '3.8 Hours', left: 'Previous Year Park time', trend: { text: '0.4% vs last year', up: true } },
  ],
};

const emptySummaryByPeriod = Object.fromEntries(
  Object.entries(defaultSummaryByPeriod).map(([k, list]) => [
    k,
    list.map((item) => ({ label: item.label, value: 'No Data' })),
  ]),
) as Record<Period, SummaryItem[]>;

export const summaryByPeriod: Record<Period, SummaryItem[]> =
  HAS_DATA ? defaultSummaryByPeriod : emptySummaryByPeriod;

export const chartScaleByPeriod: Record<Period, number> = {
  today: 0.82,
  week: 1,
  month: 0.94,
  year: 0.88,
};

const hourLabels = Array.from({ length: 25 }, (_, i) => {
  const minutes = 6 * 60 + i * 30;
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
});

const barValues = [
  500, 590, 850, 730, 845, 845, 250, 860, 750, 860,
  250, 730, 640, 530, 535, 770, 1000, 640, 640, 500,
  410, 660, 475, 765, 1000,
];

const lineValues = [
  500, 440, 370, 300, 230, 175, 145, 155, 205, 265,
  325, 375, 405, 415, 400, 365, 325, 295, 270, 250,
  255, 285, 340, 440, 600,
];

export const occupancyBarData: OccupancyPoint[] = HAS_DATA
  ? hourLabels.map((time, i) => ({ time, value: barValues[i] }))
  : [];

export const occupancyLineData: OccupancyPoint[] = HAS_DATA
  ? hourLabels.map((time, i) => ({ time, value: lineValues[i] }))
  : [];

export const vehicleTypes: VehicleType[] = HAS_DATA
  ? [
      { name: 'Sedans', count: 7 },
      { name: 'SUVs', count: 9 },
      { name: 'Pickups', count: 8 },
      { name: 'Vans', count: 9 },
    ]
  : [];

export const recentActivity: Activity[] = HAS_DATA
  ? [
      { id: 1, floor: 'A', type: 'entered', message: 'A car just entered ( กด 4779 ,Bangkok )', time: 'Just now' },
      { id: 2, floor: 'C', type: 'left', message: 'A car just left ( ฏน 1812 ,Bangkok ) Paid 60 THB', time: 'A minute ago' },
      { id: 3, floor: 'D', type: 'entered', message: 'A car just entered ( ฉว 545 ,Bangkok )', time: '2 minutes ago' },
      { id: 4, floor: 'B', type: 'entered', message: 'A car just entered ( สห 999 ,Bangkok )', time: '3 minutes ago' },
      { id: 5, floor: 'C', type: 'left', message: 'A car just left ( ฟง 1967 ,Bangkok ) Paid 60 THB', time: '6 minutes ago' },
    ]
  : [];

/* ----------------------------- Parking ----------------------------- */

export const parkingFilters: ParkingFilter[] = [
  { value: 'all', label: 'All' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'available', label: 'Available' },
  { value: 'offline', label: 'Offline' },
];

export const floors: Floor[] = ['A', 'B', 'C', 'D'];

export const parkingStatsByFloor: Record<Floor, ParkingStats> = {
  A: { total: 1000, occupied: 820, available: 170, offline: 10 },
  B: { total: 800, occupied: 540, available: 255, offline: 5 },
  C: { total: 600, occupied: 205, available: 392, offline: 3 },
  D: { total: 450, occupied: 366, available: 80, offline: 4 },
};

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

const blockDefs = [
  { key: 'tl', area: 'tl', top: range(1, 6), bottom: range(7, 12) },
  { key: 'tm', area: 'tm', top: range(25, 30), bottom: range(31, 36) },
  { key: 'tr', area: 'tr', top: [49], bottom: [50] },
  { key: 'bl', area: 'bl', top: range(13, 18), bottom: range(19, 24) },
  { key: 'bm', area: 'bm', top: range(37, 42), bottom: range(43, 48) },
  { key: 'br', area: 'br', top: [51], bottom: [52] },
];

const availableA = [1, 6, 9, 23, 27, 34, 35, 38, 45, 46, 47];
const offlineA = [16, 50];

const mulberry32 = (seed: number) => (): number => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const getParkingLayout = (floor: Floor): ParkingBlock[] => {
  if (!HAS_DATA) return [];

  const floorIndex = floors.indexOf(floor);
  const rand = mulberry32(floorIndex * 97 + 13);

  const statusOf = (n: number): ParkingStatus => {
    if (floorIndex === 0) {
      if (offlineA.includes(n)) return 'offline';
      if (availableA.includes(n)) return 'available';
      return 'occupied';
    }

    const r = rand();

    if (r < 0.04) return 'offline';
    if (r < 0.04 + 0.12 * (floorIndex + 1)) return 'available';

    return 'occupied';
  };

  const build = (numbers: number[]): ParkingSpot[] =>
    numbers.map((n) => ({
      id: `${floor}${String(n).padStart(2, '0')}`,
      status: statusOf(n),
    }));

  return blockDefs.map((b) => ({
    key: b.key,
    area: b.area,
    top: build(b.top),
    bottom: build(b.bottom),
  }));
};

/* ----------------------------- Heat map ----------------------------- */

export const heatHours: string[] = Array.from(
  { length: 13 },
  (_, i) => `${String(6 + i).padStart(2, '0')}:00`,
);

export const heatDays: string[] = [
  'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN',
];

export const heatSummary: HeatSummaryItem[] = HAS_DATA
  ? [
      { floor: 'A', percent: 92, used: 48, total: 52 },
      { floor: 'B', percent: 68, used: 37, total: 55 },
      { floor: 'C', percent: 34, used: 20, total: 60 },
      { floor: 'D', percent: 81, used: 38, total: 47 },
    ]
  : [
      { floor: 'A', percent: null },
      { floor: 'B', percent: null },
      { floor: 'C', percent: null },
      { floor: 'D', percent: null },
    ];



export const heatLegend: { label: string; level: HeatLevel }[] = [
  { label: '0 - 25', level: 'low' },
  { label: '> 25', level: 'mid' },
  { label: '> 45', level: 'high' },
];

const heatFloorA: number[][] = [
  [35, 12, 10, 16, 33, 60, 62, 18, 14, 63, 61, 15, 34],
  [14, 11, 13, 30, 12, 15, 10, 14, 64, 13, 12, 15, 14],
  [12, 15, 13, 18, 62, 14, 32, 35, 13, 12, 16, 14, 15],
  [14, 34, 13, 15, 12, 33, 60, 16, 14, 61, 15, 32, 14],
  [15, 13, 14, 12, 33, 13, 15, 65, 12, 14, 13, 16, 15],
  [62, 61, 14, 12, 15, 60, 14, 35, 13, 15, 14, 32, 33],
  [34, 14, 62, 63, 15, 13, 61, 12, 33, 14, 60, 15, 32],
];

export const getHeatData = (floor: Floor): number[][] => {
  if (!HAS_DATA) return [];
  if (floor === 'A') return heatFloorA;

  const rand = mulberry32(floors.indexOf(floor) * 31 + 7);

  return heatDays.map(() =>
    heatHours.map(() => Math.round(rand() * 70)),
  );
};

/* ------------------------------ Reports ------------------------------ */

export const reportMetrics: { value: ReportMetricKey; label: string }[] = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'vehicles', label: 'Vehicles' },
  { value: 'parkTime', label: 'Avg. park time' },
  { value: 'occupancy', label: 'Occupancy' },
];

// One row per day, 1 Oct - 13 Oct (oldest first).
export const reportDaily: ReportRow[] = HAS_DATA
  ? [
      { day: 1, vehicles: 190, occupancy: 61, peak: 82, parkTime: 3.7, revenue: 7000 },
      { day: 2, vehicles: 205, occupancy: 64, peak: 85, parkTime: 3.8, revenue: 6100 },
      { day: 3, vehicles: 150, occupancy: 49, peak: 70, parkTime: 3.2, revenue: 3300 },
      { day: 4, vehicles: 140, occupancy: 46, peak: 66, parkTime: 3.1, revenue: 2100 },
      { day: 5, vehicles: 185, occupancy: 57, peak: 80, parkTime: 3.6, revenue: 4400 },
      { day: 6, vehicles: 215, occupancy: 66, peak: 88, parkTime: 4.0, revenue: 5600 },
      { day: 7, vehicles: 220, occupancy: 69, peak: 90, parkTime: 4.1, revenue: 5900 },
      { day: 8, vehicles: 210, occupancy: 65, peak: 86, parkTime: 3.9, revenue: 4800 },
      { day: 9, vehicles: 175, occupancy: 55, peak: 78, parkTime: 3.5, revenue: 3500 },
      { day: 10, vehicles: 180, occupancy: 58, peak: 77, parkTime: 3.6, revenue: 3620 },
      { day: 11, vehicles: 235, occupancy: 76, peak: 94, parkTime: 4.2, revenue: 4790 },
      { day: 12, vehicles: 270, occupancy: 85, peak: 98, parkTime: 4.5, revenue: 5200 },
      { day: 13, vehicles: 225, occupancy: 72, peak: 91, parkTime: 4.1, revenue: 7900 },
    ]
  : [];

export const reportRangeLabel = '1 Oct - 13 Oct';

/* ------------------------------ QR Code ------------------------------ */

export const initialQrCodes: QrCode[] = HAS_DATA
  ? [
      { id: 1, name: 'Floor A', url: 'https://upark.com/parking/A1', zone: 'A1', floor: 'A', created: '01/10/26' },
      { id: 2, name: 'Floor B', url: 'https://upark.com/parking/B1', zone: 'B1', floor: 'B', created: '02/10/26' },
      { id: 3, name: 'Floor C', url: 'https://upark.com/parking/C1', zone: 'C1', floor: 'C', created: '03/10/26' },
      { id: 4, name: 'Floor D', url: 'https://upark.com/parking/D1', zone: 'D1', floor: 'D', created: '04/10/26' },
    ]
  : [];

/* ------------------------------ Taxation ------------------------------ */

export const taxSummary: SummaryItem[] = [
  { label: 'Total Revenue', value: 'THB 124,300', left: 'Previous Week Revenue', trend: { text: '28.4% vs last week', up: true } },
  { label: 'Total Expenses', value: 'THB 50,000', left: 'Previous Week Cars', trend: { text: '2.3% vs last week', up: true } },
  { label: 'Tax Liability (Estimated)', value: 'THB 2,260', left: 'Previous Week Park time', trend: { text: '1.2% vs last week', up: false } },
  { label: 'Payment Status', value: 'On Track', left: 'All fillings are up to date' },
];

// Values in THB thousands (K).
export const taxMonthly: TaxMonthly[] = [
  { month: 'June', revenue: 400, tax: 300 },
  { month: 'July', revenue: 350, tax: 260 },
  { month: 'August', revenue: 440, tax: 265 },
  { month: 'September', revenue: 410, tax: 215 },
];

export const taxTransactions: TaxTransaction[] = [
  { id: 1, date: 'Oct 27, 2026', message: '( ฉว 545 ,Bangkok ) Paid 60 THB', type: 'income' },
  { id: 2, date: 'Oct 26, 2026', message: '( ฏน 1812 ,Bangkok ) Paid 60 THB', type: 'income' },
  { id: 3, date: 'Oct 25, 2026', message: '( Electricity bill ) Paid 8260 THB', type: 'expense' },
  { id: 4, date: 'Oct 25, 2026', message: '( Water bill ) Paid 200 THB', type: 'expense' },
  { id: 5, date: 'Oct 24, 2026', message: '( กด 5997 ,Nonthaburi ) Paid 60 THB', type: 'income' },
];

export const taxDeadlines: TaxDeadline[] = [
  { id: 1, code: 'PND.1', date: 'Oct 27, 2026', title: 'Submit employee salary withholding tax for...', status: 'Overdue' },
  { id: 2, code: 'PND.3', date: 'Oct 26, 2026', title: 'Submit withholding tax for individual service providers...', status: 'Due Soon' },
  { id: 3, code: 'PND.53', date: 'Oct 26, 2026', title: 'Submit withholding tax for corporate service providers...', status: 'Upcoming' },
  { id: 4, code: 'PP.30', date: 'Oct 25, 2026', title: 'Submit VAT return for September 2026', status: 'Upcoming' },
  { id: 5, code: 'SSC', date: 'Oct 24, 2026', title: 'Submit employee social security contributions for...', status: 'Upcoming' },
];

/* --------------------------- Vehicle Search --------------------------- */

export const initialVehicles: Vehicle[] = HAS_DATA
  ? [
      {
        id: 1,
        plate: 'KT 4582, Bangkok',
        type: 'Sedan',
        floor: 'D',
        zone: 'D1',
        timeIn: '08:12 AM',
        timeOut: '10:45 AM',
        date: '26 Oct 2026',
        image: 'img...4582',
      },
      {
        id: 2,
        plate: 'KM 7291, Chanthaburi',
        type: 'SUVs',
        floor: 'B',
        zone: 'B1',
        timeIn: '08:35 AM',
        timeOut: '12:18 PM',
        date: '26 Oct 2026',
        image: 'img...7291',
      },
      {
        id: 3,
        plate: '3KW 1845, Trat',
        type: 'Sedan',
        floor: 'A',
        zone: 'A1',
        timeIn: '09:02 AM',
        timeOut: '09:56 AM',
        date: '26 Oct 2026',
        image: 'img...1845',
      },
      {
        id: 4,
        plate: 'KT 9026, Chiang Rai',
        type: 'Sedan',
        floor: 'A',
        zone: 'A1',
        timeIn: '09:24 AM',
        timeOut: '01:42 PM',
        date: '26 Oct 2026',
        image: 'img...9026',
      },
      {
        id: 5,
        plate: 'KJ 6619, Bangkok',
        type: 'Pickup Truck',
        floor: 'D',
        zone: 'D1',
        timeIn: '10:15 AM',
        timeOut: '02:30 PM',
        date: '26 Oct 2026',
        image: 'img...6619',
      },
      {
        id: 6,
        plate: 'KN 3520, Bangkok',
        type: 'Sedan',
        floor: 'C',
        zone: 'C1',
        timeIn: '10:48 AM',
        timeOut: '03:16 PM',
        date: '26 Oct 2026',
        image: 'img...3520',
      },
      {
        id: 7,
        plate: '4KR 8173, Tak',
        type: 'SUVs',
        floor: 'A',
        zone: 'A1',
        timeIn: '11:06 AM',
        timeOut: '11:52 AM',
        date: '26 Oct 2026',
        image: 'img...8173',
      },
      {
        id: 8,
        plate: '1KM 5408, Ayutthaya',
        type: 'Sedan',
        floor: 'B',
        zone: 'B1',
        timeIn: '11:32 AM',
        timeOut: '04:05 PM',
        date: '26 Oct 2026',
        image: 'img...5408',
      },
    ]
  : [];
