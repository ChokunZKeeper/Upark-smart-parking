import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import KioskDisplay from '@/components/kiosk/KioskDisplay'
import type { KioskData, KioskState } from '@/components/kiosk/types'
import '@/components/kiosk/kiosk.css'

/* ===== ข้อมูลตัวอย่าง ===== */
const SAMPLES: Record<KioskState, KioskData> = {
  welcome: { state: 'welcome', plate: 'กด 4779', grace: '15 Minutes', max: '7 hours' },
  pay: { state: 'pay', plate: 'กด 4779', checkIn: '12.00', checkOut: '17:00', fee: 300 },
  overstay: {
    state: 'overstay',
    plate: 'กด 4779',
    checkIn: '12.00',
    checkOut: '17:00',
    fee: 60,
    extra: '1hr',
  },
}

const LABELS: Record<KioskState, string> = {
  welcome: 'Welcome',
  pay: 'Payment',
  overstay: 'Overstay',
}

/* ===== Page ===== */

function KioskPage() {
  const navigate = useNavigate()
  const { url_uuid } = useParams()
  const [state, setState] = useState<KioskState>('welcome')

  const handleClose = () => {
    navigate(`/system/${url_uuid}/settings`)
  }

  return (
    <div className="kiosk-overlay">
      {/* ปุ่มปิด กลับหน้า Settings */}
      <button className="kiosk-close-btn" type="button" onClick={handleClose}>
        ✕ ออกจาก Kiosk
      </button>

      {/* หน้าจอ Kiosk */}
      <KioskDisplay
        data={SAMPLES[state]}
        onSupport={() => console.log('kiosk:support')}
      />

      {/* Dev switcher — ลบออกได้ตอนใช้งานจริง */}
      <div className="kiosk-dev">
        {(Object.keys(SAMPLES) as KioskState[]).map((s) => (
          <button key={s} type="button" onClick={() => setState(s)}>
            {LABELS[s]}
          </button>
        ))}
      </div>
    </div>
  )
}

export default KioskPage
