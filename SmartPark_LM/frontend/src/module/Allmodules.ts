import type React from "react";

// backend (พอร์ต 5000) ใช้ hostname เดียวกับหน้าเว็บ ทำงานได้ทั้ง localhost และเครื่องอื่นใน LAN
export const API_BASE = `http://${window.location.hostname}:5000`;

function formInput(from: string, page: string, children: React.ReactNode) {
  return from === page && children;
}

export interface ApiResult<T = any> {
  ok: boolean;
  status: number; // 0 = ต่อ server ไม่ได้ / ถูกยกเลิก
  data: T | null;
  message: string; // ข้อความ error จาก backend (ถ้ามี)
  aborted: boolean;
}

interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  mimeType?: string; // default application/json (ไม่ใช้กับ FormData)
}

/** ตัวหลัก: ไม่ throw และไม่คืน undefined เสมอ */
async function request<T = any>(
  route: string,
  method: string = "GET",
  payload: object | FormData | null = null,
  opts: RequestOptions = {},
): Promise<ApiResult<T>> {
  const isForm = payload instanceof FormData;
  const headers: Record<string, string> = { ...opts.headers };

  // FormData ห้ามใส่ Content-Type เอง เบราว์เซอร์จะใส่ boundary ให้
  if (payload !== null && !isForm) {
    headers["Content-Type"] = (opts.mimeType ?? "application/json").toLowerCase();
  }

  try {
    const res = await fetch(`${API_BASE}/${route.replace(/^\//, "")}`, {
      method: method.toUpperCase(),
      headers,
      body: payload === null ? undefined : isForm ? payload : JSON.stringify(payload),
      signal: opts.signal,
    });

    const data = await res.json().catch(() => null);
    return {
      ok: res.ok,
      status: res.status,
      data,
      message: (data && (data.message ?? data.massage)) || "",
      aborted: false,
    };
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === "AbortError";
    if (!aborted) console.error("cannot connect server:", err);
    return { ok: false, status: 0, data: null, message: "", aborted };
  }
}

/** แบบเดิม (ให้ Login ฯลฯ ใช้ต่อได้) คืน json หรือ null เท่านั้น ไม่มี undefined */
async function sendRequest(
  _host: string, // เดิมคือพอร์ต ตอนนี้ใช้ API_BASE กลาง (คงพารามิเตอร์ไว้กันโค้ดเก่าพัง)
  route: string,
  method: string,
  mimeType: string = "application/json",
  payload: object | null = null,
) {
  const r = await request(route, method, payload, { mimeType });
  if (!r.ok) {
    if (r.status === 404) console.log(`Not Found: ${route}`);
    else if (r.status !== 0) console.error(`HTTP Error: ${r.status}`);
    return null;
  }
  return r.data;
}

export default { sendRequest, request, formInput };