import { useLayoutEffect, useState } from 'react';
import type { CSSProperties } from 'react';

/**
 * ย่อ/ขยาย stage ขนาดคงที่ (width x height) ให้พอดีหน้าต่าง และจัดกึ่งกลาง
 */
export function useFitScale(width: number, height: number): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    const fit = () => {
      const s = Math.min(window.innerWidth / width, window.innerHeight / height);
      const x = (window.innerWidth - width * s) / 2;
      const y = (window.innerHeight - height * s) / 2;
      setStyle({ transform: `translate(${x}px, ${y}px) scale(${s})` });
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [width, height]);

  return style;
}
