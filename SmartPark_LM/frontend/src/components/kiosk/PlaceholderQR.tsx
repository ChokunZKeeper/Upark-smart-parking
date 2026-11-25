import { useMemo } from 'react';

const N = 29;

/** สร้าง path ของ QR ปลอม (ใช้ seed คงที่ ผลลัพธ์เหมือนเดิมทุกครั้ง) */
function buildPath(): string {
  let seed = 20240612;
  const rnd = (): number => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const g: number[][] = [];
  for (let r = 0; r < N; r++) {
    g.push([]);
    for (let c = 0; c < N; c++) g[r].push(rnd() > 0.5 ? 1 : 0);
  }

  const finder = (r0: number, c0: number) => {
    for (let i = -1; i <= 7; i++) {
      for (let j = -1; j <= 7; j++) {
        const rr = r0 + i;
        const cc = c0 + j;
        if (rr < 0 || cc < 0 || rr >= N || cc >= N) continue;
        const edge = i === 0 || i === 6 || j === 0 || j === 6;
        const core = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        g[rr][cc] = i >= 0 && i <= 6 && j >= 0 && j <= 6 && (edge || core) ? 1 : 0;
      }
    }
  };
  finder(0, 0);
  finder(0, N - 7);
  finder(N - 7, 0);

  let d = '';
  for (let r = 0; r < N; r++) {
    let c = 0;
    while (c < N) {
      if (g[r][c]) {
        const start = c;
        while (c < N && g[r][c]) c++;
        d += `M${start} ${r}h${c - start}v1h-${c - start}z`;
      } else {
        c++;
      }
    }
  }
  return d;
}

export default function PlaceholderQR() {
  const d = useMemo(buildPath, []);
  return (
    <svg viewBox={`0 0 ${N} ${N}`} shapeRendering="crispEdges">
      <path d={d} fill="#000" />
    </svg>
  );
}
