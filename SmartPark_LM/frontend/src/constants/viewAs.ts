// เชื่อม "path ของเมนู" กับ "key สิทธิ์" ที่อยู่ใน Roles.tsx
// ลำดับในนี้ = ลำดับความสำคัญตอนเลือกหน้าแรกให้ View as Role
export const MENU_PERMISSION: Record<string, string> = {
  dashboard: 'dashboard',
  parking: 'parking',
  heatmap: 'heatmap',
  reports: 'reports',
  qrcode: 'qr',
  permissions: 'permissions_manage',
  'system-settings': 'system_access',
}

const KEY = 'viewAsRole'

export type ViewAsRole = { name: string; permissions: string[] }

// หน้าย่อย -> เมนูหลักที่ใช้สิทธิ์ร่วมกัน (Taxation อยู่ใต้ Reports, Roles อยู่ใต้ Permissions)
const SUB_PAGE_PARENT: Record<string, string> = {
  taxation: 'reports',
  roles: 'permissions',
}

// หน้าที่ต้องใช้สิทธิ์เฉพาะของตัวเอง (ไม่ใช่เมนูใน Sidebar)
const PAGE_PERMISSION: Record<string, string> = {
  edit_parking_layout: 'can_edit',
}

// เช็กว่า role นี้เข้า path นี้ได้ไหม (path ไม่รวม /system/<uuid> เช่น '/heatmap')
// หน้าที่ไม่ได้ผูกสิทธิ์ไว้ (Vehicle Search, Settings, Notifications ฯลฯ) เข้าได้เสมอ
export const canAccessPath = (permissions: string[], path: string): boolean => {
  const segment = path.split('/').filter(Boolean)[0] ?? ''
  const menu = SUB_PAGE_PARENT[segment] ?? segment
  const key = PAGE_PERMISSION[segment] ?? MENU_PERMISSION[menu]
  return !key || permissions.includes(key)
}

// ใช้กับปุ่มที่ต้องมีสิทธิ์ Can Edit เช่น Add Facility, Remove Facility, Create new QR
// ไม่ได้อยู่ในโหมด View as = แก้ไขได้ตามปกติ
export const canEdit = (): boolean => {
  const viewAs = getViewAs()
  return !viewAs || viewAs.permissions.includes('can_edit')
}

// ใช้กับปุ่มที่ต้องมีสิทธิ์ Manage Permission เช่น Manage Role, Edit/Remove สมาชิก
// ถ้าอยู่ใน View as และ role นั้น มี permissions_manage = แสดงว่า "ถูกจำกัดสิทธิ์จัดการ" ให้ซ่อนปุ่ม
// ถ้าไม่ได้อยู่ใน View as = ผู้ใช้จริง (Super Admin/Owner) จัดการได้ตามปกติ
export const canManagePermissions = (): boolean => {
  const viewAs = getViewAs()
  // ไม่ได้อยู่ในโหมด View as → จัดการได้
  if (!viewAs) return true
  // อยู่ใน View as: ถ้า role นั้นมี permissions_manage → ซ่อนปุ่มจัดการ (read-only)
  // เพราะ permissions_manage หมายถึง role นั้น "เห็น" หน้า Permissions ได้
  // แต่ตามโจทย์ "เมื่อเปิดใช้งาน Manage Permission ให้ซ่อนปุ่ม Manage Role, Edit, Remove"
  return !viewAs.permissions.includes('permissions_manage')
}

// หา path แรกที่ role นี้มีสิทธิ์เข้าได้ (ไม่มีเลย = null)
export const getFirstAllowedPath = (permissions: string[]): string | null => {
  const entry = Object.entries(MENU_PERMISSION).find(([, key]) => permissions.includes(key))
  return entry ? entry[0] : null
}

// อ่านค่า: ถ้าไม่ได้อยู่ในโหมดดู จะได้ null
export const getViewAs = (): ViewAsRole | null => {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// บันทึกว่ากำลังดูในมุมมอง role นี้
export const setViewAs = (role: ViewAsRole) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(role))
  } catch {
    /* ignore */
  }
}

// ออกจากโหมดดู
export const clearViewAs = () => {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}