export type KioskState = 'welcome' | 'pay' | 'overstay';

/** ข้อมูลที่ใช้ร่วมกันทุกหน้าจอ */
interface BaseData {
  /** ป้ายทะเบียน เช่น "กด 4779" */
  plate?: string;
}

/** หน้า Welcome */
export interface WelcomeData extends BaseData {
  state: 'welcome';
  mallName?: string;
  /** เช่น "15 Minutes" */
  grace?: string;
  /** เช่น "7 hours" */
  max?: string;
}

/** หน้า Payment */
export interface PayData extends BaseData {
  state: 'pay';
  checkIn?: string;
  checkOut?: string;
  fee?: number | string;
}

/** หน้า Payment แบบจอดเกินเวลา */
export interface OverstayData extends Omit<PayData, 'state'> {
  state: 'overstay';
  /** เช่น "1hr" */
  extra?: string;
}

export type KioskData = WelcomeData | PayData | OverstayData;
