import type { ReactNode } from 'react';
import { useFitScale } from './hooks/useFitScale';
import type { KioskData } from './types';
import PlaceholderQR from './PlaceholderQR';

const STAGE_W = 4128;
const STAGE_H = 6240;
const DEFAULT_PLATE = 'กด 4779';

interface KioskDisplayProps {
  data: KioskData;
  cctv?: ReactNode;
  qrSrc?: string;
  onSupport?: () => void;
}

export default function KioskDisplay({ data, cctv, qrSrc, onSupport }: KioskDisplayProps) {
  const fitStyle = useFitScale(STAGE_W, STAGE_H);
  const plate = data.plate || DEFAULT_PLATE;
  const isWelcome = data.state === 'welcome';

  return (
    <div className="kiosk-stage" data-state={data.state} style={fitStyle}>
      {data.state === 'welcome' ? (
        <div className="kiosk-row kiosk-title">Welcome to {data.mallName || '(Mall name)'}!</div>
      ) : (
        <div className="kiosk-row kiosk-title">Payment method: Promptpay</div>
      )}

      <div className="kiosk-cctv">{cctv ?? 'CCTV'}</div>

      {data.state === 'welcome' && (
        <>
          <div className="kiosk-row kiosk-plate-big">{plate}</div>
          <div className="kiosk-row kiosk-info kiosk-grace">Grace Period: {data.grace || '-'}</div>
          <div className="kiosk-row kiosk-info kiosk-max">Max parking duration: {data.max || '-'}</div>
        </>
      )}

      {!isWelcome && (
        <>
          <div className="kiosk-plate-s">{plate}</div>
          <div className="kiosk-times">
            {`IN : ${data.checkIn || '-'}  OUT: ${data.checkOut || '-'}`}
          </div>
          {data.state === 'overstay' && (
            <div className="kiosk-extra">
              {`You've stayed for an extra ${data.extra || '-'}`}
            </div>
          )}
          <div className="kiosk-fee">{`Parking fee: ${data.fee != null ? data.fee : '-'}฿`}</div>
          <div className="kiosk-qr">{qrSrc ? <img alt="QR" src={qrSrc} /> : <PlaceholderQR />}</div>
        </>
      )}

      <button className="kiosk-support" type="button" onClick={onSupport}>
        Contact Support
      </button>
    </div>
  );
}
